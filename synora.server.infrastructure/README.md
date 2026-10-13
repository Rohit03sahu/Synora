# Synora Server API

The ASP.NET Core API serves the authenticated UI with PostgreSQL-backed health records. Supabase Auth remains the identity provider: requests must include a Supabase access token, which the API validates against Supabase Auth before accessing data.

## Local setup

1. Apply the SQL migrations in `supabase/migrations/` to the project's Supabase PostgreSQL database, in filename order.
2. Copy `.env.example` values into your shell or .NET user secrets. Do not commit credentials.
3. Run the API:

   ```sh
   cd Synora.Server.Api
   dotnet run
   ```

4. Set `NEXT_PUBLIC_API_URL=http://localhost:5247` in `Synora.Client/.env.local`, then run the client with `npm run dev`.

The API listens on port `5247` in the supplied launch profile. `/health` checks the PostgreSQL connection and returns `503` until the database is configured.

## Configuration

| Variable | Purpose |
| --- | --- |
| `ConnectionStrings__Postgres` | PostgreSQL connection string for the API. Use TLS for hosted databases and a restricted API database role. |
| `Supabase__Url` | Supabase project URL used to validate bearer tokens. |
| `Supabase__AnonKey` | Supabase publishable/anon key sent with the Auth user-validation request. |
| `Cors__Origins__0` | Allowed web-client origin; add each deployed client origin as a separate indexed value. |

The API does not use a service-role key. It validates each bearer token with Supabase Auth and scopes user data operations to the authenticated identity. Clinician and organization patient lists additionally require a trusted profile role, an assigned care-team/organization membership, and patient sharing consent.

New accounts are created as `patient` by the auth trigger. Doctor, hospital, and wellness roles must be assigned by an administrator; a role selected in public signup metadata is never trusted.

## API surface

All routes below `/api` require `Authorization: Bearer <supabase-access-token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET`, `PUT` | `/me` | Read/update the authenticated profile |
| `GET`, `PUT` | `/onboarding` | Read/save patient onboarding sections |
| `GET`, `POST`, `DELETE` | `/labs` | Read, batch-add, and remove owned lab results |
| `GET`, `PUT` | `/consent` | Read/save consent settings |
| `GET` | `/audit?limit=50` | Read the caller's recent audit events |
| `GET`, `POST` | `/cgm` | Read a bounded date range or add CGM readings |
| `GET`, `POST` | `/insulin`, `/insulin/events`, `/insulin/basal-rates` | Read insulin data, add events, and save basal rates |
| `GET`, `POST` | `/devices` | Read devices or request a pending provider connection |
| `GET`, `POST` | `/genomics` | Read/upsert owned genomic variants |
| `GET` | `/assessments` | Read recorded assessments; patient-supplied assessment scores are not accepted |
| `GET` | `/patients` | Search/filter only patients visible to the caller's care team or organization |
| `GET` | `/dashboard/overview` | Role-scoped population summary for hospital/wellness/clinical dashboards |
| `POST` | `/account-deletion-requests` | Submit an auditable account deletion request |

## Data tables

The existing schema supplies `profiles`, `onboarding_data`, `lab_results`, `consent_settings`, and `audit_trail`. The new migration adds CGM readings, insulin events and basal profiles, genomic variants, device connections, recorded assessments, organization/care-team membership, notification preferences, and account deletion requests, with indexes and Supabase RLS policies.

The assessment table is a storage contract for a trusted assessment pipeline. This API intentionally provides read-only access to assessment outputs until a validated server-side assessment producer is available.
