using System.Text.Json;

namespace Synora.Server.Infrastructure;

public sealed record ProfileUpdateRequest(string FullName, string? Phone);

public sealed record OnboardingUpdateRequest(
    JsonElement PersonalInfo,
    JsonElement MedicalHistory,
    JsonElement FamilyHistory,
    JsonElement Lifestyle,
    JsonElement DiabetesHistory,
    JsonElement Devices,
    bool Completed);

public sealed record LabResultInput(
    string Parameter,
    string Result,
    string Unit,
    string Reference,
    string Date,
    string Status);

public sealed record ConsentUpdateRequest(
    bool LabData,
    bool CgmData,
    bool GenomicData,
    bool LifestyleData,
    bool InsulinDeviceData,
    bool ShareWithDoctor,
    bool ResearchParticipation);

public sealed record CgmReadingInput(DateTimeOffset RecordedAt, decimal GlucoseMgDl, string? Source);

public sealed record InsulinEventInput(
    DateTimeOffset RecordedAt,
    string EventType,
    decimal? CarbsGrams,
    decimal Units,
    string? Note,
    string? Source);

public sealed record InsulinBasalRateInput(int HourOfDay, decimal RateUnitsPerHour, string? Source);

public sealed record DeviceConnectionRequest(string Provider, string DeviceType, string DisplayName);

public sealed record GenomicVariantInput(
    string Gene,
    string VariantId,
    string Genotype,
    string RiskLevel,
    string? Description,
    string? Source);

public sealed record PatientListItem(
    Guid Id,
    string Name,
    int? Age,
    DateOnly? LastAssessment,
    string DataAvailable,
    string? Assessment,
    DateTimeOffset? LastUpdated);

public sealed record AuditItem(Guid Id, string Action, string Actor, DateTimeOffset CreatedAt);

public sealed record DoctorProfileUpdateRequest(
    string Specialty,
    string Qualifications,
    string RegistrationNumber,
    string IssuingCouncil,
    int ExperienceYears,
    string[] Expertise,
    string Affiliation,
    string[] Languages,
    string ClinicAddress,
    string[] ConsultationModes,
    decimal? ConsultationFee,
    string Biography,
    string[] Interests,
    JsonElement Availability,
    string? PhotoUrl);

public sealed record DoctorCredentialUploadRequest(string FileName, string ContentType, string FileBase64);
public sealed record DoctorReviewRequest(string Decision, string? Note);
public sealed record ConsultationRequestInput(
    Guid DoctorId,
    string ConsultationMode,
    DateTimeOffset? PreferredAt,
    string Message,
    string[] SharedSections,
    bool HealthDataConsent);
public sealed record ConsultationResponseInput(string Decision, DateTimeOffset? ScheduledAt);
public sealed record SharingConsentUpdateRequest(string[] SharedSections, bool HealthDataConsent);
public sealed record DoctorMessageInput(string Body);
public sealed record ConversationReportInput(string Reason);
