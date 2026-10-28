# EthioCare Database (Step 2)

## Architecture

PostgreSQL is the source of truth for users, clinics, staff membership, doctors, services, schedules, appointments, notifications, and audit history. All primary keys are generated `BIGINT` identity values. Monetary fields use `NUMERIC(12,2)`. Appointment and time-off instants use `TIMESTAMPTZ`; store and compare instants in UTC, and render clinic-local time using the `Africa/Addis_Ababa` time zone in the application.

The five allowed account roles are checked in `users.role`: `system_admin`, `clinic_admin`, `doctor`, `receptionist`, and `patient`. Composite foreign keys ensure clinic memberships match the account's role, doctor profiles reference doctor accounts, and appointments reference patient accounts. `clinic_members` scopes clinic administrators and receptionists to their assigned clinics. This is data modeling only: backend authorization and role checks are still required in Step 3.

## Files

- `database/schema.sql`: additive DDL, constraints, indexes, and update triggers.
- `database/seeds.sql`: optional development clinic/service only. It creates no users or credentials.
- `server/src/config/db.js`: CommonJS `pg.Pool`, loading `server/.env` and using the existing `DATABASE_URL` setting.
- `server/.env.example`: safe template; copy it to `server/.env` and replace the local password yourself.

The root `.gitignore` already excludes `server/.env` and permits `server/.env.example`. Do not commit the real `.env`.

## Relationships And Integrity

- A user may create a clinic. Deleting the creator later sets `clinics.created_by` to null.
- `clinic_members` joins users and clinics and allows one membership per user per clinic. Membership deletion is explicit; referenced clinic and user rows are restricted from hard deletion.
- Each doctor has one doctor-role user account and belongs to one clinic. Each service belongs to one clinic. Composite foreign keys in `doctor_services` and `appointments` ensure the doctor, service, and clinic agree, and appointments must use a service assigned to that doctor.
- `working_hours` stores one weekday interval per doctor (`0` Sunday through `6` Saturday). `time_off` stores unavailable intervals.
- An appointment belongs to a patient, doctor, clinic, and service. `ends_at > starts_at` is required.
- GiST exclusion constraints prevent overlapping half-open `[start, end)` intervals for the same doctor and for the same patient while an appointment is `pending` or `confirmed`. Adjacent appointments are allowed. `cancelled`, `rejected`, `completed`, and `no_show` appointments do not reserve a slot.
- `ON DELETE RESTRICT` protects referenced appointment history. Notifications and audit actors use `SET NULL` where preserving the record is more important than retaining the deleted account reference. Prefer status changes and deactivation over hard deletes.
- `updated_at` triggers cover mutable tables. Append-only audit and notification records intentionally have no update timestamp.

## PostgreSQL Requirement

`schema.sql` requires PostgreSQL 12 or later and the `btree_gist` extension. This extension supplies GiST equality operators for scalar IDs used with timestamp ranges in exclusion constraints. The database role applying the schema must be allowed to create the extension (often a database owner/superuser). No PostGIS or other extension is required.

## Before Applying To An Existing Database

The schema was created for this project's currently empty `database/` directory; no existing SQL schema was found during implementation. `CREATE TABLE IF NOT EXISTS` makes a first application safe to repeat, but does **not** migrate an older table definition, and existing conflicting data can prevent new constraints from being installed. Do not drop a database, table, or data to resolve such a conflict.

Before applying to any database with existing EthioCare objects, back it up and inspect `information_schema.columns`, `pg_constraint`, and `pg_indexes` using the queries below. Compare names, types, nullability, constraints, and indexes with `schema.sql`. Write and review an explicit forward migration for any difference, including data cleanup/backfill, before applying it. If an exclusion constraint cannot be added because active appointments overlap, resolve those rows intentionally; do not silently cancel or delete them. The schema transaction rolls back its DDL if any statement fails.

## Setup From Windows CMD

Run commands from the project root in **Command Prompt** (`cmd.exe`). Install PostgreSQL, ensure its `bin` directory is on `PATH`, and replace only the local database password in `server/.env`. `psql -W` prompts for the PostgreSQL role password without putting it in the command line.

