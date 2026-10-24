ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'patient';

UPDATE profiles
SET account_type = 'doctor'
WHERE role = 'doctor'
   OR EXISTS (
     SELECT 1
     FROM doctor_profiles
     WHERE doctor_profiles.user_id = profiles.id
   );

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_type_check
    CHECK (account_type IN ('patient', 'doctor'));
