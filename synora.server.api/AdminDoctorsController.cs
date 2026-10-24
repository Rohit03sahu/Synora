using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[Authorize]
[Route("api/admin/doctors")]
public sealed class AdminDoctorsController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public AdminDoctorsController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("applications")]
    public Task<IResult> GetApplications(
        [FromQuery] string? status,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetAdminDoctorQueue(User, _database, status, cancellationToken);

    [HttpGet("{doctorId:guid}/documents")]
    public Task<IResult> GetDocuments(Guid doctorId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetDoctorDocuments(doctorId, User, _database, cancellationToken);

    [HttpGet("{doctorId:guid}/documents/{documentId:guid}")]
    public Task<IResult> DownloadDocument(
        Guid doctorId,
        Guid documentId,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.DownloadDoctorDocument(
            doctorId, documentId, User, _database, cancellationToken);

    [HttpPut("{doctorId:guid}/review")]
    public Task<IResult> ReviewDoctor(
        Guid doctorId,
        [FromBody] DoctorReviewRequest request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.ReviewDoctor(doctorId, request, User, _database, cancellationToken);
}