1. Check connectivity:

   ```cmd
   psql -U postgres -h localhost -p 5432 -d postgres -W -c "SELECT current_database(), current_user, version();"
   ```

2. Create the database only if it is absent. The following lines are for interactive CMD (not a `.bat` file):

   ```cmd
  set DB_EXISTS=
  for /f %i in ('psql -U postgres -h localhost -p 5432 -d postgres -W -tAc "SELECT 1 FROM pg_database WHERE datname = $$ethioCare_db$$"') do set DB_EXISTS=%i
   if not "%DB_EXISTS%"=="1" createdb -U postgres -h localhost -p 5432 -W ethioCare_db
   ```

   If placing these commands in a `.bat` file, change `%i` to `%%i`. If `DB_EXISTS` is `1`, the existing database is reused and is not dropped or recreated.

3. Configure the backend environment file:

   ```cmd
   copy server\.env.example server\.env
   notepad server\.env
   ```

  Set `DATABASE_URL` to the same database, for example `postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/ethioCare_db`. URL-encode special characters in the password. Keep the password local and do not paste it into logs or source control. Preserve any existing JWT settings in `server/.env`; this step does not configure or replace them.

4. Apply the schema:

   ```cmd
  psql -U postgres -h localhost -p 5432 -d ethioCare_db -W -v ON_ERROR_STOP=1 -f database\schema.sql
   ```

5. Optional: apply development-only sample clinic and service data:

   ```cmd
  psql -U postgres -h localhost -p 5432 -d ethioCare_db -W -v ON_ERROR_STOP=1 -f database\seeds.sql
   ```

6. Verify schema using the queries in the next section, then verify the backend pool:

   ```cmd
   cd server
   node -e "const pool=require('./src/config/db'); pool.query('SELECT current_database() AS database, current_user AS role').then(({rows})=>{console.log('PostgreSQL connection OK:', rows[0].database); return pool.end()}).catch(async()=>{console.error('PostgreSQL connection failed; check DATABASE_URL and that PostgreSQL is running.'); await pool.end(); process.exitCode=1})"
   cd ..
   ```

   The command deliberately reports no connection error details that could contain configuration. A successful connection prints the database name only. The pool uses a five-second connection timeout. `pg` is already an installed server dependency; no new dependency is needed.

## Setup In pgAdmin 4

1. Connect to the local PostgreSQL server using pgAdmin and verify its version is 12 or later.
2. Expand **Databases**. If `ethioCare_db` exists, use that database and inspect it first; do not delete or recreate it. Otherwise, right-click **Databases**, select **Create > Database**, enter `ethioCare_db`, and save.
3. Select `ethioCare_db`, open **Tools > Query Tool**, load `database/schema.sql`, inspect it, and execute it. If extension creation is denied, ask the database administrator to enable `btree_gist` for this database, then rerun the schema after confirming the prior transaction rolled back.
4. Optionally load and execute `database/seeds.sql` against a development database only.
5. Run the verification queries below in Query Tool. Configure `server/.env` separately for the Node backend.

## Verification Queries

### Required tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users', 'clinic_members', 'clinics', 'doctors', 'services', 'doctor_services',
    'working_hours', 'time_off', 'appointments', 'notifications', 'audit_logs'
  )
ORDER BY table_name;
```

Expected: 11 rows, one for each listed table.

### Primary keys, foreign keys, unique/check/exclusion constraints

```sql
SELECT conrelid::regclass AS table_name, conname, contype,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY table_name::text, conname;
```

Expected: primary keys (`p`), foreign keys (`f`), unique (`u`), check (`c`), and two appointment exclusion constraints (`x`). Confirm `appointments_doctor_no_active_overlap` and `appointments_patient_no_active_overlap` both appear.

### Indexes and extension

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'btree_gist';
```

Expected: query indexes include the declared unique, lookup, and GiST indexes; the extension query returns one row.

### Clinic relationships and checks

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('doctor_services'::regclass, 'appointments'::regclass)
  AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;
