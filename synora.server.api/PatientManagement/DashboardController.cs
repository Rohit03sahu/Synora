using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[Authorize]
[Route("api")]
public sealed class DashboardController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public DashboardController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("patients")]
    public Task<IResult> GetPatients(
        [FromQuery] string? search,
        [FromQuery] string? risk,
        CancellationToken cancellationToken) =>
        DashboardDatabaseOperations.GetPatients(User, _database, search, risk, cancellationToken);

    [HttpGet("dashboard/overview")]
    public Task<IResult> GetOverview(CancellationToken cancellationToken) =>
        DashboardDatabaseOperations.GetOverview(User, _database, cancellationToken);
}
