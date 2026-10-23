-- Doctor profiles remain private until credential review approves them.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'doctor', 'hospital', 'wellness', 'platform_admin'));

CREATE TABLE IF NOT EXISTS doctor_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialty text NOT NULL DEFAULT '',
  qualifications text NOT NULL DEFAULT '',
  registration_number text NOT NULL DEFAULT '',
  issuing_council text NOT NULL DEFAULT '',
  experience_years smallint NOT NULL DEFAULT 0 CHECK (experience_years BETWEEN 0 AND 80),
  expertise text[] NOT NULL DEFAULT '{}',
  affiliation text NOT NULL DEFAULT '',
  languages text[] NOT NULL DEFAULT '{}',
  clinic_address text NOT NULL DEFAULT '',
  consultation_modes text[] NOT NULL DEFAULT '{}',
  consultation_fee numeric(10,2) CHECK (consultation_fee IS NULL OR consultation_fee >= 0),
  biography text NOT NULL DEFAULT '',
  interests text[] NOT NULL DEFAULT '{}',
  availability jsonb NOT NULL DEFAULT '[]'::jsonb,
  photo_url text,
  verification_status text NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft', 'pending_verification', 'approved', 'rejected')),
  review_note text,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_number, issuing_council)
);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_directory
  ON doctor_profiles(specialty, verification_status, experience_years);
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_profiles_api_access ON doctor_profiles;
CREATE POLICY doctor_profiles_api_access ON doctor_profiles FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_credential_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
  document_name text NOT NULL,
  content_type text NOT NULL,
  file_data bytea NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'accepted', 'rejected'))
);
CREATE INDEX IF NOT EXISTS idx_doctor_credentials_owner ON doctor_credential_documents(doctor_id);
ALTER TABLE doctor_credential_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_credentials_api_access ON doctor_credential_documents;
CREATE POLICY doctor_credentials_api_access ON doctor_credential_documents FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_consultation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'closed')),
  consultation_mode text NOT NULL CHECK (consultation_mode IN ('online', 'in_person')),
  preferred_at timestamptz,
  scheduled_at timestamptz,
  message text NOT NULL DEFAULT '',
  shared_sections text[] NOT NULL DEFAULT '{}',
  health_data_consent boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_request_one_pending
  ON doctor_consultation_requests(patient_id, doctor_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_doctor_request_doctor_status
  ON doctor_consultation_requests(doctor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_request_patient
  ON doctor_consultation_requests(patient_id, created_at DESC);
ALTER TABLE doctor_consultation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_requests_api_access ON doctor_consultation_requests;
CREATE POLICY doctor_requests_api_access ON doctor_consultation_requests FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES doctor_consultation_requests(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_patient ON doctor_conversations(patient_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor ON doctor_conversations(doctor_id, updated_at DESC);
ALTER TABLE doctor_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_conversations_api_access ON doctor_conversations;
CREATE POLICY doctor_conversations_api_access ON doctor_conversations FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES doctor_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_doctor_messages_conversation
  ON doctor_messages(conversation_id, created_at);
ALTER TABLE doctor_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_messages_api_access ON doctor_messages;
CREATE POLICY doctor_messages_api_access ON doctor_messages FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  resource_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON in_app_notifications(user_id, created_at DESC) WHERE read_at IS NULL;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_api_access ON in_app_notifications;
CREATE POLICY notifications_api_access ON in_app_notifications FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_conversation_blocks (
  conversation_id uuid NOT NULL REFERENCES doctor_conversations(id) ON DELETE CASCADE,
  blocked_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, blocked_by)
);
ALTER TABLE doctor_conversation_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_blocks_api_access ON doctor_conversation_blocks;
CREATE POLICY conversation_blocks_api_access ON doctor_conversation_blocks FOR ALL TO synora_api
  USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS doctor_conversation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES doctor_conversations(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved'))
);
ALTER TABLE doctor_conversation_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_reports_api_access ON doctor_conversation_reports;
CREATE POLICY conversation_reports_api_access ON doctor_conversation_reports FOR ALL TO synora_api
  USING (true) WITH CHECK (true);