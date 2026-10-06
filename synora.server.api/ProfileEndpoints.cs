using System.Security.Claims;
using Npgsql;

namespace Synora.Server.Api;

public static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/me", GetProfile);
        api.MapPut("/me", UpdateProfile);
        api.MapGet("/audit", GetAuditTrail);
        api.MapGet("/notifications", GetNotifications);
        api.MapPut("/notifications", UpdateNotifications);
        api.MapPost("/account-deletion-requests", RequestAccountDeletion);
        return api;
    }

    private static async Task<IResult> GetProfile(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO profiles (id, email)
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(email);
        await command.ExecuteNonQueryAsync(cancellationToken);

        await using var select = new NpgsqlCommand(
            "SELECT id, email, full_name, phone, role, created_at FROM profiles WHERE id = $1",
            connection);
        select.Parameters.AddWithValue(userId);
        await using var reader = await select.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.Problem("Profile could not be loaded.", statusCode: StatusCodes.Status500InternalServerError);
        }

        return Results.Ok(new
        {
            id = reader.GetGuid(0),
            email = reader.GetString(1),
            fullName = reader.GetString(2),
            phone = reader.IsDBNull(3) ? null : reader.GetString(3),
            role = reader.GetString(4),
            createdAt = reader.GetFieldValue<DateTimeOffset>(5),
        });
    }

    private static async Task<IResult> UpdateProfile(
        ProfileUpdateRequest request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Length > 200 ||
            request.Phone is { Length: > 40 })
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.FullName)] = ["A name of at most 200 characters is required."],
                [nameof(request.Phone)] = ["Phone must be at most 40 characters."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            UPDATE profiles
            SET full_name = $2, phone = $3
            WHERE id = $1
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.FullName.Trim());
        command.Parameters.AddWithValue((object?)request.Phone?.Trim() ?? DBNull.Value);
        var rows = await command.ExecuteNonQueryAsync(cancellationToken);
        return rows == 0
            ? Results.NotFound()
            : Results.NoContent();
    }

    private static async Task<IResult> GetAuditTrail(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        int? limit,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        var rowLimit = Math.Clamp(limit ?? 50, 1, 100);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, action, actor, created_at
            FROM audit_trail
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(rowLimit);

        var entries = new List<AuditItem>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            entries.Add(new AuditItem(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetFieldValue<DateTimeOffset>(3)));
        }

        return Results.Ok(entries);
    }

    private static async Task<IResult> GetNotifications(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT assessment_updates, data_source_alerts, lab_processing, weekly_summary, product_updates
            FROM notification_preferences
            WHERE user_id = $1
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.Ok(new
            {
                assessmentUpdates = true,
                dataSourceAlerts = true,
                labProcessing = true,
                weeklySummary = false,
                productUpdates = false,
            });
        }

        return Results.Ok(new
        {
            assessmentUpdates = reader.GetBoolean(0),
            dataSourceAlerts = reader.GetBoolean(1),
            labProcessing = reader.GetBoolean(2),
            weeklySummary = reader.GetBoolean(3),
            productUpdates = reader.GetBoolean(4),
        });
    }

    private static async Task<IResult> UpdateNotifications(
        NotificationUpdateRequest request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO notification_preferences
              (user_id, assessment_updates, data_source_alerts, lab_processing, weekly_summary, product_updates)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) DO UPDATE SET
              assessment_updates = EXCLUDED.assessment_updates,
              data_source_alerts = EXCLUDED.data_source_alerts,
              lab_processing = EXCLUDED.lab_processing,
              weekly_summary = EXCLUDED.weekly_summary,
              product_updates = EXCLUDED.product_updates,
              updated_at = now()
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.AssessmentUpdates);
        command.Parameters.AddWithValue(request.DataSourceAlerts);
        command.Parameters.AddWithValue(request.LabProcessing);
        command.Parameters.AddWithValue(request.WeeklySummary);
        command.Parameters.AddWithValue(request.ProductUpdates);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> RequestAccountDeletion(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        var actor = principal.FindFirstValue(ClaimTypes.Email) ?? "User";
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var request = new NpgsqlCommand(
            """
            INSERT INTO account_deletion_requests (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO UPDATE SET
              requested_at = now(),
              status = 'pending',
              completed_at = NULL
            RETURNING id, requested_at, status
            """,
            connection,
            transaction);
        request.Parameters.AddWithValue(userId);
        await using var reader = await request.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var result = new
        {
            id = reader.GetGuid(0),
            requestedAt = reader.GetFieldValue<DateTimeOffset>(1),
            status = reader.GetString(2),
        };
        await reader.CloseAsync();

        await using var audit = new NpgsqlCommand(
            "INSERT INTO audit_trail (user_id, action, actor) VALUES ($1, $2, $3)",
            connection,
            transaction);
        audit.Parameters.AddWithValue(userId);
        audit.Parameters.AddWithValue("Account deletion requested");
        audit.Parameters.AddWithValue(actor);
        await audit.ExecuteNonQueryAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Accepted(value: result);
    }
}

public sealed record NotificationUpdateRequest(
    bool AssessmentUpdates,
    bool DataSourceAlerts,
    bool LabProcessing,
    bool WeeklySummary,
    bool ProductUpdates);
