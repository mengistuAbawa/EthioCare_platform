-- Development-only example data. No users, patient data, or credentials are seeded.
-- Run only against a development database. The sample clinic and service inserts
-- are idempotent and do not overwrite existing records.

BEGIN;

INSERT INTO clinics (slug, name, contact_email, contact_phone, city, region, address)
VALUES (
  'ethiocare-demo-addis',
  'EthioCare Demo Clinic',
  'demo-clinic@example.invalid',
  '+251900000000',
  'Addis Ababa',
  'Addis Ababa',
  'Development sample address'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (clinic_id, name, description, fee, duration_minutes)
SELECT id, 'General Consultation', 'Development-only example service.', 0.00, 30
FROM clinics
WHERE slug = 'ethiocare-demo-addis'
ON CONFLICT (clinic_id, name) DO NOTHING;

COMMIT;