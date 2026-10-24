# Synora Server API

The ASP.NET Core API serves the authenticated UI and owns account management, access-token validation, and PostgreSQL-backed health records. Synora does not rely on a managed identity provider or hosted database platform.

## Local setup

### Docker Compose

From the repository root, copy `.env.docker.example` to `.env`, set a long random `POSTGRES_PASSWORD`, and run `docker compose up --build`. Compose starts PostgreSQL, applies the numbered migrations to a new database volume, starts the API, and then starts the client. Open `http://localhost:3000`; the API is at `http://localhost:5247`. Set `ASPNETCORE_ENVIRONMENT=Development` in `.env` to enable Swagger at `/swagger` for local use. SMTP and Twilio settings are optional for startup, but required for account email and phone-verification workflows.

The client API URL is embedded at image build time through `NEXT_PUBLIC_API_URL`. For local Docker use, keep it set to `http://localhost:5247` so the browser can reach the published API port. Rebuild the client image after changing this value.

### Manual setup

1. Create a standalone PostgreSQL database and a restricted database login for the API.
2. Apply the SQL files in `Database/Migrations/` in numeric order to a new database.
3. Copy `.env.example` values into your shell or .NET user secrets. Do not commit credentials.
4. Run the API:

   ```sh
   cd synora.server.api
   dotnet run
   ```

5. Set `NEXT_PUBLIC_API_URL=http://localhost:5247` in `synora.client/.env.local`, then run the client with `npm run dev`.

The API listens on port `5247` in the supplied launch profile. `/health` checks the PostgreSQL connection and returns `503` until the database is configured.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ConnectionStrings__Postgres` | Standalone PostgreSQL connection string. Use TLS for hosted databases and a restricted API database role. |
| `Cors__Origins__0` | Allowed web-client origin; add each deployed client origin as a separate indexed value. |
| `Client__BaseUrl` | Public client origin used to generate verification and password-reset links. |
| `Email__SmtpHost`, `Email__SmtpPort` | SMTP server for account verification and password-reset email. The configured SMTP connection uses TLS. |
| `Email__SmtpUsername`, `Email__SmtpPassword` | Optional SMTP credentials; set both or neither. |
| `Email__FromAddress` | Verified sender address for account emails. |
| `Twilio__AccountSid`, `Twilio__AuthToken`, `Twilio__FromNumber` | Twilio REST credentials and sender number for clinician phone-verification codes. |
| `Foundry__Endpoint`, `Foundry__ApiKey`, `Foundry__Model` | Azure AI Foundry configuration for lab-report OCR. |

Keep database, SMTP, Twilio, and Foundry credentials server-side. The client only needs `NEXT_PUBLIC_API_URL`.

## User management

`synora.server.api/UserManagement/` provides email/password registration, email confirmation, sign-in, sign-out, password changes and reset, and phone verification. Passwords are stored as PBKDF2-SHA256 hashes. Sign-in issues a random opaque bearer token; only its SHA-256 hash is stored in PostgreSQL. Sessions expire after seven days, and password resets revoke all sessions.

Email verification and password reset require SMTP configuration. Clinician onboarding requires Twilio configuration and an E.164 phone number. Delivery failures are returned explicitly; account confirmation can be resent from `/verify-email`.

New registrations always receive the `patient` role. Clinicians register through `/doctor-sign-up`, verify their email and phone, and submit credentials for review. A trusted database operator grants `platform_admin` only after verifying the administrator's account. The API never accepts a role from the public registration request.

All account-owned health-data operations are authorized in the API and use the authenticated user ID in database queries. PostgreSQL Row Level Security and provider-specific `auth.users`/`auth.uid()` functions are not used.

## Existing account migration

The migration directory describes a new standalone PostgreSQL database; it is not a drop-in upgrade for a Supabase database. Back up the source database and plan a controlled export/import of `profiles` and application data, preserving profile UUIDs so existing data relationships remain valid. Supabase-managed password credentials are not migrated by these scripts. Imported profiles need a password reset through the new SMTP flow; completing that reset confirms the email and allows accounts in `pending_verification` to become active. Keep the old service available until imported data and account recovery have been verified.

## API surface

Public account endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a patient account and send a confirmation email |
| `POST` | `/api/auth/verify-email` | Consume a confirmation token |
| `POST` | `/api/auth/resend-verification` | Resend a pending confirmation |
| `POST` | `/api/auth/login` | Verify credentials and issue an opaque session token |
| `POST` | `/api/auth/password-reset` | Request a password-reset link |
| `POST` | `/api/auth/password-reset/confirm` | Set a password and revoke existing sessions |

Authenticated account endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/logout` | Revoke the current session |
| `POST` | `/api/auth/change-password` | Change a password after checking the current password |
| `POST` | `/api/auth/phone/send-code` | Send a clinician phone-verification code |
| `POST` | `/api/auth/phone/verify-code` | Verify the phone number |

The remaining `/api` routes require the `Authorization: Bearer <access-token>` header. API routes and request binding live in `synora.server.api`; PostgreSQL connections, queries, and health checks are implemented in `synora.server.infrastructure`, which owns the Npgsql dependency.

The administrator review interface is `/app/admin/doctors`. Approved clinicians appear in `/app/patient/doctors`; patient requests are handled at `/app/doctor/requests`, and accepted conversations are available at `/app/messages`. The API stores in-app notifications, but email/SMS notifications, live WebSocket delivery, and automatic appointment reminders require providers that are not configured in this repository. No synthetic approved doctors are seeded.

The assessment table is a storage contract for a trusted assessment pipeline. This API intentionally provides read-only access to assessment outputs until a validated server-side assessment producer is available.
