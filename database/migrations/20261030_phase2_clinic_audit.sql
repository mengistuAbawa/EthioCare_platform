BEGIN;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT REFERENCES clinics(id) ON DELETE SET NULL;

UPDATE audit_logs
   SET clinic_id = NULLIF(details->>'clinic_id', '')::BIGINT
 WHERE clinic_id IS NULL
   AND NULLIF(details->>'clinic_id', '') IS NOT NULL;

CREATE OR REPLACE FUNCTION set_audit_clinic_from_details()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  audit_clinic_id BIGINT;
BEGIN
  BEGIN
    audit_clinic_id := NULLIF(NEW.details->>'clinic_id', '')::BIGINT;
  EXCEPTION WHEN invalid_text_representation THEN
    audit_clinic_id := NULL;
  END;
  IF audit_clinic_id IS NOT NULL THEN
    NEW.clinic_id = audit_clinic_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_set_clinic ON audit_logs;
CREATE TRIGGER audit_logs_set_clinic
  BEFORE INSERT OR UPDATE OF details, clinic_id ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION set_audit_clinic_from_details();

CREATE INDEX IF NOT EXISTS audit_logs_clinic_created_idx
  ON audit_logs (clinic_id, created_at DESC);

COMMIT;
