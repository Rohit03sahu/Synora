using System.Security.Claims;
using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace Synora.Server.Api;

public static class PatientDataEndpoints
{
    private static readonly HashSet<string> LabStatuses = ["normal", "borderline", "high", "low"];
    private static readonly HashSet<string> InsulinEventTypes = ["meal", "correction", "basal", "other"];
    private static readonly HashSet<string> GenomicRiskLevels = ["low", "moderate", "high"];

    public static RouteGroupBuilder MapPatientDataEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/onboarding", GetOnboarding);
        api.MapPut("/onboarding", UpdateOnboarding);
        api.MapGet("/labs", GetLabs);
        api.MapPost("/labs", AddLabs);
        api.MapDelete("/labs/{id:guid}", DeleteLab);
        api.MapGet("/consent", GetConsent);
        api.MapPut("/consent", UpdateConsent);
        api.MapGet("/cgm", GetCgmReadings);
        api.MapPost("/cgm", AddCgmReadings);
        api.MapGet("/insulin", GetInsulinData);
        api.MapPost("/insulin/events", AddInsulinEvents);
        api.MapPost("/insulin/basal-rates", SaveBasalRates);
        api.MapGet("/devices", GetDevices);
        api.MapPost("/devices", RequestDeviceConnection);
        api.MapGet("/genomics", GetGenomics);
        api.MapPost("/genomics", AddGenomicVariants);
        api.MapGet("/assessments", GetAssessments);
        return api;
    }

    private static async Task<IResult> GetOnboarding(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT personal_info, medical_history, family_history, lifestyle,
                   diabetes_history, devices, completed, created_at, updated_at
            FROM onboarding_data
            WHERE user_id = $1
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.NoContent();
        }

        return Results.Ok(new
        {
            personalInfo = ReadJson(reader, 0),
            medicalHistory = ReadJson(reader, 1),
            familyHistory = ReadJson(reader, 2),
            lifestyle = ReadJson(reader, 3),
            diabetesHistory = ReadJson(reader, 4),
            devices = ReadJson(reader, 5),
            completed = reader.GetBoolean(6),
            createdAt = reader.GetFieldValue<DateTimeOffset>(7),
            updatedAt = reader.GetFieldValue<DateTimeOffset>(8),
        });
    }

    private static async Task<IResult> UpdateOnboarding(
        OnboardingUpdateRequest request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (!IsJsonObject(request.PersonalInfo) ||
            !IsJsonObject(request.MedicalHistory) ||
            !IsJsonObject(request.FamilyHistory) ||
            !IsJsonObject(request.Lifestyle) ||
            !IsJsonObject(request.DiabetesHistory) ||
            request.Devices.ValueKind is not (JsonValueKind.Array or JsonValueKind.Object))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["The onboarding sections must be JSON objects and devices must be an array or object."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO onboarding_data
              (user_id, personal_info, medical_history, family_history, lifestyle,
               diabetes_history, devices, completed)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE SET
              personal_info = EXCLUDED.personal_info,
              medical_history = EXCLUDED.medical_history,
              family_history = EXCLUDED.family_history,
              lifestyle = EXCLUDED.lifestyle,
              diabetes_history = EXCLUDED.diabetes_history,
              devices = EXCLUDED.devices,
              completed = EXCLUDED.completed
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        AddJson(command, request.PersonalInfo);
        AddJson(command, request.MedicalHistory);
        AddJson(command, request.FamilyHistory);
        AddJson(command, request.Lifestyle);
        AddJson(command, request.DiabetesHistory);
        AddJson(command, request.Devices);
        command.Parameters.AddWithValue(request.Completed);
        await command.ExecuteNonQueryAsync(cancellationToken);
        await AddAuditAsync(connection, userId, "Onboarding saved", PrincipalActor(principal), cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetLabs(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, parameter, result, unit, reference, date, status
            FROM lab_results
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 500
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        var rows = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new
            {
                id = reader.GetGuid(0),
                parameter = reader.GetString(1),
                result = reader.GetString(2),
                unit = reader.GetString(3),
                reference = reader.GetString(4),
                date = reader.GetString(5),
                status = reader.GetString(6),
            });
        }

        return Results.Ok(rows);
    }

    private static async Task<IResult> AddLabs(
        List<LabResultInput> request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > 500 ||
            request.Any(item =>
                string.IsNullOrWhiteSpace(item.Parameter) || item.Parameter.Length > 120 ||
                string.IsNullOrWhiteSpace(item.Result) || item.Result.Length > 80 ||
                item.Unit.Length > 40 || item.Reference.Length > 120 ||
                !DateOnly.TryParse(item.Date, out _) ||
                !LabStatuses.Contains(item.Status.ToLowerInvariant())))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provide 1–500 lab results with valid dates and normal, borderline, high, or low status."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var created = new List<Guid>();
        foreach (var item in request)
        {
            await using var command = new NpgsqlCommand(
                """
                INSERT INTO lab_results
                  (user_id, parameter, result, unit, reference, date, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                connection,
                transaction);
            command.Parameters.AddWithValue(userId);
            command.Parameters.AddWithValue(item.Parameter.Trim());
            command.Parameters.AddWithValue(item.Result.Trim());
            command.Parameters.AddWithValue(item.Unit.Trim());
            command.Parameters.AddWithValue(item.Reference.Trim());
            command.Parameters.AddWithValue(item.Date);
            command.Parameters.AddWithValue(item.Status.ToLowerInvariant());
            created.Add((Guid)(await command.ExecuteScalarAsync(cancellationToken))!);
        }

        await AddAuditAsync(connection, transaction, userId, "Lab results added", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created("/api/labs", new { ids = created });
    }

    private static async Task<IResult> DeleteLab(
        Guid id,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "DELETE FROM lab_results WHERE id = $1 AND user_id = $2",
            connection,
            transaction);
        command.Parameters.AddWithValue(id);
        command.Parameters.AddWithValue(userId);
        var deleted = await command.ExecuteNonQueryAsync(cancellationToken);
        if (deleted == 0)
        {
            return Results.NotFound();
        }

        await AddAuditAsync(connection, transaction, userId, "Lab result removed", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetConsent(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT lab_data, cgm_data, genomic_data, lifestyle_data,
                   insulin_device_data, share_with_doctor, research_participation
            FROM consent_settings
            WHERE user_id = $1
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return Results.Ok(DefaultConsent());
        }

        return Results.Ok(new
        {
            labData = reader.GetBoolean(0),
            cgmData = reader.GetBoolean(1),
            genomicData = reader.GetBoolean(2),
            lifestyleData = reader.GetBoolean(3),
            insulinDeviceData = reader.GetBoolean(4),
            shareWithDoctor = reader.GetBoolean(5),
            researchParticipation = reader.GetBoolean(6),
        });
    }

    private static async Task<IResult> UpdateConsent(
        ConsentUpdateRequest request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO consent_settings
              (user_id, lab_data, cgm_data, genomic_data, lifestyle_data,
               insulin_device_data, share_with_doctor, research_participation)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id) DO UPDATE SET
              lab_data = EXCLUDED.lab_data,
              cgm_data = EXCLUDED.cgm_data,
              genomic_data = EXCLUDED.genomic_data,
              lifestyle_data = EXCLUDED.lifestyle_data,
              insulin_device_data = EXCLUDED.insulin_device_data,
              share_with_doctor = EXCLUDED.share_with_doctor,
              research_participation = EXCLUDED.research_participation
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.LabData);
        command.Parameters.AddWithValue(request.CgmData);
        command.Parameters.AddWithValue(request.GenomicData);
        command.Parameters.AddWithValue(request.LifestyleData);
        command.Parameters.AddWithValue(request.InsulinDeviceData);
        command.Parameters.AddWithValue(request.ShareWithDoctor);
        command.Parameters.AddWithValue(request.ResearchParticipation);
        await command.ExecuteNonQueryAsync(cancellationToken);
        await AddAuditAsync(connection, transaction, userId, "Consent settings updated", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetCgmReadings(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        int? days,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        var range = Math.Clamp(days ?? 14, 1, 90);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, recorded_at, glucose_mg_dl, source
            FROM cgm_readings
            WHERE user_id = $1 AND recorded_at >= now() - make_interval(days => $2)
            ORDER BY recorded_at
            LIMIT 50000
            """,
            connection);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(range);
        var readings = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            readings.Add(new
            {
                id = reader.GetGuid(0),
                recordedAt = reader.GetFieldValue<DateTimeOffset>(1),
                glucoseMgDl = reader.GetDecimal(2),
                source = reader.GetString(3),
            });
        }

        return Results.Ok(new { days = range, readings });
    }

    private static async Task<IResult> AddCgmReadings(
        List<CgmReadingInput> request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > 50000 ||
            request.Any(item => item.GlucoseMgDl is < 0 or > 1000 || item.Source is { Length: > 80 }))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provide 1–50,000 CGM readings with glucose values between 0 and 1000 mg/dL."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var item in request)
        {
            await using var command = new NpgsqlCommand(
                """
                INSERT INTO cgm_readings (user_id, recorded_at, glucose_mg_dl, source)
                VALUES ($1, $2, $3, $4)
                """,
                connection,
                transaction);
            command.Parameters.AddWithValue(userId);
            command.Parameters.AddWithValue(item.RecordedAt);
            command.Parameters.AddWithValue(item.GlucoseMgDl);
            command.Parameters.AddWithValue(string.IsNullOrWhiteSpace(item.Source) ? "manual" : item.Source.Trim());
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await AddAuditAsync(connection, transaction, userId, "CGM readings added", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created("/api/cgm", new { inserted = request.Count });
    }

    private static async Task<IResult> GetInsulinData(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var eventsCommand = new NpgsqlCommand(
            """
            SELECT id, recorded_at, event_type, carbs_grams, units, note, source
            FROM insulin_events
            WHERE user_id = $1
            ORDER BY recorded_at DESC
            LIMIT 5000
            """,
            connection);
        eventsCommand.Parameters.AddWithValue(userId);
        var events = new List<object>();
        await using (var reader = await eventsCommand.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                events.Add(new
                {
                    id = reader.GetGuid(0),
                    recordedAt = reader.GetFieldValue<DateTimeOffset>(1),
                    eventType = reader.GetString(2),
                    carbsGrams = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3),
                    units = reader.GetDecimal(4),
                    note = reader.GetString(5),
                    source = reader.GetString(6),
                });
            }
        }

        await using var basalCommand = new NpgsqlCommand(
            """
            SELECT hour_of_day, rate_units_per_hour, source
            FROM insulin_basal_rates
            WHERE user_id = $1
            ORDER BY hour_of_day
            """,
            connection);
        basalCommand.Parameters.AddWithValue(userId);
        var basalRates = new List<object>();
        await using (var reader = await basalCommand.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                basalRates.Add(new
                {
                    hourOfDay = reader.GetInt16(0),
                    rateUnitsPerHour = reader.GetDecimal(1),
                    source = reader.GetString(2),
                });
            }
        }

        return Results.Ok(new { events, basalRates });
    }

    private static async Task<IResult> AddInsulinEvents(
        List<InsulinEventInput> request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > 5000 ||
            request.Any(item =>
                !InsulinEventTypes.Contains(item.EventType.ToLowerInvariant()) ||
                item.Units is < 0 or > 10000 ||
                item.CarbsGrams is < 0 or > 10000 ||
                item.Note is { Length: > 500 } ||
                item.Source is { Length: > 80 }))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provide 1–5,000 valid insulin events with non-negative doses and supported event types."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var item in request)
        {
            await using var command = new NpgsqlCommand(
                """
                INSERT INTO insulin_events (user_id, recorded_at, event_type, carbs_grams, units, note, source)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                connection,
                transaction);
            command.Parameters.AddWithValue(userId);
            command.Parameters.AddWithValue(item.RecordedAt);
            command.Parameters.AddWithValue(item.EventType.ToLowerInvariant());
            command.Parameters.AddWithValue((object?)item.CarbsGrams ?? DBNull.Value);
            command.Parameters.AddWithValue(item.Units);
            command.Parameters.AddWithValue(item.Note?.Trim() ?? string.Empty);
            command.Parameters.AddWithValue(string.IsNullOrWhiteSpace(item.Source) ? "manual" : item.Source.Trim());
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await AddAuditAsync(connection, transaction, userId, "Insulin events added", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created("/api/insulin", new { inserted = request.Count });
    }

    private static async Task<IResult> SaveBasalRates(
        List<InsulinBasalRateInput> request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > 24 ||
            request.Any(item => item.HourOfDay is < 0 or > 23 || item.RateUnitsPerHour is < 0 or > 1000) ||
            request.Select(item => item.HourOfDay).Distinct().Count() != request.Count)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provide 1–24 unique hourly rates with hours from 0 to 23 and non-negative values."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var item in request)
        {
            await using var command = new NpgsqlCommand(
                """
                INSERT INTO insulin_basal_rates (user_id, hour_of_day, rate_units_per_hour, source)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, hour_of_day) DO UPDATE SET
                  rate_units_per_hour = EXCLUDED.rate_units_per_hour,
                  source = EXCLUDED.source,
                  updated_at = now()
                """,
                connection,
                transaction);
            command.Parameters.AddWithValue(userId);
            command.Parameters.AddWithValue((short)item.HourOfDay);
            command.Parameters.AddWithValue(item.RateUnitsPerHour);
            command.Parameters.AddWithValue(string.IsNullOrWhiteSpace(item.Source) ? "manual" : item.Source.Trim());
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await AddAuditAsync(connection, transaction, userId, "Insulin basal profile updated", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetGenomics(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, gene, variant_id, genotype, risk_level, description, source, created_at
            FROM genomic_variants
            WHERE user_id = $1
            ORDER BY gene, variant_id
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        var variants = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            variants.Add(new
            {
                id = reader.GetGuid(0),
                gene = reader.GetString(1),
                variantId = reader.GetString(2),
                genotype = reader.GetString(3),
                riskLevel = reader.GetString(4),
                description = reader.GetString(5),
                source = reader.GetString(6),
                createdAt = reader.GetFieldValue<DateTimeOffset>(7),
            });
        }

        return Results.Ok(variants);
    }

    private static async Task<IResult> GetDevices(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, provider, device_type, display_name, status, connected_at, last_synced_at
            FROM device_connections
            WHERE user_id = $1
            ORDER BY device_type, provider
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        var devices = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            devices.Add(new
            {
                id = reader.GetGuid(0),
                provider = reader.GetString(1),
                deviceType = reader.GetString(2),
                displayName = reader.GetString(3),
                status = reader.GetString(4),
                connectedAt = reader.IsDBNull(5) ? (DateTimeOffset?)null : reader.GetFieldValue<DateTimeOffset>(5),
                lastSyncedAt = reader.IsDBNull(6) ? (DateTimeOffset?)null : reader.GetFieldValue<DateTimeOffset>(6),
            });
        }

        return Results.Ok(devices);
    }

    private static async Task<IResult> RequestDeviceConnection(
        DeviceConnectionRequest request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Provider) || request.Provider.Length > 80 ||
            string.IsNullOrWhiteSpace(request.DeviceType) || request.DeviceType.Length > 80 ||
            string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 160)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provider, device type, and display name are required and must be within their length limits."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO device_connections (user_id, provider, device_type, display_name, status)
            VALUES ($1, $2, $3, $4, 'pending')
            ON CONFLICT (user_id, provider, device_type) DO UPDATE SET
              display_name = EXCLUDED.display_name,
              status = CASE WHEN device_connections.status = 'connected' THEN 'connected' ELSE 'pending' END,
              updated_at = now()
            RETURNING id, status
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(request.Provider.Trim());
        command.Parameters.AddWithValue(request.DeviceType.Trim());
        command.Parameters.AddWithValue(request.DisplayName.Trim());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var result = new { id = reader.GetGuid(0), status = reader.GetString(1) };
        await reader.CloseAsync();
        await AddAuditAsync(connection, transaction, userId, "Device connection requested", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Accepted(value: result);
    }

    private static async Task<IResult> AddGenomicVariants(
        List<GenomicVariantInput> request,
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        if (request.Count is < 1 or > 10000 ||
            request.Any(item =>
                string.IsNullOrWhiteSpace(item.Gene) || item.Gene.Length > 80 ||
                string.IsNullOrWhiteSpace(item.VariantId) || item.VariantId.Length > 120 ||
                string.IsNullOrWhiteSpace(item.Genotype) || item.Genotype.Length > 80 ||
                !GenomicRiskLevels.Contains(item.RiskLevel.ToLowerInvariant()) ||
                item.Description is { Length: > 2000 } ||
                item.Source is { Length: > 80 }))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["body"] = ["Provide 1–10,000 variants with gene, variant ID, genotype, and low, moderate, or high risk."],
            });
        }

        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var item in request)
        {
            await using var command = new NpgsqlCommand(
                """
                INSERT INTO genomic_variants (user_id, gene, variant_id, genotype, risk_level, description, source)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, variant_id) DO UPDATE SET
                  gene = EXCLUDED.gene,
                  genotype = EXCLUDED.genotype,
                  risk_level = EXCLUDED.risk_level,
                  description = EXCLUDED.description,
                  source = EXCLUDED.source
                """,
                connection,
                transaction);
            command.Parameters.AddWithValue(userId);
            command.Parameters.AddWithValue(item.Gene.Trim());
            command.Parameters.AddWithValue(item.VariantId.Trim());
            command.Parameters.AddWithValue(item.Genotype.Trim());
            command.Parameters.AddWithValue(item.RiskLevel.ToLowerInvariant());
            command.Parameters.AddWithValue(item.Description?.Trim() ?? string.Empty);
            command.Parameters.AddWithValue(string.IsNullOrWhiteSpace(item.Source) ? "manual" : item.Source.Trim());
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await AddAuditAsync(connection, transaction, userId, "Genomic variants added", PrincipalActor(principal), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created("/api/genomics", new { inserted = request.Count });
    }

    private static async Task<IResult> GetAssessments(
        ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, assessed_at, risk_level, score, model_version, summary,
                   contributing_factors, cross_signal_insights
            FROM assessments
            WHERE user_id = $1
            ORDER BY assessed_at DESC
            LIMIT 100
            """,
            connection);
        command.Parameters.AddWithValue(ApiUser.Id(principal));
        var assessments = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            assessments.Add(new
            {
                id = reader.GetGuid(0),
                assessedAt = reader.GetFieldValue<DateTimeOffset>(1),
                riskLevel = reader.GetString(2),
                score = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3),
                modelVersion = reader.GetString(4),
                summary = reader.GetString(5),
                contributingFactors = ReadJson(reader, 6),
                crossSignalInsights = ReadJson(reader, 7),
            });
        }

        return Results.Ok(assessments);
    }

    private static object DefaultConsent() => new
    {
        labData = true,
        cgmData = true,
        genomicData = true,
        lifestyleData = true,
        insulinDeviceData = false,
        shareWithDoctor = true,
        researchParticipation = false,
    };

    private static bool IsJsonObject(JsonElement element) => element.ValueKind == JsonValueKind.Object;

    private static JsonElement ReadJson(NpgsqlDataReader reader, int ordinal)
    {
        using var document = JsonDocument.Parse(reader.GetString(ordinal));
        return document.RootElement.Clone();
    }

    private static void AddJson(NpgsqlCommand command, JsonElement value)
    {
        command.Parameters.Add(new NpgsqlParameter
        {
            NpgsqlDbType = NpgsqlDbType.Jsonb,
            Value = value.GetRawText(),
        });
    }

    private static string PrincipalActor(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.Email) ?? "User";

    private static Task AddAuditAsync(
        NpgsqlConnection connection,
        Guid userId,
        string action,
        string actor,
        CancellationToken cancellationToken) =>
        AddAuditAsync(connection, null, userId, action, actor, cancellationToken);

    private static async Task AddAuditAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction? transaction,
        Guid userId,
        string action,
        string actor,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            "INSERT INTO audit_trail (user_id, action, actor) VALUES ($1, $2, $3)",
            connection,
            transaction);
        command.Parameters.AddWithValue(userId);
        command.Parameters.AddWithValue(action);
        command.Parameters.AddWithValue(actor);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
