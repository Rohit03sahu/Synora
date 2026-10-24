/*
# Create core tables for GenoGluco health platform

## Overview
Creates the database schema for a multi-user AI diabetes risk platform.
Users sign in with standalone email/password authentication. Each user has a role
(patient, doctor, hospital, wellness) stored in their profile. Patients
have onboarding data, lab results, consent settings, and an audit trail.

## New Tables

1. `profiles` — application account and profile fields
   - id (uuid, PK)
   - email (text)
   - full_name (text)
   - phone (text, nullable)
   - role (text: patient|doctor|hospital|wellness, default patient)
   - created_at, updated_at (timestamps)

2. `onboarding_data` — patient health survey from 7-step wizard
   - id (uuid PK)
   - user_id (uuid, FK to profiles; written by the API)
   - personal_info (jsonb)
   - medical_history (jsonb)
   - family_history (jsonb)
   - lifestyle (jsonb)
   - diabetes_history (jsonb)
   - devices (jsonb)
   - completed (boolean, default false)
   - created_at, updated_at

3. `lab_results` — patient lab report data
   - id (uuid PK)
   - user_id (uuid, FK to profiles; written by the API)
   - parameter (text)
   - result (text)
   - unit (text)
   - reference (text)
   - date (text)
   - status (text: normal|borderline|high|low)
   - created_at

4. `consent_settings` — patient consent toggles
   - id (uuid PK)
   - user_id (uuid, FK to profiles; written by the API)
   - lab_data (boolean, default true)
   - cgm_data (boolean, default true)
   - genomic_data (boolean, default true)
   - lifestyle_data (boolean, default true)
   - insulin_device_data (boolean, default false)
   - share_with_doctor (boolean, default true)
   - research_participation (boolean, default false)
   - created_at, updated_at

5. `audit_trail` — track data access and changes
   - id (uuid PK)
   - user_id (uuid, FK to profiles; written by the API)
   - action (text)
   - actor (text)
   - created_at

## Security
- User ownership is enforced by the API.
- The API scopes health-data reads and writes to the authenticated profile ID.
- The API, not the client, supplies owner IDs for inserts.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'hospital', 'wellness')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Onboarding data table
CREATE TABLE IF NOT EXISTS onboarding_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_info jsonb DEFAULT '{}',
  medical_history jsonb DEFAULT '{}',
  family_history jsonb DEFAULT '{}',
  lifestyle jsonb DEFAULT '{}',
  diabetes_history jsonb DEFAULT '{}',
  devices jsonb DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Lab results table
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parameter text NOT NULL,
  result text NOT NULL,
  unit text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'borderline', 'high', 'low')),
  created_at timestamptz DEFAULT now()
);
-- Consent settings table
CREATE TABLE IF NOT EXISTS consent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lab_data boolean NOT NULL DEFAULT true,
  cgm_data boolean NOT NULL DEFAULT true,
  genomic_data boolean NOT NULL DEFAULT true,
  lifestyle_data boolean NOT NULL DEFAULT true,
  insulin_device_data boolean NOT NULL DEFAULT false,
  share_with_doctor boolean NOT NULL DEFAULT true,
  research_participation boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'User',
  created_at timestamptz DEFAULT now()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
