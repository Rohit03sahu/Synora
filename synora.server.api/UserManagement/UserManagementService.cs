using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Npgsql;
using NpgsqlTypes;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api.UserManagement;

public sealed class UserManagementException(int statusCode, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public int StatusCode { get; } = statusCode;
}

public sealed record AccountSession(string AccessToken, DateTimeOffset ExpiresAt);

public sealed class UserManagementService(
    ApiDatabaseProvider database,
    IAccountEmailSender emailSender,
    IAccountSmsSender smsSender,
    ILogger<UserManagementService> logger)
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(7);
    private static readonly Regex E164Phone = new(@"^\+[1-9]\d{7,14}$", RegexOptions.Compiled);
    private static readonly string DummyPasswordHash = PasswordCredential.Hash("synora-invalid-login");

    public async Task RegisterAsync(
        string email,
        string password,
        string fullName,
        string? phone,
        CancellationToken cancellationToken)
    {
        email = NormalizeEmail(email);
        fullName = fullName.Trim();
        if (fullName.Length == 0 || fullName.Length > 200 || phone is { Length: > 40 })
        {
            throw new UserManagementException(
                StatusCodes.Status400BadRequest,
                "Enter a name of at most 200 characters and a phone number of at most 40 characters.");
        }

        var userId = Guid.NewGuid();
        var token = AccountToken.Create();

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using (var insert = new NpgsqlCommand(
            """
            INSERT INTO profiles
              (id, email, full_name, phone, password_hash, email_verified, account_status)
            VALUES ($1, $2, $3, $4, $5, false, 'pending_verification')
            """,
            connection,
            transaction))
        {
            insert.Parameters.AddWithValue(userId);
            insert.Parameters.AddWithValue(email);
            insert.Parameters.AddWithValue(fullName);
            insert.Parameters.AddWithValue(
                NpgsqlDbType.Text,
                (object?)phone?.Trim() ?? DBNull.Value);
            insert.Parameters.AddWithValue(PasswordCredential.Hash(password));
            try
            {
                await insert.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (PostgresException exception) when (exception.SqlState == "23505")
            {
                throw new UserManagementException(
                    StatusCodes.Status409Conflict,
                    "An account with this email address already exists.");
            }
        }

        await InsertActionTokenAsync(
            connection,
            transaction,
            userId,
            "email_verification",
            token,
            DateTimeOffset.UtcNow.AddHours(24),
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await SendVerificationEmailAsync(email, fullName, token, cancellationToken);
    }

    public async Task<bool> VerifyEmailAsync(string token, CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? userId;
        await using (var consume = new NpgsqlCommand(
            """
            DELETE FROM user_action_tokens
            WHERE token_hash = $1 AND purpose = 'email_verification' AND expires_at > now()
            RETURNING user_id
            """,
            connection,
            transaction))
        {
            consume.Parameters.AddWithValue(AccountToken.Hash(token));
            var result = await consume.ExecuteScalarAsync(cancellationToken);
            userId = result is Guid value ? value : null;
        }

        if (userId is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return false;
        }

        await using (var activate = new NpgsqlCommand(
            """
            UPDATE profiles
            SET email_verified = true,
                account_status = CASE WHEN account_status = 'pending_verification' THEN 'active' ELSE account_status END
            WHERE id = $1
            """,
            connection,
            transaction))
        {
            activate.Parameters.AddWithValue(userId.Value);
            await activate.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task ResendVerificationEmailAsync(string email, CancellationToken cancellationToken)
    {
        email = NormalizeEmail(email);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? userId = null;
        string? fullName = null;
        await using (var select = new NpgsqlCommand(
            """
            SELECT id, full_name
            FROM profiles
            WHERE lower(email) = $1 AND email_verified = false AND account_status = 'pending_verification'
            """,
            connection,
            transaction))
        {
            select.Parameters.AddWithValue(email);
            await using var reader = await select.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                userId = reader.GetGuid(0);
                fullName = reader.GetString(1);
            }
        }

        if (userId is null)
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var token = AccountToken.Create();
        await InsertActionTokenAsync(
            connection,
            transaction,
            userId.Value,
            "email_verification",
            token,
            DateTimeOffset.UtcNow.AddHours(24),
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await SendVerificationEmailAsync(email, fullName!, token, cancellationToken);
    }

    public async Task<AccountSession> SignInAsync(
        string email, string password, CancellationToken cancellationToken)
    {
        email = NormalizeEmail(email);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, password_hash, email_verified, account_status
            FROM profiles
            WHERE lower(email) = $1
            """,
            connection);
        command.Parameters.AddWithValue(email);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            PasswordCredential.Verify(password, DummyPasswordHash);
            throw new UserManagementException(StatusCodes.Status401Unauthorized, "Email or password is incorrect.");
        }

        var userId = reader.GetGuid(0);
        var passwordHash = reader.IsDBNull(1) ? null : reader.GetString(1);
        var emailVerified = reader.GetBoolean(2);
        var accountStatus = reader.GetString(3);
        await reader.CloseAsync();

        var passwordMatches = PasswordCredential.Verify(password, passwordHash ?? DummyPasswordHash);
        if (passwordHash is null || !passwordMatches)
        {
            throw new UserManagementException(StatusCodes.Status401Unauthorized, "Email or password is incorrect.");
        }
        if (!emailVerified)
        {
            throw new UserManagementException(StatusCodes.Status403Forbidden, "Confirm your email address before signing in.");
        }
        if (accountStatus != "active")
        {
            throw new UserManagementException(StatusCodes.Status403Forbidden, "This account is not active.");
        }

        var token = AccountToken.Create();
        var expiresAt = DateTimeOffset.UtcNow.Add(SessionLifetime);
        await using var insertSession = new NpgsqlCommand(
            "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
            connection);
        insertSession.Parameters.AddWithValue(AccountToken.Hash(token));
        insertSession.Parameters.AddWithValue(userId);
        insertSession.Parameters.AddWithValue(expiresAt);
        await insertSession.ExecuteNonQueryAsync(cancellationToken);
        return new AccountSession(token, expiresAt);
    }

    public async Task SignOutAsync(string token, CancellationToken cancellationToken)
    {
        await database.RevokeSessionAsync(AccountToken.Hash(token), cancellationToken);
    }

    public async Task ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        string currentSessionToken,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using (var select = new NpgsqlCommand(
            "SELECT password_hash FROM profiles WHERE id = $1 FOR UPDATE",
            connection,
            transaction))
        {
            select.Parameters.AddWithValue(userId);
            var storedHash = await select.ExecuteScalarAsync(cancellationToken) as string;
            if (!PasswordCredential.Verify(currentPassword, storedHash))
            {
                throw new UserManagementException(
                    StatusCodes.Status400BadRequest,
                    "The current password is incorrect.");
            }
        }

        await using (var update = new NpgsqlCommand(
            "UPDATE profiles SET password_hash = $2 WHERE id = $1",
            connection,
            transaction))
        {
            update.Parameters.AddWithValue(userId);
            update.Parameters.AddWithValue(PasswordCredential.Hash(newPassword));
            await update.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var revokeOtherSessions = new NpgsqlCommand(
            "DELETE FROM user_sessions WHERE user_id = $1 AND token_hash <> $2",
            connection,
            transaction))
        {
            revokeOtherSessions.Parameters.AddWithValue(userId);
            revokeOtherSessions.Parameters.AddWithValue(AccountToken.Hash(currentSessionToken));
            await revokeOtherSessions.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken)
    {
        email = NormalizeEmail(email);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? userId = null;
        await using (var select = new NpgsqlCommand(
            "SELECT id FROM profiles WHERE lower(email) = $1",
            connection,
            transaction))
        {
            select.Parameters.AddWithValue(email);
            var result = await select.ExecuteScalarAsync(cancellationToken);
            userId = result is Guid value ? value : null;
        }

        if (userId is null)
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var token = AccountToken.Create();
        await InsertActionTokenAsync(
            connection,
            transaction,
            userId.Value,
            "password_reset",
            token,
            DateTimeOffset.UtcNow.AddHours(1),
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        try
        {
            await emailSender.SendPasswordResetAsync(email, token, cancellationToken);
        }
        catch (AccountNotificationException exception)
        {
            logger.LogError(exception, "Password reset email delivery failed.");
            throw new UserManagementException(
                StatusCodes.Status503ServiceUnavailable,
                "Password reset email delivery is unavailable.",
                exception);
        }
    }

    public async Task ResetPasswordAsync(
        string token, string newPassword, CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? userId;
        await using (var consume = new NpgsqlCommand(
            """
            DELETE FROM user_action_tokens
            WHERE token_hash = $1 AND purpose = 'password_reset' AND expires_at > now()
            RETURNING user_id
            """,
            connection,
            transaction))
        {
            consume.Parameters.AddWithValue(AccountToken.Hash(token));
            var result = await consume.ExecuteScalarAsync(cancellationToken);
            userId = result is Guid value ? value : null;
        }

        if (userId is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new UserManagementException(StatusCodes.Status400BadRequest, "This password reset link is invalid or expired.");
        }

        await using (var update = new NpgsqlCommand(
            """
            UPDATE profiles
            SET password_hash = $2,
                email_verified = true,
                account_status = CASE WHEN account_status = 'pending_verification' THEN 'active' ELSE account_status END
            WHERE id = $1
            """,
            connection,
            transaction))
        {
            update.Parameters.AddWithValue(userId.Value);
            update.Parameters.AddWithValue(PasswordCredential.Hash(newPassword));
            await update.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var revoke = new NpgsqlCommand(
            "DELETE FROM user_sessions WHERE user_id = $1",
            connection,
            transaction))
        {
            revoke.Parameters.AddWithValue(userId.Value);
            await revoke.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task SendPhoneVerificationCodeAsync(
        Guid userId, string phone, CancellationToken cancellationToken)
    {
        phone = phone.Trim();
        if (!E164Phone.IsMatch(phone))
        {
            throw new UserManagementException(
                StatusCodes.Status400BadRequest,
                "Enter a valid phone number in E.164 format, such as +14155552671.");
        }

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using (var cooldown = new NpgsqlCommand(
            """
            SELECT created_at > now() - interval '60 seconds'
            FROM user_phone_verifications
            WHERE user_id = $1
            """,
            connection,
            transaction))
        {
            cooldown.Parameters.AddWithValue(userId);
            if (await cooldown.ExecuteScalarAsync(cancellationToken) is true)
            {
                throw new UserManagementException(
                    StatusCodes.Status429TooManyRequests,
                    "Wait 60 seconds before requesting another verification code.");
            }
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await using (var upsert = new NpgsqlCommand(
            """
            INSERT INTO user_phone_verifications(user_id, phone, code_hash, attempts, created_at, expires_at)
            VALUES ($1, $2, $3, 0, now(), now() + interval '10 minutes')
            ON CONFLICT (user_id) DO UPDATE
            SET phone = EXCLUDED.phone, code_hash = EXCLUDED.code_hash, attempts = 0,
                created_at = now(), expires_at = EXCLUDED.expires_at
            """,
            connection,
            transaction))
        {
            upsert.Parameters.AddWithValue(userId);
            upsert.Parameters.AddWithValue(phone);
            upsert.Parameters.AddWithValue(PasswordCredential.Hash(code));
            await upsert.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);

        try
        {
            await smsSender.SendVerificationCodeAsync(phone, code, cancellationToken);
        }
        catch (AccountNotificationException exception)
        {
            logger.LogError(exception, "Phone verification SMS delivery failed.");
            throw new UserManagementException(
                StatusCodes.Status503ServiceUnavailable,
                "Phone verification SMS delivery is unavailable.",
                exception);
        }
    }

    public async Task VerifyPhoneCodeAsync(
        Guid userId, string phone, string code, CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        string? storedPhone = null;
        string? storedHash = null;
        var attempts = 5;
        var notExpired = false;
        await using (var select = new NpgsqlCommand(
            """
            SELECT phone, code_hash, attempts, expires_at > now()
            FROM user_phone_verifications
            WHERE user_id = $1
            FOR UPDATE
            """,
            connection,
            transaction))
        {
            select.Parameters.AddWithValue(userId);
            await using var reader = await select.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                storedPhone = reader.GetString(0);
                storedHash = reader.GetString(1);
                attempts = reader.GetInt16(2);
                notExpired = reader.GetBoolean(3);
            }
        }

        var valid = storedPhone == phone.Trim() &&
                    notExpired &&
                    attempts < 5 &&
                    PasswordCredential.Verify(code, storedHash);
        if (!valid)
        {
            if (storedHash is not null && attempts < 5)
            {
                await using var countAttempt = new NpgsqlCommand(
                    "UPDATE user_phone_verifications SET attempts = attempts + 1 WHERE user_id = $1",
                    connection,
                    transaction);
                countAttempt.Parameters.AddWithValue(userId);
                await countAttempt.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            throw new UserManagementException(
                StatusCodes.Status400BadRequest,
                "The phone verification code is invalid or expired.");
        }

        await using (var updateProfile = new NpgsqlCommand(
            "UPDATE profiles SET phone = $2, phone_confirmed_at = now() WHERE id = $1",
            connection,
            transaction))
        {
            updateProfile.Parameters.AddWithValue(userId);
            updateProfile.Parameters.AddWithValue(storedPhone!);
            await updateProfile.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var deleteCode = new NpgsqlCommand(
            "DELETE FROM user_phone_verifications WHERE user_id = $1",
            connection,
            transaction))
        {
            deleteCode.Parameters.AddWithValue(userId);
            await deleteCode.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task SendVerificationEmailAsync(
        string email, string fullName, string token, CancellationToken cancellationToken)
    {
        try
        {
            await emailSender.SendVerificationAsync(email, fullName, token, cancellationToken);
        }
        catch (AccountNotificationException exception)
        {
            logger.LogError(exception, "Account verification email delivery failed.");
            throw new UserManagementException(
                StatusCodes.Status503ServiceUnavailable,
                "Your account was created, but the verification email could not be delivered. Request a new verification email to continue.",
                exception);
        }
    }

    private static async Task InsertActionTokenAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        Guid userId,
        string purpose,
        string token,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO user_action_tokens(token_hash, user_id, purpose, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, purpose) DO UPDATE
            SET token_hash = EXCLUDED.token_hash, created_at = now(), expires_at = EXCLUDED.expires_at
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue(AccountToken.Hash(token));
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(purpose);
        command.Parameters.AddWithValue(expiresAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
