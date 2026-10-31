BEGIN;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'doctors'::regclass
       AND contype = 'u'
       AND (
         pg_get_constraintdef(oid) LIKE '%user_id%'
         OR pg_get_constraintdef(oid) LIKE '%license_number%'
       )
  LOOP
    EXECUTE format('ALTER TABLE doctors DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE doctors
  ADD CONSTRAINT doctors_user_clinic_unique UNIQUE (user_id, clinic_id);

CREATE INDEX IF NOT EXISTS doctors_user_idx
  ON doctors (user_id, is_active, is_profile_approved);

CREATE INDEX IF NOT EXISTS doctors_license_idx
  ON doctors (license_number);

COMMIT;
