-- Persist account state independently from user-editable authentication metadata.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_status_check
    CHECK (account_status IN (
      'pending_verification',
      'active',
      'suspended',
      'locked',
      'deactivated',
      'pending_deletion'
    ));

-- Platform-admin grants are made only through trusted database administration
-- or a future explicitly authorized administrative workflow.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('patient', 'doctor', 'hospital', 'wellness', 'platform_admin'));
