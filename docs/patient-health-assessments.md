# Patient Health Assessments

The assessment workflow lets an authenticated patient submit symptom and history information, optional lab values, and up to five medical files to one selected, active, verified doctor. Doctors can read only records assigned to their own doctor profile. Patients can read only their own records. Drafts are hidden from the assigned doctor until submission.

The feature is clinician review support, not an automated diagnostic tool. OCR and AI summaries are disabled; the application does not send assessment data to either kind of provider.

## Database

Apply the additive migration to the configured PostgreSQL database after inspecting and backing up any non-empty database:

```powershell
psql -U postgres -h localhost -p 5432 -d ethioCare_db -W -v ON_ERROR_STOP=1 -f database\migrations\add_patient_health_assessments.sql
```

The migration creates `patient_health_assessments`, `assessment_files`, and `assessment_processing_jobs`. It does not drop existing data.

## S3-Compatible Private Storage

Set these backend variables in `server/.env`:

- `S3_BUCKET`: private bucket name
- `S3_REGION`: region required by the S3-compatible service
- `S3_ENDPOINT`: optional custom endpoint; leave empty for AWS S3

The AWS SDK uses its normal credential provider chain (for example, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or an attached workload role). Do not commit credentials. Configure the bucket for private access and review its retention, backup, access logging, and encryption policies before production use.

Files are uploaded through the authenticated API, held in memory only up to 8 MB, checked against their supported file signatures, and stored using server-generated object keys. Downloads use short-lived signed URLs after the API verifies assessment access. A compatible S3 service must support `PutObject`, `GetObject`, `DeleteObject`, and AES-256 server-side encryption.

S3 settings are intentionally blank in `.env.example`. Assessment text can be submitted without files; a file upload returns a configuration error until storage is configured.

## Local Verification

From `server/`, run the API and use patient/doctor accounts already associated with active, approved doctor profiles:

```powershell
npm run dev
```

Patient routes are under `/patient/assessment/new` and `/patient/assessments`. Doctors can open `/doctor/assessments`. The backend endpoints are under `/api/assessments`.

The optional `npm run worker:assessments` command processes pending OCR/AI jobs. Both providers currently return a disabled status without contacting external services.
