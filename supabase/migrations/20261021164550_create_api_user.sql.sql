/*
# Create API database user

Creates a dedicated Postgres role for the .NET API server so it can
connect via Npgsql with a known password. Grants full CRUD on the
public schema tables that the API needs.

## Security
- The role is created with LOGIN and a password.
- Granted usage on public schema + all existing table privileges.
- Default privileges set so future tables created by postgres are
  also accessible.
*/

CREATE ROLE synora_api WITH LOGIN PASSWORD 'SynoraApi2026!' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT USAGE ON SCHEMA public TO synora_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO synora_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO synora_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO synora_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO synora_api;
