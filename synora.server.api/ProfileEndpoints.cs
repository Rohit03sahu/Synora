using System.Security.Claims;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

public static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/me", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.GetProfile(principal, database, cancellationToken));
        api.MapPut("/me", (
            ProfileUpdateRequest request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.UpdateProfile(request, principal, database, cancellationToken));
        api.MapGet("/audit", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            int? limit,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.GetAuditTrail(principal, database, limit, cancellationToken));
        api.MapGet("/notifications", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.GetNotifications(principal, database, cancellationToken));
        api.MapPut("/notifications", (
            NotificationUpdateRequest request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.UpdateNotifications(request, principal, database, cancellationToken));
        api.MapPost("/account-deletion-requests", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            ProfileDatabaseOperations.RequestAccountDeletion(principal, database, cancellationToken));
        return api;
    }
}
