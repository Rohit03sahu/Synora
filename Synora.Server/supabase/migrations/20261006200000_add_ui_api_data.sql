-- Persistent data required by patient, clinician, hospital, and wellness UI.

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
  ) AS row_number
  FROM onboarding_data
)
DELETE FROM onboarding_data target
USING ranked
WHERE target.id = ranked.id AND ranked.row_number > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY user_id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
  ) AS row_number
  FROM consent_settings
)
DELETE FROM consent_settings target
USING ranked
WHERE target.id = ranked.id AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_data_user_id_unique ON onboarding_data(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_settings_user_id_unique ON consent_settings(user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id AND role = 'patient');
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = 'patient');

CREATE TABLE IF NOT EXISTS cgm_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  glucose_mg_dl numeric(7,2) NOT NULL CHECK (glucose_mg_dl >= 0),
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cgm_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_cgm_readings" ON cgm_readings;
CREATE POLICY "select_own_cgm_readings" ON cgm_readings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cgm_readings" ON cgm_readings;
CREATE POLICY "insert_own_cgm_readings" ON cgm_readings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cgm_readings" ON cgm_readings;
CREATE POLICY "delete_own_cgm_readings" ON cgm_readings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_cgm_readings_user_recorded
  ON cgm_readings(user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS insulin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('meal', 'correction', 'basal', 'other')),
  carbs_grams numeric(7,2) CHECK (carbs_grams IS NULL OR carbs_grams >= 0),
  units numeric(7,2) NOT NULL CHECK (units >= 0),
  note text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE insulin_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_insulin_events" ON insulin_events;
CREATE POLICY "select_own_insulin_events" ON insulin_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_insulin_events" ON insulin_events;
CREATE POLICY "insert_own_insulin_events" ON insulin_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_insulin_events" ON insulin_events;
CREATE POLICY "delete_own_insulin_events" ON insulin_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_insulin_events_user_recorded
  ON insulin_events(user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS insulin_basal_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_of_day smallint NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  rate_units_per_hour numeric(7,3) NOT NULL CHECK (rate_units_per_hour >= 0),
  source text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, hour_of_day)
);
ALTER TABLE insulin_basal_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_insulin_basal_rates" ON insulin_basal_rates;
CREATE POLICY "select_own_insulin_basal_rates" ON insulin_basal_rates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_insulin_basal_rates" ON insulin_basal_rates;
CREATE POLICY "insert_own_insulin_basal_rates" ON insulin_basal_rates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_insulin_basal_rates" ON insulin_basal_rates;
CREATE POLICY "update_own_insulin_basal_rates" ON insulin_basal_rates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS genomic_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  gene text NOT NULL,
  variant_id text NOT NULL,
  genotype text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  description text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, variant_id)
);
ALTER TABLE genomic_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_genomic_variants" ON genomic_variants;
CREATE POLICY "select_own_genomic_variants" ON genomic_variants FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_genomic_variants" ON genomic_variants;
CREATE POLICY "insert_own_genomic_variants" ON genomic_variants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_genomic_variants" ON genomic_variants;
CREATE POLICY "delete_own_genomic_variants" ON genomic_variants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS device_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  device_type text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  connected_at timestamptz,
  last_synced_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, device_type)
);
ALTER TABLE device_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_device_connections" ON device_connections;
CREATE POLICY "select_own_device_connections" ON device_connections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_device_connections" ON device_connections;
CREATE POLICY "insert_own_device_connections" ON device_connections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "update_own_device_connections" ON device_connections;
CREATE POLICY "update_own_device_connections" ON device_connections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND status <> 'connected')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'disconnected'));
CREATE INDEX IF NOT EXISTS idx_device_connections_user ON device_connections(user_id);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  risk_level text NOT NULL CHECK (risk_level IN ('lower', 'moderate', 'elevated')),
  score numeric(6,2) CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  model_version text NOT NULL DEFAULT 'manual',
  summary text NOT NULL DEFAULT '',
  contributing_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  cross_signal_insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE INDEX IF NOT EXISTS idx_assessments_user_assessed
  ON assessments(user_id, assessed_at DESC);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type text NOT NULL CHECK (organization_type IN ('hospital', 'wellness')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('admin', 'clinician', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS care_team_memberships (
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinician_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, clinician_id)
);
CREATE INDEX IF NOT EXISTS idx_care_team_clinician ON care_team_memberships(clinician_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_updates boolean NOT NULL DEFAULT true,
  data_source_alerts boolean NOT NULL DEFAULT true,
  lab_processing boolean NOT NULL DEFAULT true,
  weekly_summary boolean NOT NULL DEFAULT false,
  product_updates boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_own_notification_preferences" ON notification_preferences;
CREATE POLICY "manage_own_notification_preferences" ON notification_preferences FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  completed_at timestamptz,
  UNIQUE (user_id) DEFERRABLE INITIALLY IMMEDIATE
);
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_own_account_deletion_request" ON account_deletion_requests;
CREATE POLICY "insert_own_account_deletion_request" ON account_deletion_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "select_own_account_deletion_request" ON account_deletion_requests;
CREATE POLICY "select_own_account_deletion_request" ON account_deletion_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Service-side writes also maintain modification times.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    'patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_profile_after_auth_user_insert ON auth.users;
CREATE TRIGGER create_profile_after_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

DROP TRIGGER IF EXISTS set_onboarding_data_updated_at ON onboarding_data;
CREATE TRIGGER set_onboarding_data_updated_at BEFORE UPDATE ON onboarding_data
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_consent_settings_updated_at ON consent_settings;
CREATE TRIGGER set_consent_settings_updated_at BEFORE UPDATE ON consent_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
