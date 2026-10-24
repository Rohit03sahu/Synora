using System.Security.Claims;
using Npgsql;

namespace Synora.Server.Infrastructure;

public sealed class ApiDatabaseProvider : IAsyncDisposable
{
    private readonly NpgsqlDataSource? _dataSource;

    public ApiDatabaseProvider(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            _dataSource = NpgsqlDataSource.Create(connectionString);
        }
    }

    public ValueTask<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken) =>
        _dataSource is null
            ? ValueTask.FromException<NpgsqlConnection>(new DatabaseNotConfiguredException())
            : _dataSource.OpenConnectionAsync(cancellationToken);

    public async Task<AuthenticatedUserSession?> FindActiveSessionAsync(
        string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT p.id, p.email, p.phone, p.phone_confirmed_at
            FROM user_sessions s
            JOIN profiles p ON p.id = s.user_id
            WHERE s.token_hash = $1 AND s.expires_at > now()
              AND p.account_status = 'active' AND p.email_verified = true
            """,
            connection);
        command.Parameters.AddWithValue(tokenHash);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new AuthenticatedUserSession(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3));
    }

    public async Task RevokeSessionAsync(string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "DELETE FROM user_sessions WHERE token_hash = $1",
            connection);
        command.Parameters.AddWithValue(tokenHash);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        if (_dataSource is not null)
        {
            await _dataSource.DisposeAsync();
        }
    }
}

public sealed record AuthenticatedUserSession(
    Guid UserId,
    string Email,
    string? Phone,
    DateTimeOffset? PhoneConfirmedAt);

public sealed class DatabaseNotConfiguredException : Exception { }

public static class ApiUser
{
    public static Guid Id(ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId)
            ? userId
            : throw new InvalidOperationException("The authenticated user did not have a valid ID.");
    }
}
