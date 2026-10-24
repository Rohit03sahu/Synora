using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[AllowAnonymous]
[Route("")]
public sealed class HealthController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public HealthController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("health")]
    public async Task<IResult> GetHealth(CancellationToken cancellationToken)
    {
        var health = await DatabaseHealthService.CheckAsync(_database, cancellationToken);
        return health.IsConnected
            ? Results.Ok(new { status = "ok", database = "connected" })
            : Results.Problem(
                title: health.IsConfigured ? "Database unavailable" : "Database is not configured",
                statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}
