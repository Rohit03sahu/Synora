using System.Globalization;
using Npgsql;

namespace Synora.Server.Api;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/patients", GetPatients);
        api.MapGet("/dashboard/overview", GetOverview);
        return api;
    }

    private static async Task<IResult> GetPatients(
        System.Security.Claims.ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        string? search,
        string? risk,
        CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, ApiUser.Id(principal), cancellationToken);
        if (role is not ("doctor" or "hospital" or "wellness"))
        {
            return Results.Forbid();
        }

        return Results.Ok(await LoadPatientsAsync(
            connection,
            role,
            ApiUser.Id(principal),
            search,
            risk,
            cancellationToken));
    }

    private static async Task<List<PatientListItem>> LoadPatientsAsync(
        NpgsqlConnection connection,
        string role,
        Guid viewerId,
        string? search,
        string? risk,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            SELECT p.id,
                   p.full_name,
                   od.personal_info ->> 'dob' AS date_of_birth,
                   latest.assessed_at::date AS last_assessment,
                   concat_ws(', ',
                     CASE WHEN EXISTS (SELECT 1 FROM lab_results lr WHERE lr.user_id = p.id) THEN 'Lab' END,
                     CASE WHEN EXISTS (SELECT 1 FROM cgm_readings cr WHERE cr.user_id = p.id) THEN 'CGM' END,
                     CASE WHEN EXISTS (SELECT 1 FROM genomic_variants gv WHERE gv.user_id = p.id) THEN 'Genomics' END,
                     CASE WHEN EXISTS (SELECT 1 FROM insulin_events ie WHERE ie.user_id = p.id) THEN 'Insulin' END,
                     CASE WHEN od.completed THEN 'Lifestyle' END
                   ) AS data_available,
                   latest.risk_level,
                   GREATEST(p.updated_at, COALESCE(od.updated_at, p.updated_at),
                            COALESCE(latest.assessed_at, p.created_at)) AS last_updated
            FROM profiles p
            LEFT JOIN onboarding_data od ON od.user_id = p.id
            LEFT JOIN LATERAL (
              SELECT a.assessed_at, a.risk_level
              FROM assessments a
              WHERE a.user_id = p.id
              ORDER BY a.assessed_at DESC
              LIMIT 1
            ) latest ON TRUE
            WHERE p.role = 'patient'
              AND COALESCE((
                SELECT cs.share_with_doctor
                FROM consent_settings cs
                WHERE cs.user_id = p.id
              ), TRUE)
              AND (
                ($1 = 'doctor' AND EXISTS (
                  SELECT 1 FROM care_team_memberships ctm
                  WHERE ctm.patient_id = p.id AND ctm.clinician_id = $2
                ))
                OR
                ($1 IN ('hospital', 'wellness') AND EXISTS (
                  SELECT 1
                  FROM organization_memberships viewer
                  JOIN organization_memberships patient
                    ON patient.organization_id = viewer.organization_id
                  WHERE viewer.user_id = $2 AND patient.user_id = p.id
                ))
              )
            ORDER BY latest.assessed_at DESC NULLS LAST, p.full_name
            LIMIT 500
            """,
            connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(viewerId);

        var patients = new List<PatientListItem>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var dob = reader.IsDBNull(2) ? null : reader.GetString(2);
            DateOnly? dateOfBirth = DateOnly.TryParse(dob, CultureInfo.InvariantCulture, out var parsedDob)
                ? parsedDob
                : null;
            DateOnly? lastAssessment = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateOnly>(3);
            var lastUpdated = reader.GetFieldValue<DateTimeOffset>(6);
            patients.Add(new PatientListItem(
                reader.GetGuid(0),
                reader.GetString(1),
                dateOfBirth is null ? null : CalculateAge(dateOfBirth.Value, DateOnly.FromDateTime(DateTime.UtcNow)),
                lastAssessment,
                reader.IsDBNull(4) || string.IsNullOrWhiteSpace(reader.GetString(4))
                    ? "No data"
                    : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                lastUpdated));
        }

        IEnumerable<PatientListItem> result = patients;
        if (!string.IsNullOrWhiteSpace(search))
        {
            result = result.Where(patient =>
                patient.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                patient.Id.ToString().Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(risk))
        {
            result = result.Where(patient => string.Equals(patient.Assessment, risk, StringComparison.OrdinalIgnoreCase));
        }

        return result.ToList();
    }

    private static async Task<IResult> GetOverview(
        System.Security.Claims.ClaimsPrincipal principal,
        ApiDatabaseProvider database,
        CancellationToken cancellationToken)
    {
        var userId = ApiUser.Id(principal);
        await using var connection = await database.OpenConnectionAsync(cancellationToken);
        var role = await GetRoleAsync(connection, userId, cancellationToken);
        if (role is not ("doctor" or "hospital" or "wellness"))
        {
            return Results.Forbid();
        }

        await using var command = new NpgsqlCommand(
            """
            WITH visible_patients AS (
              SELECT DISTINCT p.id
              FROM profiles p
              WHERE p.role = 'patient'
                AND COALESCE((
                  SELECT cs.share_with_doctor
                  FROM consent_settings cs
                  WHERE cs.user_id = p.id
                ), TRUE)
                AND (
                  ($1 = 'doctor' AND EXISTS (
                    SELECT 1 FROM care_team_memberships ctm
                    WHERE ctm.patient_id = p.id AND ctm.clinician_id = $2
                  ))
                  OR
                  ($1 IN ('hospital', 'wellness') AND EXISTS (
                    SELECT 1
                    FROM organization_memberships viewer
                    JOIN organization_memberships patient
                      ON patient.organization_id = viewer.organization_id
                    WHERE viewer.user_id = $2 AND patient.user_id = p.id
                  ))
                )
            ),
            patient_data AS (
              SELECT vp.id,
                EXISTS (SELECT 1 FROM assessments a WHERE a.user_id = vp.id) AS assessed,
                EXISTS (SELECT 1 FROM cgm_readings c WHERE c.user_id = vp.id) AS has_cgm,
                (
                  EXISTS (SELECT 1 FROM lab_results l WHERE l.user_id = vp.id)::int +
                  EXISTS (SELECT 1 FROM cgm_readings c WHERE c.user_id = vp.id)::int +
                  EXISTS (SELECT 1 FROM genomic_variants g WHERE g.user_id = vp.id)::int +
                  EXISTS (SELECT 1 FROM onboarding_data o WHERE o.user_id = vp.id AND o.completed)::int
                ) AS sources,
                (SELECT a.risk_level FROM assessments a WHERE a.user_id = vp.id
                 ORDER BY a.assessed_at DESC LIMIT 1) AS risk
              FROM visible_patients vp
            )
            SELECT count(*)::int,
                   count(*) FILTER (WHERE assessed)::int,
                   count(*) FILTER (WHERE has_cgm)::int,
                   COALESCE(avg(sources)::numeric, 0)
            FROM patient_data
            """,
            connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(userId);
        int total;
        int assessed;
        int cgm;
        decimal avgSources;
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            await reader.ReadAsync(cancellationToken);
            total = reader.GetInt32(0);
            assessed = reader.GetInt32(1);
            cgm = reader.GetInt32(2);
            avgSources = reader.GetDecimal(3);
        }

        await using var riskCommand = new NpgsqlCommand(
            """
            SELECT a.risk_level, count(*)::int
            FROM assessments a
            WHERE a.id IN (
              SELECT DISTINCT ON (latest.user_id) latest.id
              FROM assessments latest
              JOIN profiles p ON p.id = latest.user_id AND p.role = 'patient'
              WHERE (
                ($1 = 'doctor' AND EXISTS (
                  SELECT 1 FROM care_team_memberships ctm
                  WHERE ctm.patient_id = p.id AND ctm.clinician_id = $2
                ))
                OR
                ($1 IN ('hospital', 'wellness') AND EXISTS (
                  SELECT 1 FROM organization_memberships viewer
                  JOIN organization_memberships patient
                    ON patient.organization_id = viewer.organization_id
                  WHERE viewer.user_id = $2 AND patient.user_id = p.id
                ))
              )
              AND COALESCE((SELECT cs.share_with_doctor FROM consent_settings cs WHERE cs.user_id = p.id), TRUE)
              ORDER BY latest.user_id, latest.assessed_at DESC
            )
            GROUP BY a.risk_level
            """,
            connection);
        riskCommand.Parameters.AddWithValue(role);
        riskCommand.Parameters.AddWithValue(userId);
        var riskDistribution = new List<object>();
        await using (var reader = await riskCommand.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                riskDistribution.Add(new
                {
                    name = reader.GetString(0) switch
                    {
                        "lower" => "Lower",
                        "moderate" => "Moderate",
                        "elevated" => "Elevated",
                        var value => value,
                    },
                    value = reader.GetInt32(1),
                });
            }
        }

        var assessmentTrends = await LoadAssessmentTrendsAsync(connection, role, userId, cancellationToken);
        var hba1cDistribution = await LoadHba1cDistributionAsync(connection, role, userId, cancellationToken);
        var patients = await LoadPatientsAsync(connection, role, userId, null, null, cancellationToken);

        return Results.Ok(new
        {
            stats = new
            {
                totalPatients = total,
                assessedPatients = assessed,
                pendingAssessments = Math.Max(0, total - assessed),
                dataCompleteness = total == 0 ? 0 : (int)Math.Round(avgSources / 4m * 100m),
                cgmAdoption = total == 0 ? 0 : (int)Math.Round(cgm * 100m / total),
                members = total,
                assessments = assessed,
                completedSurveys = assessed,
                healthTrend = 0,
            },
            riskDistribution,
            assessmentTrends,
            hba1cDistribution,
            patients = patients.Take(20),
        });
    }

    private static async Task<List<object>> LoadAssessmentTrendsAsync(
        NpgsqlConnection connection,
        string role,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            SELECT to_char(date_trunc('month', a.assessed_at), 'Mon') AS month, count(*)::int
            FROM assessments a
            JOIN profiles p ON p.id = a.user_id AND p.role = 'patient'
            WHERE a.assessed_at >= date_trunc('month', CURRENT_DATE) - interval '5 months'
              AND COALESCE((SELECT cs.share_with_doctor FROM consent_settings cs WHERE cs.user_id = p.id), TRUE)
              AND (
                ($1 = 'doctor' AND EXISTS (
                  SELECT 1 FROM care_team_memberships ctm
                  WHERE ctm.patient_id = p.id AND ctm.clinician_id = $2
                ))
                OR
                ($1 IN ('hospital', 'wellness') AND EXISTS (
                  SELECT 1 FROM organization_memberships viewer
                  JOIN organization_memberships patient
                    ON patient.organization_id = viewer.organization_id
                  WHERE viewer.user_id = $2 AND patient.user_id = p.id
                ))
              )
            GROUP BY date_trunc('month', a.assessed_at)
            ORDER BY date_trunc('month', a.assessed_at)
            """,
            connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(userId);
        var trends = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            trends.Add(new { month = reader.GetString(0), assessed = reader.GetInt32(1) });
        }

        return trends;
    }

    private static async Task<List<object>> LoadHba1cDistributionAsync(
        NpgsqlConnection connection,
        string role,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            WITH visible_patients AS (
              SELECT p.id
              FROM profiles p
              WHERE p.role = 'patient'
                AND COALESCE((SELECT cs.share_with_doctor FROM consent_settings cs WHERE cs.user_id = p.id), TRUE)
                AND (
                  ($1 = 'doctor' AND EXISTS (
                    SELECT 1 FROM care_team_memberships ctm
                    WHERE ctm.patient_id = p.id AND ctm.clinician_id = $2
                  ))
                  OR
                  ($1 IN ('hospital', 'wellness') AND EXISTS (
                    SELECT 1 FROM organization_memberships viewer
                    JOIN organization_memberships patient
                      ON patient.organization_id = viewer.organization_id
                    WHERE viewer.user_id = $2 AND patient.user_id = p.id
                  ))
                )
            ),
            numeric_results AS (
              SELECT CASE
                WHEN btrim(l.result) ~ '^[0-9]+(\.[0-9]+)?$' THEN btrim(l.result)::numeric
                ELSE NULL
              END AS result
              FROM lab_results l
              JOIN visible_patients vp ON vp.id = l.user_id
              WHERE lower(l.parameter) = 'hba1c'
            )
            SELECT CASE
                     WHEN result < 5.7 THEN '<5.7%'
                     WHEN result < 6.5 THEN '5.7-6.4%'
                     ELSE '6.5%+'
                   END AS range,
                   count(*)::int
            FROM numeric_results
            WHERE result BETWEEN 2 AND 25
            GROUP BY range
            ORDER BY min(result)
            """,
            connection);
        command.Parameters.AddWithValue(role);
        command.Parameters.AddWithValue(userId);
        var distribution = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            distribution.Add(new { range = reader.GetString(0), patients = reader.GetInt32(1) });
        }

        return distribution;
    }

    private static async Task<string> GetRoleAsync(
        NpgsqlConnection connection,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("SELECT role FROM profiles WHERE id = $1", connection);
        command.Parameters.AddWithValue(userId);
        var role = await command.ExecuteScalarAsync(cancellationToken);
        return role as string ?? "patient";
    }

    private static int CalculateAge(DateOnly dateOfBirth, DateOnly today)
    {
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
        {
            age--;
        }

        return Math.Max(0, age);
    }
}
