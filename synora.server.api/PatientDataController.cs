using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[Authorize]
[Route("api")]
public sealed class PatientDataController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public PatientDataController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("onboarding")]
    public Task<IResult> GetOnboarding(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetOnboarding(User, _database, cancellationToken);

    [HttpPut("onboarding")]
    public Task<IResult> UpdateOnboarding(
        [FromBody] OnboardingUpdateRequest request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.UpdateOnboarding(request, User, _database, cancellationToken);

    [HttpGet("labs")]
    public Task<IResult> GetLabs(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetLabs(User, _database, cancellationToken);

    [HttpPost("labs")]
    public Task<IResult> AddLabs(
        [FromBody] List<LabResultInput> request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.AddLabs(request, User, _database, cancellationToken);

    [HttpDelete("labs/{id:guid}")]
    public Task<IResult> DeleteLab(Guid id, CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.DeleteLab(id, User, _database, cancellationToken);

    [HttpGet("consent")]
    public Task<IResult> GetConsent(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetConsent(User, _database, cancellationToken);

    [HttpPut("consent")]
    public Task<IResult> UpdateConsent(
        [FromBody] ConsentUpdateRequest request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.UpdateConsent(request, User, _database, cancellationToken);

    [HttpGet("cgm")]
    public Task<IResult> GetCgmReadings(
        [FromQuery] int? days,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetCgmReadings(User, _database, days, cancellationToken);

    [HttpPost("cgm")]
    public Task<IResult> AddCgmReadings(
        [FromBody] List<CgmReadingInput> request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.AddCgmReadings(request, User, _database, cancellationToken);

    [HttpGet("insulin")]
    public Task<IResult> GetInsulinData(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetInsulinData(User, _database, cancellationToken);

    [HttpPost("insulin/events")]
    public Task<IResult> AddInsulinEvents(
        [FromBody] List<InsulinEventInput> request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.AddInsulinEvents(request, User, _database, cancellationToken);

    [HttpPost("insulin/basal-rates")]
    public Task<IResult> SaveBasalRates(
        [FromBody] List<InsulinBasalRateInput> request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.SaveBasalRates(request, User, _database, cancellationToken);

    [HttpGet("devices")]
    public Task<IResult> GetDevices(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetDevices(User, _database, cancellationToken);

    [HttpPost("devices")]
    public Task<IResult> RequestDeviceConnection(
        [FromBody] DeviceConnectionRequest request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.RequestDeviceConnection(request, User, _database, cancellationToken);

    [HttpGet("genomics")]
    public Task<IResult> GetGenomics(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetGenomics(User, _database, cancellationToken);

    [HttpPost("genomics")]
    public Task<IResult> AddGenomicVariants(
        [FromBody] List<GenomicVariantInput> request,
        CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.AddGenomicVariants(request, User, _database, cancellationToken);

    [HttpGet("assessments")]
    public Task<IResult> GetAssessments(CancellationToken cancellationToken) =>
        PatientDataDatabaseOperations.GetAssessments(User, _database, cancellationToken);
}
