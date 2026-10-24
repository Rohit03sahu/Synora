using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

[ApiController]
[Authorize]
[Route("api/doctor")]
public sealed class DoctorController : ControllerBase
{
    private readonly ApiDatabaseProvider _database;

    public DoctorController(ApiDatabaseProvider database)
    {
        _database = database;
    }

    [HttpGet("profile")]
    public Task<IResult> GetProfile(CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetDoctorProfile(User, _database, cancellationToken);

    [HttpPut("profile")]
    public Task<IResult> SaveProfile(
        [FromBody] DoctorProfileUpdateRequest request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.SaveDoctorProfile(request, User, _database, cancellationToken);

    [HttpPost("profile/documents")]
    public Task<IResult> UploadCredential(
        [FromBody] DoctorCredentialUploadRequest request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.UploadCredential(request, User, _database, cancellationToken);

    [HttpPost("profile/submit")]
    public Task<IResult> SubmitProfile(CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.SubmitDoctorProfile(User, _database, cancellationToken);

    [HttpGet("directory")]
    public Task<IResult> GetDirectory(
        [FromQuery] string? search,
        [FromQuery] string? specialty,
        [FromQuery] string? location,
        [FromQuery] string? language,
        [FromQuery] string? mode,
        [FromQuery] int? minExperience,
        [FromQuery] decimal? maxFee,
        [FromQuery] string? availabilityDay,
        [FromQuery] string? sort,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetDirectory(
            User, _database, search, specialty, location, language, mode,
            minExperience, maxFee, availabilityDay, sort, cancellationToken);

    [HttpGet("directory/{doctorId:guid}")]
    public Task<IResult> GetDoctorDetails(Guid doctorId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetDoctorDetails(doctorId, User, _database, cancellationToken);

    [HttpGet("my-doctors")]
    public Task<IResult> GetMyDoctors(CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetMyDoctors(User, _database, cancellationToken);

    [HttpPost("requests")]
    public Task<IResult> CreateConsultationRequest(
        [FromBody] ConsultationRequestInput request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.CreateConsultationRequest(request, User, _database, cancellationToken);

    [HttpGet("requests")]
    public Task<IResult> GetConsultationRequests(
        [FromQuery] string? status,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetConsultationRequests(User, _database, status, cancellationToken);

    [HttpPut("requests/{requestId:guid}/response")]
    public Task<IResult> RespondToConsultation(
        Guid requestId,
        [FromBody] ConsultationResponseInput request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.RespondToConsultation(requestId, request, User, _database, cancellationToken);

    [HttpPut("requests/{requestId:guid}/sharing")]
    public Task<IResult> UpdateSharingConsent(
        Guid requestId,
        [FromBody] SharingConsentUpdateRequest request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.UpdateSharingConsent(requestId, request, User, _database, cancellationToken);

    [HttpGet("conversations")]
    public Task<IResult> GetConversations(CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetConversations(User, _database, cancellationToken);

    [HttpGet("conversations/{conversationId:guid}/messages")]
    public Task<IResult> GetMessages(Guid conversationId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetMessages(conversationId, User, _database, cancellationToken);

    [HttpPost("conversations/{conversationId:guid}/messages")]
    public Task<IResult> SendMessage(
        Guid conversationId,
        [FromBody] DoctorMessageInput request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.SendMessage(conversationId, request, User, _database, cancellationToken);

    [HttpGet("conversations/{conversationId:guid}/shared-record")]
    public Task<IResult> GetSharedRecord(Guid conversationId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetSharedRecord(conversationId, User, _database, cancellationToken);

    [HttpPost("conversations/{conversationId:guid}/block")]
    public Task<IResult> BlockConversation(Guid conversationId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.BlockConversation(conversationId, User, _database, cancellationToken);

    [HttpPost("conversations/{conversationId:guid}/report")]
    public Task<IResult> ReportConversation(
        Guid conversationId,
        [FromBody] ConversationReportInput request,
        CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.ReportConversation(conversationId, request, User, _database, cancellationToken);

    [HttpGet("notifications")]
    public Task<IResult> GetNotifications(CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.GetNotifications(User, _database, cancellationToken);

    [HttpPut("notifications/{notificationId:guid}/read")]
    public Task<IResult> ReadNotification(Guid notificationId, CancellationToken cancellationToken) =>
        DoctorDatabaseOperations.ReadNotification(notificationId, User, _database, cancellationToken);
}
