BEGIN;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_profile_approved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE doctor_services
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS doctors_active_clinic_idx
  ON doctors (clinic_id, is_active, is_available);

CREATE INDEX IF NOT EXISTS doctor_services_active_idx
  ON doctor_services (doctor_id, is_active);

COMMIT;
