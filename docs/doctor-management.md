# Step 5: Doctor management

## Schema and implementation notes

The existing schema stores one clinic assignment per doctor (`doctors.clinic_id` and
`UNIQUE (user_id)`). This implementation retains that constraint; it does not add
multi-clinic assignments. Deactivation is soft: the doctor and service-assignment
rows are kept so appointment foreign keys and historical records remain intact.

The schema has no clinic-suspension status or license-verification workflow.
Public discovery therefore requires `verification_status = 'verified'`, an active
doctor account, an active and available doctor assignment, and an approved profile.
The license number is visible only to the assigned doctor and clinic administrators;
it is never returned by public endpoints. Approval of profile details is not a
claim that a professional license was independently verified.

There is no invitation/email or password-setup service in the existing application.
Clinic administrators can link an existing active user with the `doctor` role;
the application does not create an account with an insecure default password.
An authorized system workflow must provision doctor accounts before they appear
in the account selector.

## Migration

`database/migrations/20261028_doctor_management.sql` is additive and idempotent.
It adds soft-deactivation and public-profile approval flags. It does not drop,
recreate, or delete database objects or records. `database/schema.sql` includes
the same columns for new installations.

Back up the target database first. In Windows CMD, from the repository root:

```cmd
pg_dump "%DATABASE_URL%" --format=custom --file=before-doctor-management.dump
psql "%DATABASE_URL%" -v ON_ERROR_STOP=1 -f database\migrations\20261028_doctor_management.sql
```

Verify the migration:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'doctors' AND column_name IN ('is_active', 'is_profile_approved'))
    OR (table_name = 'doctor_services' AND column_name = 'is_active'))
ORDER BY table_name, column_name;

SELECT COUNT(*) AS doctor_count FROM doctors;
SELECT COUNT(*) AS service_assignment_count FROM doctor_services;
```

## API

All IDs below are positive numeric IDs. Authenticated requests use
`Authorization: Bearer <JWT>`.

| Method and path | Access | Success |
|---|---|---|
| `GET /api/doctors?search=&specialty=&clinic=&city=&page=1&limit=12&sort=name&order=asc` | Public; verified clinics and approved, active, available profiles only | `200`, public doctor list and pagination |
| `GET /api/doctors/:id` | Public; same visibility filter | `200` or `404` |
| `GET /api/doctors/me/profile` | Doctor | `200` with own profile, clinic, and services |
| `PATCH /api/doctors/me/profile` | Doctor | `200`; specialty/qualification edits require clinic review |
| `GET /api/clinics/:clinicId/doctors` | Clinic admin, receptionist, or system admin; clinic-scoped | `200` |
| `GET /api/clinics/:clinicId/doctors/candidates` | Clinic admin with active clinic membership | `200` |
| `POST /api/clinics/:clinicId/doctors` | Clinic admin with active membership; clinic must be verified | `201`; links an existing doctor account |
| `GET /api/clinics/:clinicId/doctors/:doctorId` | Authorized clinic staff; clinic-scoped | `200` or `404` |
| `PATCH /api/clinics/:clinicId/doctors/:doctorId` | Clinic admin with active membership | `200` |
| `DELETE /api/clinics/:clinicId/doctors/:doctorId` | Clinic admin with active membership | `200`; soft deactivation |
| `GET /api/clinics/:clinicId/doctors/:doctorId/services` | Authorized clinic staff; clinic-scoped | `200` |
| `PUT /api/clinics/:clinicId/doctors/:doctorId/services` | Clinic admin with active membership | `200`; replaces active service assignments |
| `GET /api/doctors/admin/statistics` | System administrator only | `200` |
| `GET /api/doctors/admin/audit?page=1&limit=20` | System administrator only | `200`; doctor-management events only |

Expected errors include `400` for invalid input or cross-clinic service IDs,
`401` for missing/invalid authentication, `403` for insufficient role or
clinic membership, `404` for a profile outside the requested clinic, `409` for
duplicate doctor profiles or unverified-clinic assignment, and `500` for
unexpected database failures.

## Manual authorization smoke tests

Run these with test accounts and a development database only. Do not put
production secrets or patient data in the requests. Set these variables in CMD:

```cmd
set API=http://localhost:5000/api
set CLINIC_ID=1
set DOCTOR_USER_ID=2
set DOCTOR_ID=1
set SERVICE_ID=1
set ADMIN_TOKEN=replace-with-test-clinic-admin-jwt
set PATIENT_TOKEN=replace-with-test-patient-jwt
set RECEPTION_TOKEN=replace-with-test-receptionist-jwt
set DOCTOR_TOKEN=replace-with-test-doctor-jwt
```

1. List candidates as a clinic administrator; expect `200` and only active,
   unassigned doctor accounts:

   ```cmd
   curl -i -H "Authorization: Bearer %ADMIN_TOKEN%" "%API%/clinics/%CLINIC_ID%/doctors/candidates"
   ```

2. Link one candidate with valid professional fields; expect `201`. Repeat the
   same request and expect `409`:

   ```cmd
   curl -i -X POST "%API%/clinics/%CLINIC_ID%/doctors" -H "Authorization: Bearer %ADMIN_TOKEN%" -H "Content-Type: application/json" -d "{\"user_id\":%DOCTOR_USER_ID%,\"specialty\":\"Cardiology\",\"qualifications\":\"Provided by clinic administrator\",\"license_number\":\"DEV-LICENSE-01\",\"consultation_fee\":500}"
   ```

3. Attempt creation with a patient token; expect `403`:

   ```cmd
   curl -i -X POST "%API%/clinics/%CLINIC_ID%/doctors" -H "Authorization: Bearer %PATIENT_TOKEN%" -H "Content-Type: application/json" -d "{\"user_id\":%DOCTOR_USER_ID%,\"specialty\":\"Cardiology\",\"license_number\":\"DEV-LICENSE-02\"}"
   ```

4. Attempt a private clinic list without a token; expect `401`. Attempt it with
   a receptionist token not belonging to that clinic; expect `403`.

5. Update the signed-in doctor's own profile with `PATCH /api/doctors/me/profile`;
   expect `200`. From a different doctor account expect only that account's own
   profile, never another doctor's profile. A `license_number`, `role`, or
   `clinic_id` field in the body is rejected with `400`.

6. Assign clinic services with `PUT /api/clinics/:clinicId/doctors/:doctorId/services`
   and `{"service_ids":[%SERVICE_ID%]}`; expect `200`. Include a
   service from another clinic and expect `400`. A receptionist attempting the
   same write must receive `403`.

7. Query `GET /api/doctors` and `GET /api/doctors/:id`; verify the JSON contains
   no email, phone, account ID, license number, or internal approval notes.
   Pending/rejected clinics and profiles awaiting review must not appear.

8. Delete the clinic assignment as an authorized clinic administrator; expect
   `200`, then verify the `doctors` and `doctor_services` rows remain and that
   historical appointment foreign keys are still valid.

9. Query `GET /api/doctors/admin/statistics` with the system administrator
   token (expect `200`) and with a clinic-admin token (expect `403`).
   `GET /api/doctors/admin/audit` has the same role boundary and lists recorded
   doctor-management actions without exposing patient medical information.

## Start the application (Windows CMD)

After installing dependencies and applying the migration, start the backend in
one terminal:

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\server"
npm run dev
```

Start the frontend in a second terminal:

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\client"
npm run dev
```
