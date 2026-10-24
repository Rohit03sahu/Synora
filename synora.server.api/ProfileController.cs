using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[Authorize]
[Route("api")]
public sealed class ProfileController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public ProfileController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("me")]
    public Task<IResult> GetProfile(CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.GetProfile(User, _database, cancellationToken);

    [HttpPut("me")]
    public Task<IResult> UpdateProfile(
        [FromBody] ProfileUpdateRequest request,
        CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.UpdateProfile(request, User, _database, cancellationToken);

    [HttpGet("audit")]
    public Task<IResult> GetAuditTrail(
        [FromQuery] int? limit,
        CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.GetAuditTrail(User, _database, limit, cancellationToken);

    [HttpGet("notifications")]
    public Task<IResult> GetNotifications(CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.GetNotifications(User, _database, cancellationToken);

    [HttpPut("notifications")]
    public Task<IResult> UpdateNotifications(
        [FromBody] NotificationUpdateRequest request,
        CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.UpdateNotifications(request, User, _database, cancellationToken);

    [HttpPost("account-deletion-requests")]
    public Task<IResult> RequestAccountDeletion(CancellationToken cancellationToken) =>
        ProfileDatabaseOperations.RequestAccountDeletion(User, _database, cancellationToken);
}
