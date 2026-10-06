using System.Security.Claims;
using Npgsql;

namespace Synora.Server.Api;

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

    public async ValueTask DisposeAsync()
    {
        if (_dataSource is not null)
        {
            await _dataSource.DisposeAsync();
        }
    }
}

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
