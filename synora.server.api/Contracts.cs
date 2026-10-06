using System.Text.Json;

namespace Synora.Server.Api;

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
