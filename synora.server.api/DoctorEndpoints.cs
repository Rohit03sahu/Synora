using System.Security.Claims;
using Synora.Server.Infrastructure;

namespace Synora.Server.Api;

public static class DoctorEndpoints
{
    public static RouteGroupBuilder MapDoctorEndpoints(this RouteGroupBuilder api)
    {
        var doctor = api.MapGroup("/doctor");

        doctor.MapGet("/profile", (ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetDoctorProfile(principal, database, token));
        doctor.MapPut("/profile", (DoctorProfileUpdateRequest request, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.SaveDoctorProfile(request, principal, database, token));
        doctor.MapPost("/profile/documents", (DoctorCredentialUploadRequest request, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.UploadCredential(request, principal, database, token));
        doctor.MapPost("/profile/submit", (ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.SubmitDoctorProfile(principal, database, token));

        doctor.MapGet("/directory", (ClaimsPrincipal principal, ApiDatabaseProvider database, string? search,
            string? specialty, string? location, string? language, string? mode, int? minExperience,
            decimal? maxFee, string? availabilityDay, string? sort, CancellationToken token) =>
            DoctorDatabaseOperations.GetDirectory(principal, database, search, specialty, location, language,
                mode, minExperience, maxFee, availabilityDay, sort, token));
        doctor.MapGet("/directory/{doctorId:guid}", (Guid doctorId, ClaimsPrincipal principal,
            ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetDoctorDetails(doctorId, principal, database, token));
        doctor.MapGet("/my-doctors", (ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetMyDoctors(principal, database, token));

        doctor.MapPost("/requests", (ConsultationRequestInput request, ClaimsPrincipal principal,
            ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.CreateConsultationRequest(request, principal, database, token));
        doctor.MapGet("/requests", (ClaimsPrincipal principal, ApiDatabaseProvider database, string? status, CancellationToken token) =>
            DoctorDatabaseOperations.GetConsultationRequests(principal, database, status, token));
        doctor.MapPut("/requests/{requestId:guid}/response", (Guid requestId, ConsultationResponseInput request,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.RespondToConsultation(requestId, request, principal, database, token));
        doctor.MapPut("/requests/{requestId:guid}/sharing", (Guid requestId, SharingConsentUpdateRequest request,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.UpdateSharingConsent(requestId, request, principal, database, token));

        doctor.MapGet("/conversations", (ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetConversations(principal, database, token));
        doctor.MapGet("/conversations/{conversationId:guid}/messages", (Guid conversationId,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetMessages(conversationId, principal, database, token));
        doctor.MapPost("/conversations/{conversationId:guid}/messages", (Guid conversationId,
            DoctorMessageInput request, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.SendMessage(conversationId, request, principal, database, token));
        doctor.MapGet("/conversations/{conversationId:guid}/shared-record", (Guid conversationId,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetSharedRecord(conversationId, principal, database, token));
        doctor.MapPost("/conversations/{conversationId:guid}/block", (Guid conversationId,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.BlockConversation(conversationId, principal, database, token));
        doctor.MapPost("/conversations/{conversationId:guid}/report", (Guid conversationId,
            ConversationReportInput request, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.ReportConversation(conversationId, request, principal, database, token));

        doctor.MapGet("/notifications", (ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetNotifications(principal, database, token));
        doctor.MapPut("/notifications/{notificationId:guid}/read", (Guid notificationId,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.ReadNotification(notificationId, principal, database, token));

        var admin = api.MapGroup("/admin/doctors");
        admin.MapGet("/applications", (ClaimsPrincipal principal, ApiDatabaseProvider database,
            string? status, CancellationToken token) =>
            DoctorDatabaseOperations.GetAdminDoctorQueue(principal, database, status, token));
        admin.MapGet("/{doctorId:guid}/documents", (Guid doctorId, ClaimsPrincipal principal,
            ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.GetDoctorDocuments(doctorId, principal, database, token));
        admin.MapGet("/{doctorId:guid}/documents/{documentId:guid}", (Guid doctorId, Guid documentId,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.DownloadDoctorDocument(doctorId, documentId, principal, database, token));
        admin.MapPut("/{doctorId:guid}/review", (Guid doctorId, DoctorReviewRequest request,
            ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken token) =>
            DoctorDatabaseOperations.ReviewDoctor(doctorId, request, principal, database, token));

        return api;
    }
}