```

Expected: composite foreign keys include clinic IDs for doctor/service assignments and appointments, preventing cross-clinic assignments.

To verify rejected data without leaving rows behind, run this transaction. It succeeds only if invalid roles, duplicate emails, and negative fees are rejected. The generated test rows are rolled back:

```sql
BEGIN;
DO $$
DECLARE
  test_clinic_id BIGINT;
BEGIN
  BEGIN
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ('Constraint test', 'constraint-role-test@example.invalid', 'not-used', 'invalid_role');
    RAISE EXCEPTION 'Invalid role was unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ('Constraint test', 'unique-email-test@example.invalid', 'not-used', 'patient');

  BEGIN
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ('Constraint test duplicate', 'unique-email-test@example.invalid', 'not-used', 'patient');
    RAISE EXCEPTION 'Duplicate email was unexpectedly accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  INSERT INTO clinics (slug, name, city, address)
  VALUES ('constraint-test-' || txid_current()::text, 'Constraint test', 'Test city', 'Test address')
  RETURNING id INTO test_clinic_id;

  BEGIN
    INSERT INTO services (clinic_id, name, fee, duration_minutes)
    VALUES (test_clinic_id, 'Negative fee test', -1.00, 30);
    RAISE EXCEPTION 'Negative fee was unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;
ROLLBACK;
```

### Appointment overlap behavior

The following complete rollback-only check creates isolated fixtures and raises an error if any expected constraint does not reject the write. It tests doctor overlap, patient overlap across doctors, cancellation releasing a slot, and doctor/service clinic consistency. Run only on a development database:

```sql
BEGIN;
DO $$
DECLARE
  suffix TEXT := txid_current()::text;
  clinic_a BIGINT;
  clinic_b BIGINT;
  patient BIGINT;
  doctor_user_a BIGINT;
  doctor_user_b BIGINT;
  doctor_a BIGINT;
  doctor_b BIGINT;
  service_a BIGINT;
  service_b BIGINT;
  appointment_a BIGINT;
  slot_start TIMESTAMPTZ := now() + interval '10 days';
BEGIN
  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ('Test Patient', 'patient-' || suffix || '@example.invalid', 'not-used', 'patient')
  RETURNING id INTO patient;

  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ('Test Doctor A', 'doctor-a-' || suffix || '@example.invalid', 'not-used', 'doctor')
  RETURNING id INTO doctor_user_a;

  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ('Test Doctor B', 'doctor-b-' || suffix || '@example.invalid', 'not-used', 'doctor')
  RETURNING id INTO doctor_user_b;

  INSERT INTO clinics (slug, name, city, address)
  VALUES ('overlap-a-' || suffix, 'Overlap Test A', 'Test City', 'Test Address')
  RETURNING id INTO clinic_a;

  INSERT INTO clinics (slug, name, city, address)
  VALUES ('overlap-b-' || suffix, 'Overlap Test B', 'Test City', 'Test Address')
  RETURNING id INTO clinic_b;

  INSERT INTO doctors (user_id, clinic_id, specialty, license_number)
  VALUES (doctor_user_a, clinic_a, 'Test', 'license-a-' || suffix)
  RETURNING id INTO doctor_a;

  INSERT INTO doctors (user_id, clinic_id, specialty, license_number)
  VALUES (doctor_user_b, clinic_a, 'Test', 'license-b-' || suffix)
  RETURNING id INTO doctor_b;

  INSERT INTO services (clinic_id, name, duration_minutes)
  VALUES (clinic_a, 'Overlap Service A', 30)
  RETURNING id INTO service_a;

  INSERT INTO services (clinic_id, name, duration_minutes)
  VALUES (clinic_b, 'Overlap Service B', 30)
  RETURNING id INTO service_b;

  INSERT INTO doctor_services (doctor_id, service_id, clinic_id)
  VALUES (doctor_a, service_a, clinic_a), (doctor_b, service_a, clinic_a);

  BEGIN
    INSERT INTO doctor_services (doctor_id, service_id, clinic_id)
    VALUES (doctor_a, service_b, clinic_a);
    RAISE EXCEPTION 'Cross-clinic doctor/service assignment was unexpectedly accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  INSERT INTO appointments (patient_id, doctor_id, clinic_id, service_id, starts_at, ends_at, status)
  VALUES (patient, doctor_a, clinic_a, service_a, slot_start, slot_start + interval '30 minutes', 'pending')
  RETURNING id INTO appointment_a;

  BEGIN
    INSERT INTO appointments (patient_id, doctor_id, clinic_id, service_id, starts_at, ends_at, status)
    VALUES (patient, doctor_a, clinic_a, service_a, slot_start + interval '10 minutes', slot_start + interval '40 minutes', 'pending');
    RAISE EXCEPTION 'Doctor overlap was unexpectedly accepted';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;

  UPDATE appointments SET status = 'cancelled' WHERE id = appointment_a;

  INSERT INTO appointments (patient_id, doctor_id, clinic_id, service_id, starts_at, ends_at, status)
  VALUES (patient, doctor_a, clinic_a, service_a, slot_start, slot_start + interval '30 minutes', 'pending');

  BEGIN
    INSERT INTO appointments (patient_id, doctor_id, clinic_id, service_id, starts_at, ends_at, status)
    VALUES (patient, doctor_b, clinic_a, service_a, slot_start, slot_start + interval '30 minutes', 'pending');
    RAISE EXCEPTION 'Patient overlap across doctors was unexpectedly accepted';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;
