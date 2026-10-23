using System.Security.Claims;
using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace Synora.Server.Infrastructure;

public static class DoctorDatabaseOperations
{
    private static readonly HashSet<string> Specialties =
    ["Endocrinologist", "Diabetologist", "General Physician", "Cardiologist", "Nutritionist / Diabetes Educator"];
    private static readonly HashSet<string> ConsultationModes = ["online", "in_person"];
    private static readonly HashSet<string> Weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    private static readonly HashSet<string> ShareableSections =
    ["questionnaire", "labs", "cgm", "insulin", "genomics", "assessments"];
    private static readonly HashSet<string> VerificationStatuses = ["draft", "pending_verification", "approved", "rejected"];

    public static async Task<IResult> GetDoctorProfile(
        ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            SELECT p.full_name, dp.specialty, dp.qualifications, dp.registration_number,
                   dp.issuing_council, dp.experience_years, dp.expertise, dp.affiliation,
                   dp.languages, dp.clinic_address, dp.consultation_modes, dp.consultation_fee,
                   dp.biography, dp.interests, dp.availability, dp.photo_url,
                   dp.verification_status, dp.review_note, dp.submitted_at, dp.reviewed_at
            FROM doctor_profiles dp JOIN profiles p ON p.id = dp.user_id
            WHERE dp.user_id = $1
            """, connection);
        command.Parameters.AddWithValue(userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return Results.Ok(new { profile = (object?)null, documentCount = 0 });
        var profile = ReadDoctorProfile(reader, userId);
        await reader.CloseAsync();
        await using var count = new NpgsqlCommand(
            "SELECT count(*) FROM doctor_credential_documents WHERE doctor_id = $1", connection);
        count.Parameters.AddWithValue(userId);
        var documentCount = (long)(await count.ExecuteScalarAsync(cancellationToken) ?? 0L);
        return Results.Ok(new { profile, documentCount });
    }

    public static async Task<IResult> SaveDoctorProfile(
        DoctorProfileUpdateRequest request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (!IsValidDoctorProfile(request)) return Validation("Review required profile fields and values.");
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using var existing = new NpgsqlCommand(
            "SELECT verification_status FROM doctor_profiles WHERE user_id = $1", connection);
        existing.Parameters.AddWithValue(userId);
        var currentStatus = await existing.ExecuteScalarAsync(cancellationToken) as string;
        if (currentStatus == "pending_verification")
            return Results.Conflict(new { message = "Your credentials are under review. You cannot edit this profile until the review is complete." });

        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            INSERT INTO doctor_profiles
              (user_id, specialty, qualifications, registration_number, issuing_council,
               experience_years, expertise, affiliation, languages, clinic_address,
               consultation_modes, consultation_fee, biography, interests, availability,
               photo_url, verification_status, review_note, submitted_at, reviewed_by, reviewed_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'draft',NULL,NULL,NULL,NULL,now())
            ON CONFLICT (user_id) DO UPDATE SET
              specialty=EXCLUDED.specialty, qualifications=EXCLUDED.qualifications,
              registration_number=EXCLUDED.registration_number, issuing_council=EXCLUDED.issuing_council,
              experience_years=EXCLUDED.experience_years, expertise=EXCLUDED.expertise,
              affiliation=EXCLUDED.affiliation, languages=EXCLUDED.languages,
              clinic_address=EXCLUDED.clinic_address, consultation_modes=EXCLUDED.consultation_modes,
              consultation_fee=EXCLUDED.consultation_fee, biography=EXCLUDED.biography,
              interests=EXCLUDED.interests, availability=EXCLUDED.availability,
              photo_url=EXCLUDED.photo_url,
              verification_status=CASE WHEN doctor_profiles.verification_status='approved'
                THEN 'pending_verification' ELSE 'draft' END,
                            review_note=NULL,
                            submitted_at=CASE WHEN doctor_profiles.verification_status='approved' THEN now() ELSE NULL END,
                            reviewed_by=NULL, reviewed_at=NULL, updated_at=now()
            """, connection, transaction);
        AddDoctorProfileParameters(command, userId, request);
        try { await command.ExecuteNonQueryAsync(cancellationToken); }
        catch (PostgresException exception) when (exception.SqlState == "23505")
        { return Results.Conflict(new { message = "This registration number is already associated with an application." }); }
        if (currentStatus == "approved")
            await NotifyAdminsAsync(connection, transaction, "doctor_application", "Doctor profile update submitted",
                "An approved clinician updated their professional profile and needs a verification review.", userId, cancellationToken);
        await AddAuditAsync(connection, transaction, userId, "Doctor profile saved", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    public static async Task<IResult> UploadCredential(
        DoctorCredentialUploadRequest request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (request.FileName.Length is < 1 or > 180 ||
            request.ContentType is not ("application/pdf" or "image/jpeg" or "image/png") ||
            request.FileBase64.Length > 7_000_000)
            return Validation("Upload a PDF, JPEG, or PNG file under 5 MB.");
        byte[] file;
        try { file = Convert.FromBase64String(request.FileBase64); }
        catch (FormatException) { return Validation("The uploaded file was not valid base64 data."); }
        if (file.Length is < 8 or > 5 * 1024 * 1024 || !MatchesSignature(file, request.ContentType))
            return Validation("The file content does not match a supported document type or size.");

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            INSERT INTO doctor_profiles(user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;
            """, connection, transaction);
        command.Parameters.AddWithValue(userId);
        await command.ExecuteNonQueryAsync(cancellationToken);
        await using var insert = new NpgsqlCommand("""
            INSERT INTO doctor_credential_documents(doctor_id, document_name, content_type, file_data)
            SELECT $1, $2, $3, $4
            WHERE EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id=$1 AND verification_status IN ('draft','rejected'))
            """, connection, transaction);
        insert.Parameters.AddWithValue(userId);
        insert.Parameters.AddWithValue(Path.GetFileName(request.FileName));
        insert.Parameters.AddWithValue(request.ContentType);
        insert.Parameters.AddWithValue(NpgsqlDbType.Bytea, file);
        if (await insert.ExecuteNonQueryAsync(cancellationToken) == 0)
            return Results.Conflict(new { message = "Credentials are currently under review or the application is unavailable." });
        await AddAuditAsync(connection, transaction, userId, "Doctor credential uploaded", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created("/api/doctor/profile/documents", new { uploaded = true });
    }

    public static async Task<IResult> SubmitDoctorProfile(
        ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        var verifiedPhone = principal.FindFirstValue("supabase_phone");
        var phoneConfirmedAt = principal.FindFirstValue("supabase_phone_confirmed_at");
        if (string.IsNullOrWhiteSpace(verifiedPhone) || string.IsNullOrWhiteSpace(phoneConfirmedAt))
            return Results.Conflict(new { message = "Verify your mobile number with the SMS code before submitting." });

        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using (var phone = new NpgsqlCommand("SELECT phone FROM profiles WHERE id=$1", connection))
        {
            phone.Parameters.AddWithValue(userId);
            var profilePhone = await phone.ExecuteScalarAsync(cancellationToken) as string;
            if (string.IsNullOrWhiteSpace(profilePhone) || NormalizePhone(profilePhone) != NormalizePhone(verifiedPhone))
                return Results.Conflict(new { message = "The verified mobile number must match your professional profile." });
        }
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            UPDATE doctor_profiles SET verification_status='pending_verification', submitted_at=now(),
              review_note=NULL, updated_at=now()
            WHERE user_id=$1 AND verification_status IN ('draft','rejected')
              AND specialty <> '' AND qualifications <> '' AND registration_number <> ''
              AND issuing_council <> '' AND biography <> ''
              AND EXISTS (SELECT 1 FROM doctor_credential_documents d WHERE d.doctor_id=$1)
            RETURNING user_id
            """, connection, transaction);
        command.Parameters.AddWithValue(userId);
        var submitted = await command.ExecuteScalarAsync(cancellationToken);
        if (submitted is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Results.Conflict(new { message = "Complete the required profile fields and upload at least one credential before submitting." });
        }
        await NotifyAdminsAsync(connection, transaction, "doctor_application", "Doctor application submitted", "A clinician profile is ready for credential review.", userId, cancellationToken);
        await AddAuditAsync(connection, transaction, userId, "Doctor application submitted", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Accepted(value: new { status = "pending_verification" });
    }

    public static async Task<IResult> GetDirectory(
        ClaimsPrincipal principal, ApiDatabaseProvider database, string? search, string? specialty,
        string? location, string? language, string? mode, int? minExperience, decimal? maxFee,
        string? availabilityDay, string? sort, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role != "patient") return Results.Forbid();
        var order = sort switch
        {
            "experience" => "dp.experience_years DESC, p.full_name ASC",
            "availability" => "dp.availability::text ASC, p.full_name ASC",
            "specialty" => "dp.specialty ASC, p.full_name ASC",
            _ => "p.full_name ASC",
        };
        await using var command = new NpgsqlCommand($"""
            SELECT p.id, p.full_name, dp.specialty, dp.qualifications, dp.experience_years,
                   dp.expertise, dp.affiliation, dp.languages, dp.clinic_address,
                   dp.consultation_modes, dp.consultation_fee, dp.biography, dp.interests,
                   dp.availability, dp.photo_url
            FROM doctor_profiles dp JOIN profiles p ON p.id=dp.user_id
            WHERE dp.verification_status='approved' AND p.role='doctor'
              AND ($1::text IS NULL OR p.full_name ILIKE '%' || $1 || '%' OR dp.specialty ILIKE '%' || $1 || '%')
              AND ($2::text IS NULL OR dp.specialty ILIKE '%' || $2 || '%')
              AND ($3::text IS NULL OR dp.clinic_address ILIKE '%' || $3 || '%' OR dp.affiliation ILIKE '%' || $3 || '%')
              AND ($4::text IS NULL OR $4=ANY(dp.languages))
              AND ($5::text IS NULL OR $5=ANY(dp.consultation_modes))
              AND ($6::int IS NULL OR dp.experience_years >= $6)
              AND ($7::numeric IS NULL OR dp.consultation_fee IS NULL OR dp.consultation_fee <= $7)
                            AND ($8::text IS NULL OR dp.availability::text ILIKE '%' || $8 || '%')
            ORDER BY {order} LIMIT 100
            """, connection);
        command.Parameters.AddWithValue((object?)TrimOrNull(search) ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)TrimOrNull(specialty) ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)TrimOrNull(location) ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)TrimOrNull(language) ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)NormalizeMode(mode) ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)minExperience ?? DBNull.Value);
        command.Parameters.AddWithValue((object?)maxFee ?? DBNull.Value);
        var day = Weekdays.FirstOrDefault(item => string.Equals(item, availabilityDay, StringComparison.OrdinalIgnoreCase));
        command.Parameters.AddWithValue((object?)day ?? DBNull.Value);
        var doctors = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) doctors.Add(ReadDirectoryDoctor(reader));
        await reader.CloseAsync();
        await using var audit = new NpgsqlCommand(
            "INSERT INTO audit_trail(user_id, action, actor) VALUES ($1, 'Approved doctor directory viewed', $2)", connection);
        audit.Parameters.AddWithValue(userId);
        audit.Parameters.AddWithValue(Actor(principal));
        await audit.ExecuteNonQueryAsync(cancellationToken);
        return Results.Ok(doctors);
    }

    public static async Task<IResult> GetDoctorDetails(
        Guid doctorId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, userId, cancellationToken) != "patient") return Results.Forbid();
        await using var command = new NpgsqlCommand("""
            SELECT p.id, p.full_name, dp.specialty, dp.qualifications, dp.experience_years,
                   dp.expertise, dp.affiliation, dp.languages, dp.clinic_address, dp.consultation_modes,
                   dp.consultation_fee, dp.biography, dp.interests, dp.availability, dp.photo_url,
                   dp.registration_number, dp.issuing_council, dp.reviewed_at
            FROM doctor_profiles dp JOIN profiles p ON p.id=dp.user_id
            WHERE dp.user_id=$1 AND dp.verification_status='approved' AND p.role='doctor'
            """, connection);
        command.Parameters.AddWithValue(doctorId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return Results.NotFound();
        var doctor = new
        {
            id = reader.GetGuid(0), fullName = reader.GetString(1), specialty = reader.GetString(2),
            qualifications = reader.GetString(3), experienceYears = reader.GetInt16(4),
            expertise = reader.GetFieldValue<string[]>(5), affiliation = reader.GetString(6),
            languages = reader.GetFieldValue<string[]>(7), clinicAddress = reader.GetString(8),
            consultationModes = reader.GetFieldValue<string[]>(9),
            consultationFee = reader.IsDBNull(10) ? (decimal?)null : reader.GetDecimal(10),
            biography = reader.GetString(11), interests = reader.GetFieldValue<string[]>(12),
            availability = ReadJson(reader, 13), photoUrl = reader.IsDBNull(14) ? null : reader.GetString(14),
            registrationNumber = reader.GetString(15), issuingCouncil = reader.GetString(16),
            verificationStatus = "approved", verifiedAt = reader.GetFieldValue<DateTimeOffset>(17),
        };
        return Results.Ok(doctor);
    }

    public static async Task<IResult> GetMyDoctors(
        ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, userId, cancellationToken) != "patient") return Results.Forbid();
        await using var command = new NpgsqlCommand("""
            SELECT DISTINCT ON (dp.user_id) dp.user_id, p.full_name, dp.specialty, dp.qualifications,
              dp.experience_years, dp.affiliation, dp.languages, dp.consultation_modes, dp.photo_url,
              c.id AS conversation_id, r.id AS request_id, r.status, c.updated_at
            FROM doctor_consultation_requests r
            JOIN doctor_profiles dp ON dp.user_id=r.doctor_id
            JOIN profiles p ON p.id=dp.user_id
            LEFT JOIN doctor_conversations c ON c.request_id=r.id AND c.status='active'
            WHERE r.patient_id=$1 AND r.status='accepted'
            ORDER BY dp.user_id, c.updated_at DESC NULLS LAST, r.created_at DESC
            """, connection);
        command.Parameters.AddWithValue(userId);
        var doctors = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            doctors.Add(new { id = reader.GetGuid(0), fullName = reader.GetString(1), specialty = reader.GetString(2),
                qualifications = reader.GetString(3), experienceYears = reader.GetInt16(4), affiliation = reader.GetString(5),
                languages = reader.GetFieldValue<string[]>(6), consultationModes = reader.GetFieldValue<string[]>(7),
                photoUrl = reader.IsDBNull(8) ? null : reader.GetString(8),
                conversationId = reader.IsDBNull(9) ? (Guid?)null : reader.GetGuid(9), requestId = reader.GetGuid(10),
                updatedAt = reader.IsDBNull(12) ? (DateTimeOffset?)null : reader.GetFieldValue<DateTimeOffset>(12) });
        return Results.Ok(doctors);
    }

    public static async Task<IResult> CreateConsultationRequest(
        ConsultationRequestInput request, ClaimsPrincipal principal, ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (!ConsultationModes.Contains(request.ConsultationMode) || request.Message.Length > 2000 ||
            request.SharedSections.Length > ShareableSections.Count ||
            request.SharedSections.Any(section => !ShareableSections.Contains(section)) ||
            request.SharedSections.Distinct(StringComparer.Ordinal).Count() != request.SharedSections.Length ||
            (request.SharedSections.Length > 0 && !request.HealthDataConsent) ||
            (request.PreferredAt is not null && request.PreferredAt < DateTimeOffset.UtcNow.AddMinutes(-5)))
            return Validation("Select a valid consultation mode, time, message, and health-data sharing consent.");
        var patientId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, patientId, cancellationToken) != "patient") return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var available = new NpgsqlCommand("""
            SELECT EXISTS(SELECT 1 FROM doctor_profiles dp JOIN profiles p ON p.id=dp.user_id
              WHERE dp.user_id=$1 AND dp.verification_status='approved' AND p.role='doctor'
                AND $2=ANY(dp.consultation_modes))
            """, connection, transaction);
        available.Parameters.AddWithValue(request.DoctorId);
        available.Parameters.AddWithValue(request.ConsultationMode);
        if (!Convert.ToBoolean(await available.ExecuteScalarAsync(cancellationToken)))
            return Results.NotFound(new { message = "This doctor is not available for the selected consultation mode." });
        if (request.SharedSections.Length > 0)
        {
            await using var consent = new NpgsqlCommand(
                "SELECT share_with_doctor FROM consent_settings WHERE user_id=$1", connection, transaction);
            consent.Parameters.AddWithValue(patientId);
            var shareEnabled = await consent.ExecuteScalarAsync(cancellationToken);
            if (shareEnabled is bool allowed && !allowed)
                return Results.Conflict(new { message = "Enable doctor sharing in Privacy & Consent before sharing health information." });
        }
        await using var duplicate = new NpgsqlCommand("""
            SELECT EXISTS(SELECT 1 FROM doctor_consultation_requests
              WHERE patient_id=$1 AND doctor_id=$2 AND status='pending')
            """, connection, transaction);
        duplicate.Parameters.AddWithValue(patientId);
        duplicate.Parameters.AddWithValue(request.DoctorId);
        if (Convert.ToBoolean(await duplicate.ExecuteScalarAsync(cancellationToken)))
            return Results.Conflict(new { message = "A request to this doctor is already pending." });
        await using var command = new NpgsqlCommand("""
            INSERT INTO doctor_consultation_requests
              (patient_id, doctor_id, consultation_mode, preferred_at, message,
               shared_sections, health_data_consent, consented_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $7 THEN now() ELSE NULL END)
            RETURNING id
            """, connection, transaction);
        command.Parameters.AddWithValue(patientId);
        command.Parameters.AddWithValue(request.DoctorId);
        command.Parameters.AddWithValue(request.ConsultationMode);
        command.Parameters.AddWithValue((object?)request.PreferredAt ?? DBNull.Value);
        command.Parameters.AddWithValue(request.Message.Trim());
        command.Parameters.AddWithValue(request.SharedSections);
        command.Parameters.AddWithValue(request.HealthDataConsent);
        Guid requestId;
        try { requestId = (Guid)(await command.ExecuteScalarAsync(cancellationToken))!; }
        catch (PostgresException exception) when (exception.SqlState == "23505")
        { return Results.Conflict(new { message = "A request to this doctor is already pending." }); }
        await NotifyAsync(connection, transaction, request.DoctorId, "consultation_request", "New consultation request", "A patient has requested a consultation.", requestId, cancellationToken);
        await AddAuditAsync(connection, transaction, patientId, "Consultation requested", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created($"/api/doctor/requests/{requestId}", new { id = requestId, status = "pending" });
    }

    public static async Task<IResult> GetConsultationRequests(
        ClaimsPrincipal principal, ApiDatabaseProvider database, string? status, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using var command = new NpgsqlCommand("""
            SELECT r.id, r.patient_id, patient.full_name, r.doctor_id, doctor.full_name,
              dp.specialty, r.status, r.consultation_mode, r.preferred_at, r.scheduled_at,
              r.message, r.shared_sections, r.health_data_consent, r.created_at, r.responded_at
            FROM doctor_consultation_requests r
            JOIN profiles patient ON patient.id=r.patient_id
            JOIN profiles doctor ON doctor.id=r.doctor_id
            JOIN doctor_profiles dp ON dp.user_id=r.doctor_id
            WHERE (($1='doctor' AND r.doctor_id=$2) OR ($1='patient' AND r.patient_id=$2))
              AND ($3::text IS NULL OR r.status=$3)
            ORDER BY r.created_at DESC LIMIT 100
            """, connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue((object?)NormalizeRequestStatus(status) ?? DBNull.Value);
        var rows = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) rows.Add(new
        {
            id=reader.GetGuid(0), patientId=reader.GetGuid(1), patientName=reader.GetString(2),
            doctorId=reader.GetGuid(3), doctorName=reader.GetString(4), specialty=reader.GetString(5),
            status=reader.GetString(6), consultationMode=reader.GetString(7),
            preferredAt=reader.IsDBNull(8)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(8),
            scheduledAt=reader.IsDBNull(9)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(9),
            message=reader.GetString(10), sharedSections=reader.GetFieldValue<string[]>(11),
            healthDataConsent=reader.GetBoolean(12), createdAt=reader.GetFieldValue<DateTimeOffset>(13),
            respondedAt=reader.IsDBNull(14)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(14)
        });
        return Results.Ok(rows);
    }

    public static async Task<IResult> RespondToConsultation(
        Guid requestId, ConsultationResponseInput request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (request.Decision is not ("accepted" or "declined") ||
            (request.Decision == "declined" && request.ScheduledAt is not null) ||
            (request.ScheduledAt is not null && request.ScheduledAt < DateTimeOffset.UtcNow.AddMinutes(-5)))
            return Validation("Choose accept or decline and provide a valid appointment time when accepting.");
        var doctorId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, doctorId, cancellationToken) != "doctor") return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var update = new NpgsqlCommand("""
            UPDATE doctor_consultation_requests SET status=$3, scheduled_at=$4,
              responded_at=now(), updated_at=now()
            WHERE id=$1 AND doctor_id=$2 AND status='pending'
            RETURNING patient_id
            """, connection, transaction);
        update.Parameters.AddWithValue(requestId);
        update.Parameters.AddWithValue(doctorId);
        update.Parameters.AddWithValue(request.Decision);
        update.Parameters.AddWithValue((object?)request.ScheduledAt ?? DBNull.Value);
        var patientValue = await update.ExecuteScalarAsync(cancellationToken);
        if (patientValue is not Guid patientId)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Results.Conflict(new { message = "This request is no longer pending or is not assigned to your account." });
        }
        if (request.Decision == "accepted")
        {
            await using var conversation = new NpgsqlCommand("""
                INSERT INTO doctor_conversations(request_id, patient_id, doctor_id)
                VALUES ($1,$2,$3) ON CONFLICT (request_id) DO NOTHING
                """, connection, transaction);
            conversation.Parameters.AddWithValue(requestId);
            conversation.Parameters.AddWithValue(patientId);
            conversation.Parameters.AddWithValue(doctorId);
            await conversation.ExecuteNonQueryAsync(cancellationToken);
        }
        await NotifyAsync(connection, transaction, patientId, "consultation_response",
            request.Decision == "accepted" ? "Consultation request accepted" : "Consultation request declined",
            request.Decision == "accepted" ? "Your secure conversation is ready." : "The doctor declined your request.",
            requestId, cancellationToken);
        await AddAuditAsync(connection, transaction, patientId, $"Consultation request {request.Decision}", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    public static async Task<IResult> GetConversations(
        ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using var command = new NpgsqlCommand("""
                        SELECT c.id, c.patient_id, patient.full_name, c.doctor_id, doctor.full_name,
              dp.specialty, c.updated_at,
              (SELECT count(*) FROM doctor_messages m WHERE m.conversation_id=c.id
                AND m.sender_id<>$2 AND m.read_at IS NULL) AS unread_count,
              (SELECT body FROM doctor_messages m WHERE m.conversation_id=c.id
                                ORDER BY m.created_at DESC LIMIT 1) AS last_message, c.request_id
            FROM doctor_conversations c
            JOIN profiles patient ON patient.id=c.patient_id
            JOIN profiles doctor ON doctor.id=c.doctor_id
            JOIN doctor_profiles dp ON dp.user_id=c.doctor_id
            WHERE c.status='active' AND (($1='patient' AND c.patient_id=$2) OR ($1='doctor' AND c.doctor_id=$2))
            ORDER BY c.updated_at DESC LIMIT 100
            """, connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(userId);
        var conversations = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) conversations.Add(new
        {
            id=reader.GetGuid(0), patientId=reader.GetGuid(1), patientName=reader.GetString(2),
            doctorId=reader.GetGuid(3), doctorName=reader.GetString(4), specialty=reader.GetString(5),
            updatedAt=reader.GetFieldValue<DateTimeOffset>(6), unreadCount=reader.GetInt64(7),
            lastMessage=reader.IsDBNull(8)?null:reader.GetString(8), requestId=reader.GetGuid(9)
        });
        return Results.Ok(conversations);
    }

    public static async Task<IResult> GetMessages(
        Guid conversationId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        if (!await IsConversationParticipantAsync(connection, transaction, conversationId, userId, cancellationToken))
            return Results.NotFound();
        if (await IsBlockedAsync(connection, transaction, conversationId, cancellationToken)) return Results.Forbid();
        await using (var markRead = new NpgsqlCommand("""
            UPDATE doctor_messages SET read_at=now()
            WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL
            """, connection, transaction))
        {
            markRead.Parameters.AddWithValue(conversationId);
            markRead.Parameters.AddWithValue(userId);
            await markRead.ExecuteNonQueryAsync(cancellationToken);
        }
        await using var command = new NpgsqlCommand("""
            SELECT id, sender_id, body, created_at, read_at
            FROM doctor_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 500
            """, connection, transaction);
        command.Parameters.AddWithValue(conversationId);
        var messages = new List<object>();
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
            while (await reader.ReadAsync(cancellationToken)) messages.Add(new
            {
                id=reader.GetGuid(0), senderId=reader.GetGuid(1), body=reader.GetString(2),
                createdAt=reader.GetFieldValue<DateTimeOffset>(3),
                readAt=reader.IsDBNull(4)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(4)
            });
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok(messages);
    }

    public static async Task<IResult> SendMessage(
        Guid conversationId, DoctorMessageInput request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var body = request.Body.Trim();
        if (body.Length is < 1 or > 4000) return Validation("Messages must be between 1 and 4,000 characters.");
        var senderId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, senderId, cancellationToken);
        if (role is not ("patient" or "doctor")) return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        if (!await IsConversationParticipantAsync(connection, transaction, conversationId, senderId, cancellationToken))
            return Results.NotFound();
        if (await IsBlockedAsync(connection, transaction, conversationId, cancellationToken)) return Results.Forbid();
        await using var insert = new NpgsqlCommand("""
            INSERT INTO doctor_messages(conversation_id, sender_id, body)
            SELECT c.id, $2, $3 FROM doctor_conversations c
            WHERE c.id=$1 AND c.status='active'
            RETURNING id, created_at
            """, connection, transaction);
        insert.Parameters.AddWithValue(conversationId);
        insert.Parameters.AddWithValue(senderId);
        insert.Parameters.AddWithValue(body);
        await using var reader = await insert.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return Results.Conflict(new { message = "This conversation is closed." });
        var messageId = reader.GetGuid(0);
        var createdAt = reader.GetFieldValue<DateTimeOffset>(1);
        await reader.CloseAsync();
        Guid recipientId;
        await using (var recipient = new NpgsqlCommand("""
            UPDATE doctor_conversations SET updated_at=now() WHERE id=$1
            RETURNING CASE WHEN patient_id=$2 THEN doctor_id ELSE patient_id END
            """, connection, transaction))
        {
            recipient.Parameters.AddWithValue(conversationId);
            recipient.Parameters.AddWithValue(senderId);
            recipientId = (Guid)(await recipient.ExecuteScalarAsync(cancellationToken))!;
        }
        await NotifyAsync(connection, transaction, recipientId, "new_message", "New secure message", "You have a new message.", conversationId, cancellationToken);
        await AddAuditAsync(connection, transaction, senderId, "Secure message sent", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created($"/api/doctor/conversations/{conversationId}/messages/{messageId}",
            new { id=messageId, senderId, body, createdAt, readAt=(DateTimeOffset?)null });
    }

    public static async Task<IResult> GetSharedRecord(
        Guid conversationId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var requesterId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var access = new NpgsqlCommand("""
            SELECT c.patient_id, c.doctor_id, r.shared_sections, r.health_data_consent, r.status
            FROM doctor_conversations c JOIN doctor_consultation_requests r ON r.id=c.request_id
            WHERE c.id=$1 AND c.status='active'
            """, connection, transaction);
        access.Parameters.AddWithValue(conversationId);
        await using var reader = await access.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return Results.NotFound();
        var patientId = reader.GetGuid(0);
        var doctorId = reader.GetGuid(1);
        var sections = reader.GetFieldValue<string[]>(2);
        var consent = reader.GetBoolean(3);
        var requestStatus = reader.GetString(4);
        await reader.CloseAsync();
        if (requestStatus != "accepted" || requesterId != patientId && requesterId != doctorId) return Results.NotFound();
        var result = new Dictionary<string, object?> { ["sharedSections"] = sections, ["healthDataConsent"] = consent };
        if (requesterId == doctorId && (!consent || sections.Length == 0))
            return Results.Ok(result);
        if (consent)
        {
            foreach (var section in sections.Where(ShareableSections.Contains))
                result[section] = await ReadSharedSectionAsync(connection, transaction, patientId, section, cancellationToken);
        }
        if (requesterId == doctorId)
            await AddAuditAsync(connection, transaction, patientId, "Shared health information viewed by authorized clinician", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok(result);
    }

    public static async Task<IResult> UpdateSharingConsent(
        Guid requestId, SharingConsentUpdateRequest request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (request.SharedSections.Length > ShareableSections.Count ||
            request.SharedSections.Any(section => !ShareableSections.Contains(section)) ||
            request.SharedSections.Distinct(StringComparer.Ordinal).Count() != request.SharedSections.Length ||
            (request.SharedSections.Length > 0 && !request.HealthDataConsent))
            return Validation("Choose valid data categories and confirm consent before sharing.");
        var patientId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, patientId, cancellationToken) != "patient") return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            UPDATE doctor_consultation_requests SET shared_sections=$3,
              health_data_consent=$4, consented_at=CASE WHEN $4 THEN now() ELSE NULL END, updated_at=now()
            WHERE id=$1 AND patient_id=$2 AND status='accepted'
            """, connection, transaction);
        command.Parameters.AddWithValue(requestId);
        command.Parameters.AddWithValue(patientId);
        command.Parameters.AddWithValue(request.SharedSections);
        command.Parameters.AddWithValue(request.HealthDataConsent);
        if (await command.ExecuteNonQueryAsync(cancellationToken) == 0) return Results.NotFound();
        await using var getDoctor = new NpgsqlCommand(
            "SELECT doctor_id FROM doctor_consultation_requests WHERE id=$1", connection, transaction);
        getDoctor.Parameters.AddWithValue(requestId);
        var doctorId = (Guid)(await getDoctor.ExecuteScalarAsync(cancellationToken))!;
        await NotifyAsync(connection, transaction, doctorId, "sharing_updated", "Health information sharing updated",
            request.HealthDataConsent ? "The patient updated information shared with you." : "The patient withdrew health information sharing.", requestId, cancellationToken);
        await AddAuditAsync(connection, transaction, patientId, request.HealthDataConsent ? "Doctor data sharing authorized" : "Doctor data sharing withdrawn", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    public static async Task<IResult> BlockConversation(
        Guid conversationId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        if (!await IsConversationParticipantAsync(connection, transaction, conversationId, userId, cancellationToken)) return Results.NotFound();
        await using var command = new NpgsqlCommand("""
            INSERT INTO doctor_conversation_blocks(conversation_id, blocked_by) VALUES ($1,$2)
            ON CONFLICT DO NOTHING
            """, connection, transaction);
        command.Parameters.AddWithValue(conversationId);
        command.Parameters.AddWithValue(userId);
        await command.ExecuteNonQueryAsync(cancellationToken);
        await AddAuditAsync(connection, transaction, userId, "Conversation blocked", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    public static async Task<IResult> ReportConversation(
        Guid conversationId, ConversationReportInput request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length > 1000) return Validation("Provide a reason of at most 1,000 characters.");
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        if (!await IsConversationParticipantAsync(connection, transaction, conversationId, userId, cancellationToken)) return Results.NotFound();
        await using var command = new NpgsqlCommand("""
            INSERT INTO doctor_conversation_reports(conversation_id, reported_by, reason) VALUES ($1,$2,$3)
            """, connection, transaction);
        command.Parameters.AddWithValue(conversationId);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.Reason.Trim());
        await command.ExecuteNonQueryAsync(cancellationToken);
        await NotifyAdminsAsync(connection, transaction, "conversation_report", "Conversation reported", "A user submitted a conversation report.", conversationId, cancellationToken);
        await AddAuditAsync(connection, transaction, userId, "Conversation reported", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok(new { reported = true });
    }

    public static async Task<IResult> GetNotifications(
        ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            SELECT id, kind, title, body, resource_id, created_at, read_at
            FROM in_app_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100
            """, connection);
        command.Parameters.AddWithValue(userId);
        var rows = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) rows.Add(new
        {
            id=reader.GetGuid(0), kind=reader.GetString(1), title=reader.GetString(2), body=reader.GetString(3),
            resourceId=reader.IsDBNull(4)?(Guid?)null:reader.GetGuid(4), createdAt=reader.GetFieldValue<DateTimeOffset>(5),
            readAt=reader.IsDBNull(6)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(6)
        });
        return Results.Ok(rows);
    }

    public static async Task<IResult> ReadNotification(
        Guid notificationId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "UPDATE in_app_notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND user_id=$2",
            connection);
        command.Parameters.AddWithValue(notificationId);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        return await command.ExecuteNonQueryAsync(cancellationToken) == 0 ? Results.NotFound() : Results.NoContent();
    }

    public static async Task<IResult> GetAdminDoctorQueue(
        ClaimsPrincipal principal, ApiDatabaseProvider database, string? status, CancellationToken cancellationToken)
    {
        var adminId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, adminId, cancellationToken) != "platform_admin") return Results.Forbid();
        var filter = VerificationStatuses.Contains(status ?? "") ? status : null;
        await using var command = new NpgsqlCommand("""
            SELECT p.id, p.full_name, p.email, dp.specialty, dp.qualifications, dp.registration_number,
              dp.issuing_council, dp.experience_years, dp.affiliation, dp.verification_status,
              dp.submitted_at, dp.review_note,
              (SELECT count(*) FROM doctor_credential_documents d WHERE d.doctor_id=dp.user_id) AS document_count
            FROM doctor_profiles dp JOIN profiles p ON p.id=dp.user_id
            WHERE ($1::text IS NULL OR dp.verification_status=$1)
            ORDER BY dp.submitted_at DESC NULLS LAST, dp.updated_at DESC LIMIT 100
            """, connection);
        command.Parameters.AddWithValue((object?)filter ?? DBNull.Value);
        var applications = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) applications.Add(new
        {
            id=reader.GetGuid(0), fullName=reader.GetString(1), email=reader.GetString(2), specialty=reader.GetString(3),
            qualifications=reader.GetString(4), registrationNumber=reader.GetString(5), issuingCouncil=reader.GetString(6),
            experienceYears=reader.GetInt16(7), affiliation=reader.GetString(8), status=reader.GetString(9),
            submittedAt=reader.IsDBNull(10)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(10),
            reviewNote=reader.IsDBNull(11)?null:reader.GetString(11), documentCount=reader.GetInt64(12)
        });
        return Results.Ok(applications);
    }

    public static async Task<IResult> GetDoctorDocuments(
        Guid doctorId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var adminId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, adminId, cancellationToken) != "platform_admin") return Results.Forbid();
        await using var command = new NpgsqlCommand("""
            SELECT id, document_name, content_type, uploaded_at, review_status
            FROM doctor_credential_documents WHERE doctor_id=$1 ORDER BY uploaded_at
            """, connection);
        command.Parameters.AddWithValue(doctorId);
        var documents = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) documents.Add(new
        {
            id=reader.GetGuid(0), fileName=reader.GetString(1), contentType=reader.GetString(2),
            uploadedAt=reader.GetFieldValue<DateTimeOffset>(3), reviewStatus=reader.GetString(4)
        });
        return Results.Ok(documents);
    }

    public static async Task<IResult> DownloadDoctorDocument(
        Guid doctorId, Guid documentId, ClaimsPrincipal principal, ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        var adminId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, adminId, cancellationToken) != "platform_admin") return Results.Forbid();
        await using var command = new NpgsqlCommand("""
            SELECT document_name, content_type, file_data FROM doctor_credential_documents
            WHERE id=$1 AND doctor_id=$2
            """, connection);
        command.Parameters.AddWithValue(documentId);
        command.Parameters.AddWithValue(doctorId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return Results.NotFound();
        return Results.File(reader.GetFieldValue<byte[]>(2), reader.GetString(1), reader.GetString(0));
    }

    public static async Task<IResult> ReviewDoctor(
        Guid doctorId, DoctorReviewRequest request, ClaimsPrincipal principal,
        ApiDatabaseProvider database, CancellationToken cancellationToken)
    {
        if (request.Decision is not ("approved" or "rejected") || request.Note?.Length > 1000 ||
            (request.Decision == "rejected" && string.IsNullOrWhiteSpace(request.Note)))
            return Validation("Choose approve or reject; a rejection requires a short review note.");
        var adminId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        if (await GetRoleAsync(connection, adminId, cancellationToken) != "platform_admin") return Results.Forbid();
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            UPDATE doctor_profiles SET verification_status=$2, review_note=$3,
              reviewed_by=$4, reviewed_at=now(), updated_at=now()
            WHERE user_id=$1 AND verification_status='pending_verification'
              AND ($2='rejected' OR EXISTS (SELECT 1 FROM doctor_credential_documents d
                WHERE d.doctor_id=$1 AND d.review_status<>'rejected'))
            """, connection, transaction);
        command.Parameters.AddWithValue(doctorId);
        command.Parameters.AddWithValue(request.Decision);
        command.Parameters.AddWithValue((object?)request.Note?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue(adminId);
        if (await command.ExecuteNonQueryAsync(cancellationToken) == 0)
            return Results.Conflict(new { message = "This application is not pending or has no reviewable credential documents." });
        await using (var updateRole = new NpgsqlCommand(
            "UPDATE profiles SET role=$2 WHERE id=$1", connection, transaction))
        {
            updateRole.Parameters.AddWithValue(doctorId);
            updateRole.Parameters.AddWithValue(request.Decision == "approved" ? "doctor" : "patient");
            await updateRole.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var docs = new NpgsqlCommand("""
            UPDATE doctor_credential_documents SET review_status=$2, reviewed_at=now(), reviewed_by=$3
            WHERE doctor_id=$1 AND review_status='pending'
            """, connection, transaction))
        {
            docs.Parameters.AddWithValue(doctorId);
            docs.Parameters.AddWithValue(request.Decision == "approved" ? "accepted" : "rejected");
            docs.Parameters.AddWithValue(adminId);
            await docs.ExecuteNonQueryAsync(cancellationToken);
        }
        await NotifyAsync(connection, transaction, doctorId, "doctor_verification", "Doctor profile review complete",
            request.Decision == "approved" ? "Your profile is approved and now visible in Find a Doctor." : $"Your application was not approved. {request.Note}",
            doctorId, cancellationToken);
        await AddAuditAsync(connection, transaction, doctorId, $"Doctor application {request.Decision}", Actor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<object?> ReadSharedSectionAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid patientId, string section,
        CancellationToken cancellationToken)
    {
        var sql = section switch
        {
            "questionnaire" => "SELECT jsonb_build_object('personalInfo',personal_info,'medicalHistory',medical_history,'familyHistory',family_history,'lifestyle',lifestyle,'diabetesHistory',diabetes_history,'devices',devices) FROM onboarding_data WHERE user_id=$1",
            "labs" => "SELECT COALESCE(jsonb_agg(jsonb_build_object('parameter',parameter,'result',result,'unit',unit,'reference',reference,'date',date,'status',status) ORDER BY created_at DESC),'[]'::jsonb) FROM lab_results WHERE user_id=$1",
            "cgm" => "SELECT COALESCE(jsonb_agg(jsonb_build_object('recordedAt',recorded_at,'glucoseMgDl',glucose_mg_dl,'source',source) ORDER BY recorded_at DESC),'[]'::jsonb) FROM (SELECT * FROM cgm_readings WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 500) recent",
            "insulin" => "SELECT COALESCE(jsonb_agg(jsonb_build_object('recordedAt',recorded_at,'eventType',event_type,'carbsGrams',carbs_grams,'units',units,'note',note,'source',source) ORDER BY recorded_at DESC),'[]'::jsonb) FROM (SELECT * FROM insulin_events WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 500) recent",
            "genomics" => "SELECT COALESCE(jsonb_agg(jsonb_build_object('gene',gene,'variantId',variant_id,'genotype',genotype,'riskLevel',risk_level,'description',description,'source',source)),'[]'::jsonb) FROM genomic_variants WHERE user_id=$1",
            "assessments" => "SELECT COALESCE(jsonb_agg(jsonb_build_object('assessedAt',assessed_at,'riskLevel',risk_level,'score',score,'modelVersion',model_version,'summary',summary,'contributingFactors',contributing_factors,'crossSignalInsights',cross_signal_insights) ORDER BY assessed_at DESC),'[]'::jsonb) FROM assessments WHERE user_id=$1",
            _ => throw new InvalidOperationException("Unknown shared section."),
        };
        await using var command = new NpgsqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue(patientId);
        var json = await command.ExecuteScalarAsync(cancellationToken) as string;
        return json is null ? null : JsonDocument.Parse(json).RootElement.Clone();
    }

    private static bool IsValidDoctorProfile(DoctorProfileUpdateRequest request) =>
        Specialties.Contains(request.Specialty) && request.Qualifications.Length <= 500 &&
        request.RegistrationNumber.Length is > 0 and <= 100 && request.IssuingCouncil.Length is > 0 and <= 200 &&
        request.ExperienceYears is >= 0 and <= 80 && request.Expertise.Length <= 20 &&
        request.Expertise.All(item => item.Length <= 100) && request.Affiliation.Length <= 200 &&
        request.Languages.Length is > 0 and <= 20 && request.Languages.All(item => item.Length <= 60) &&
        request.ClinicAddress.Length <= 500 && request.ConsultationModes.Length is > 0 and <= 2 &&
        request.ConsultationModes.All(ConsultationModes.Contains) &&
        request.ConsultationModes.Distinct(StringComparer.Ordinal).Count() == request.ConsultationModes.Length &&
        request.ConsultationFee is null or >= 0 && request.Biography.Length is > 0 and <= 2000 &&
        request.Interests.Length <= 20 && request.Interests.All(item => item.Length <= 100) &&
        request.Availability.ValueKind is JsonValueKind.Array or JsonValueKind.Object &&
        request.PhotoUrl is null or { Length: <= 1000 } &&
        (request.PhotoUrl is null || Uri.TryCreate(request.PhotoUrl, UriKind.Absolute, out var photoUri) && photoUri.Scheme == Uri.UriSchemeHttps);

    private static void AddDoctorProfileParameters(NpgsqlCommand command, Guid userId, DoctorProfileUpdateRequest request)
    {
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.Specialty.Trim());
        command.Parameters.AddWithValue(request.Qualifications.Trim());
        command.Parameters.AddWithValue(request.RegistrationNumber.Trim());
        command.Parameters.AddWithValue(request.IssuingCouncil.Trim());
        command.Parameters.AddWithValue((short)request.ExperienceYears);
        command.Parameters.AddWithValue(request.Expertise.Select(item => item.Trim()).ToArray());
        command.Parameters.AddWithValue(request.Affiliation.Trim());
        command.Parameters.AddWithValue(request.Languages.Select(item => item.Trim()).ToArray());
        command.Parameters.AddWithValue(request.ClinicAddress.Trim());
        command.Parameters.AddWithValue(request.ConsultationModes);
        command.Parameters.AddWithValue((object?)request.ConsultationFee ?? DBNull.Value);
        command.Parameters.AddWithValue(request.Biography.Trim());
        command.Parameters.AddWithValue(request.Interests.Select(item => item.Trim()).ToArray());
        command.Parameters.Add(new NpgsqlParameter { NpgsqlDbType=NpgsqlDbType.Jsonb, Value=request.Availability.GetRawText() });
        command.Parameters.AddWithValue((object?)request.PhotoUrl ?? DBNull.Value);
    }

    private static object ReadDoctorProfile(NpgsqlDataReader reader, Guid userId) => new
    {
        userId, fullName=reader.GetString(0), specialty=reader.GetString(1), qualifications=reader.GetString(2),
        registrationNumber=reader.GetString(3), issuingCouncil=reader.GetString(4), experienceYears=reader.GetInt16(5),
        expertise=reader.GetFieldValue<string[]>(6), affiliation=reader.GetString(7), languages=reader.GetFieldValue<string[]>(8),
        clinicAddress=reader.GetString(9), consultationModes=reader.GetFieldValue<string[]>(10),
        consultationFee=reader.IsDBNull(11)?(decimal?)null:reader.GetDecimal(11), biography=reader.GetString(12),
        interests=reader.GetFieldValue<string[]>(13), availability=ReadJson(reader,14),
        photoUrl=reader.IsDBNull(15)?null:reader.GetString(15), status=reader.GetString(16),
        reviewNote=reader.IsDBNull(17)?null:reader.GetString(17),
        submittedAt=reader.IsDBNull(18)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(18),
        reviewedAt=reader.IsDBNull(19)?(DateTimeOffset?)null:reader.GetFieldValue<DateTimeOffset>(19),
    };

    private static object ReadDirectoryDoctor(NpgsqlDataReader reader) => new
    {
        id=reader.GetGuid(0), fullName=reader.GetString(1), specialty=reader.GetString(2), qualifications=reader.GetString(3),
        experienceYears=reader.GetInt16(4), expertise=reader.GetFieldValue<string[]>(5), affiliation=reader.GetString(6),
        languages=reader.GetFieldValue<string[]>(7), clinicAddress=reader.GetString(8),
        consultationModes=reader.GetFieldValue<string[]>(9), consultationFee=reader.IsDBNull(10)?(decimal?)null:reader.GetDecimal(10),
        biography=reader.GetString(11), interests=reader.GetFieldValue<string[]>(12), availability=ReadJson(reader,13),
        photoUrl=reader.IsDBNull(14)?null:reader.GetString(14), verificationStatus="approved"
    };

    private static async Task<string> GetRoleAsync(NpgsqlConnection connection, Guid userId, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("SELECT role FROM profiles WHERE id=$1", connection);
        command.Parameters.AddWithValue(userId);
        return await command.ExecuteScalarAsync(cancellationToken) as string ?? "patient";
    }

    private static async Task<bool> IsConversationParticipantAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid conversationId, Guid userId, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("""
            SELECT EXISTS(SELECT 1 FROM doctor_conversations WHERE id=$1 AND status='active' AND (patient_id=$2 OR doctor_id=$2))
            """, connection, transaction);
        command.Parameters.AddWithValue(conversationId);
        command.Parameters.AddWithValue(userId);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<bool> IsBlockedAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid conversationId, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            "SELECT EXISTS(SELECT 1 FROM doctor_conversation_blocks WHERE conversation_id=$1)", connection, transaction);
        command.Parameters.AddWithValue(conversationId);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task NotifyAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid userId, string kind, string title,
        string body, Guid resourceId, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("""
            INSERT INTO in_app_notifications(user_id, kind, title, body, resource_id)
            VALUES ($1,$2,$3,$4,$5)
            """, connection, transaction);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(kind);
        command.Parameters.AddWithValue(title);
        command.Parameters.AddWithValue(body);
        command.Parameters.AddWithValue(resourceId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task NotifyAdminsAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, string kind, string title, string body,
        Guid resourceId, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("""
            INSERT INTO in_app_notifications(user_id, kind, title, body, resource_id)
            SELECT id, $1, $2, $3, $4 FROM profiles WHERE role='platform_admin'
            """, connection, transaction);
        command.Parameters.AddWithValue(kind);
        command.Parameters.AddWithValue(title);
        command.Parameters.AddWithValue(body);
        command.Parameters.AddWithValue(resourceId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task AddAuditAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid patientId, string action, string actor,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            "INSERT INTO audit_trail(user_id, action, actor) VALUES ($1,$2,$3)", connection, transaction);
        command.Parameters.AddWithValue(patientId);
        command.Parameters.AddWithValue(action);
        command.Parameters.AddWithValue(actor);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string Actor(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.Email) ?? "User";

    private static string NormalizePhone(string value) => new(value.Where(char.IsDigit).ToArray());

    private static string? NormalizeMode(string? mode) => mode switch
    {
        "online" => "online", "in-person" or "in_person" => "in_person", _ => null,
    };

    private static string? NormalizeRequestStatus(string? status) => status is "pending" or "accepted" or "declined" or "cancelled" or "closed" ? status : null;

    private static string? TrimOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool MatchesSignature(byte[] file, string contentType) => contentType switch
    {
        "application/pdf" => file.AsSpan().StartsWith("%PDF-"u8),
        "image/jpeg" => file.Length > 3 && file[0] == 0xff && file[1] == 0xd8 && file[2] == 0xff,
        "image/png" => file.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
        _ => false,
    };

    private static object? ReadJson(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal)) return null;
        using var document = JsonDocument.Parse(reader.GetString(ordinal));
        return document.RootElement.Clone();
    }

    private static IResult Validation(string message) => Results.ValidationProblem(new Dictionary<string, string[]> { ["body"] = [message] });
}

