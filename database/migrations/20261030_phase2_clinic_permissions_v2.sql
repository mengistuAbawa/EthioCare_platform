BEGIN;

INSERT INTO role_permissions (role, permission_code)
VALUES ('clinic_admin', 'doctors.read')
ON CONFLICT (role, permission_code) DO NOTHING;

COMMIT;
