using System.Security.Claims;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

public static class PatientDataEndpoints
{
    public static RouteGroupBuilder MapPatientDataEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/onboarding", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetOnboarding(principal, database, cancellationToken));
        api.MapPut("/onboarding", (
            OnboardingUpdateRequest request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.UpdateOnboarding(request, principal, database, cancellationToken));
        api.MapGet("/labs", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetLabs(principal, database, cancellationToken));
        api.MapPost("/labs", (
            List<LabResultInput> request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.AddLabs(request, principal, database, cancellationToken));
        api.MapDelete("/labs/{id:guid}", (
            Guid id,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.DeleteLab(id, principal, database, cancellationToken));
        api.MapGet("/consent", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetConsent(principal, database, cancellationToken));
        api.MapPut("/consent", (
            ConsentUpdateRequest request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.UpdateConsent(request, principal, database, cancellationToken));
        api.MapGet("/cgm", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            int? days,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetCgmReadings(principal, database, days, cancellationToken));
        api.MapPost("/cgm", (
            List<CgmReadingInput> request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.AddCgmReadings(request, principal, database, cancellationToken));
        api.MapGet("/insulin", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetInsulinData(principal, database, cancellationToken));
        api.MapPost("/insulin/events", (
            List<InsulinEventInput> request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.AddInsulinEvents(request, principal, database, cancellationToken));
        api.MapPost("/insulin/basal-rates", (
            List<InsulinBasalRateInput> request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.SaveBasalRates(request, principal, database, cancellationToken));
        api.MapGet("/devices", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetDevices(principal, database, cancellationToken));
        api.MapPost("/devices", (
            DeviceConnectionRequest request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.RequestDeviceConnection(request, principal, database, cancellationToken));
        api.MapGet("/genomics", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetGenomics(principal, database, cancellationToken));
        api.MapPost("/genomics", (
            List<GenomicVariantInput> request,
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.AddGenomicVariants(request, principal, database, cancellationToken));
        api.MapGet("/assessments", (
            ClaimsPrincipal principal,
            ApiDatabaseProvider database,
            CancellationToken cancellationToken) =>
            PatientDataDatabaseOperations.GetAssessments(principal, database, cancellationToken));
        return api;
    }
}