END;
$$;
ROLLBACK;
```

Expected: `DO` completes without error and `ROLLBACK` runs. The test intervals use `[start,end)`, so adjacent appointments are allowed.

The same exclusion constraints remain authoritative during concurrent booking. The future booking API must execute booking work in a transaction, and treat SQLSTATE `23P01` as a slot conflict; application-side availability checks alone are not sufficient. No booking route exists yet, so transaction handling belongs to the later API implementation.

### Updated-at trigger presence

```sql
SELECT event_object_table AS table_name, trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%_set_updated_at'
ORDER BY event_object_table;
```

Expected: eight triggers for users, clinics, clinic_members, doctors, services, working_hours, time_off, and appointments.

## Common Errors

- `psql is not recognized`: install PostgreSQL command-line tools or add PostgreSQL's `bin` directory to the current CMD `PATH`.
- Connection refused / timeout: start the PostgreSQL service, confirm host and port, then retry the connectivity query.
- Password authentication failed: use the correct local PostgreSQL role password. Do not put it in a command argument; `-W` prompts for it.
- `database ... does not exist`: run the conditional create step, then retry. Check the database spelling; unquoted PostgreSQL names are lowercase.
- `permission denied to create extension`: ask the database owner/administrator to install `btree_gist` in this database, then rerun after confirming transaction rollback.
- Duplicate key, invalid existing rows, or an existing incompatible table: stop and inspect the existing data and schema. Back up the database, prepare a reviewed forward migration, and never drop tables as a shortcut.
- `DATABASE_URL` missing or backend connection fails: verify `server/.env` exists, uses the database that was created, has URL-encoded special password characters, and is readable by the Node process. Never log the full URL.

## Completion Checklist

- [ ] PostgreSQL 12+ is reachable and `ethioCare_db` exists.
- [ ] `btree_gist` is enabled and all 11 tables, constraints, indexes, and eight update triggers verify successfully.
- [ ] Role, fee, duration, clinic consistency, and appointment overlap behavior have been checked.
- [ ] Cancelled/rejected appointments release their time range.
- [ ] `server/.env` contains a local `DATABASE_URL`, remains untracked, and the backend pool connection check succeeds.
- [ ] Existing JWT configuration and other Step 1 behavior remain intact.
- [ ] Any existing database differences have a reviewed, non-destructive migration plan.

## Implementation Verification Status

The workspace had no existing SQL files and no `psql` executable was available during implementation. The JavaScript database module passed `node --check`. No database was created or modified, and PostgreSQL DDL, extension installation, live constraint behavior, and backend connectivity have not been executed in this environment. Complete the CMD or pgAdmin steps above to satisfy the database-dependent completion criteria.