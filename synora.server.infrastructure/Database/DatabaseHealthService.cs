using Npgsql;

namespace Synora.Server.Infrastructure;

public sealed record DatabaseHealthResult(bool IsConnected, bool IsConfigured);

public static class DatabaseHealthService
{
    public static async Task<DatabaseHealthResult> CheckAsync(
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await database.OpenConnectionAsync(cancellationToken);
            await using var command = new NpgsqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync(cancellationToken);
            return new DatabaseHealthResult(IsConnected: true, IsConfigured: true);
        }
        catch (DatabaseNotConfiguredException)
        {
            return new DatabaseHealthResult(IsConnected: false, IsConfigured: false);
        }
        catch (NpgsqlException)
        {
            return new DatabaseHealthResult(IsConnected: false, IsConfigured: true);
        }
    }
}
