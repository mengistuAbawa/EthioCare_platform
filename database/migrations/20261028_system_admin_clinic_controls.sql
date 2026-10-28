BEGIN;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS operational_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'clinics_operational_status_check'
       AND conrelid = 'clinics'::regclass
  ) THEN
    ALTER TABLE clinics
      ADD CONSTRAINT clinics_operational_status_check
      CHECK (operational_status IN ('active', 'suspended'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS clinics_operational_status_idx
  ON clinics (operational_status, verification_status);

COMMIT;
