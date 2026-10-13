using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/patients", (
            System.Security.Claims.ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            string? search,
            string? risk,
            CancellationToken cancellationToken) =>
            DashboardDatabaseOperations.GetPatients(principal, database, search, risk, cancellationToken));
        api.MapGet("/dashboard/overview", (
            System.Security.Claims.ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            DashboardDatabaseOperations.GetOverview(principal, database, cancellationToken));
        return api;
    }
}
