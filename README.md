# Synora

## Lab report OCR

The patient lab-results page can extract suggested results from PNG, JPEG, and WebP report images using a vision-capable model deployed in Azure AI Foundry. The API sends the image directly to Foundry and does not persist it. Patients must review the extracted values before saving them; OCR is not medical advice.

Configure the API with the following environment variables (see `synora.server.infrastructure/.env.example`):

- `Foundry__Endpoint`: the Azure AI Foundry resource inference endpoint, for example `https://<resource>.services.ai.azure.com`
- `Foundry__ApiKey`: the inference endpoint API key
- `Foundry__Model`: the name of the deployed vision model

Keep the API key server-side; do not add it to client environment variables. OCR is unavailable until all three settings are configured.

### Product feature flags

The hospital and wellness experiences are disabled by default. Set these client build environment variables to `true` to show each experience; restart the development server or rebuild/redeploy after changing them:

- `NEXT_PUBLIC_FEATURE_HOSPITALS_ENABLED=true`
- `NEXT_PUBLIC_FEATURE_WELLNESS_ENABLED=true`

The flags control public solution cards, footer links, onboarding role choices, and access to the corresponding `/app/hospital` and `/app/wellness` routes.

### API development

The API routes are implemented by dedicated ASP.NET Core controllers in `synora.server.api`. When the API runs in the Development environment, Swagger UI is available at `http://localhost:5247/swagger`. Use **Authorize** with the opaque access token returned by `POST /api/auth/login` for authenticated API endpoints.

### Run the application with Docker

Install Docker with Compose, copy `.env.docker.example` to `.env`, and replace `POSTGRES_PASSWORD` with a long random value. Start the PostgreSQL database, API, and Next.js client together with `./run.sh` (or run `docker compose up --build`). Open `http://localhost:3000`; the API is available at `http://localhost:5247`. The migrations initialize a new database volume on first start. Account email and SMS features require the SMTP and Twilio settings in `.env`. For local Swagger access, set `ASPNETCORE_ENVIRONMENT=Development` in `.env`.

### Identity and account access

The dedicated `synora.server.api/UserManagement` module manages email/password accounts, email verification, password reset, phone OTP, and revocable sessions. Passwords are stored as PBKDF2-SHA256 hashes; only hashed opaque access tokens are stored in PostgreSQL. New accounts always receive the `patient` role regardless of client-supplied data. Doctor access is granted only after credential review. Authenticated API requests require an active account.

Apply the numbered SQL migrations in `synora.server.infrastructure/Database/Migrations` to a standalone PostgreSQL database before starting the API. Configure the API's PostgreSQL connection string, SMTP settings for account email, and Twilio settings for clinician phone verification as described in `synora.server.infrastructure/README.md`. The account-status migration allows `platform_admin` as a role value but does not grant it to any account; grant privileged roles only through a trusted database administration process. Existing hosted-provider credentials are not migrated; imported accounts must use the new password-reset flow.

### OCR API contract

`POST /api/labs/ocr` accepts an authenticated `multipart/form-data` request with one `file` field containing a PNG, JPEG, or WebP image (maximum 10 MB). The API checks the file signature and supported media type before sending it to Foundry.

On success, the endpoint returns `200 application/json` with an array of suggested lab results:

```json
[
  {
    "parameter": "Hemoglobin A1c",
    "result": "6.1",
    "unit": "%",
    "reference": "4.0-5.6",
    "date": "2026-10-13",
    "status": ""
  }
]
```

`date` and `status` are empty strings when the report does not explicitly provide a usable value. OCR does not infer clinical status. The client lets the patient review and complete suggestions before submitting confirmed values to the existing `POST /api/labs` endpoint. Errors use `application/problem+json`: `400` for missing/invalid uploads, `413` for oversized images, `415` for unsupported media types, `502` for Foundry processing errors, `503` when Foundry is not configured, and `504` for timeouts.