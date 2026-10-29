# Patient Health Assessments

The assessment workflow lets an authenticated patient save and resume a multi-step draft; report symptom onset, duration, frequency, severity, trend, medical history, medication, allergies, and safety-screen responses; enter optional laboratory values; and upload up to five medical files to one selected, active, verified doctor. A checked urgent warning sign immediately displays emergency guidance and does not rely on an AI response.

Doctors can read only records assigned to their own active, approved doctor profile at a verified clinic. Patients can read only their own records. Drafts are hidden from the assigned doctor until submission. Clinician review notes are saved as append-only versions. Lab corrections are recorded separately from the original patient-entered values. Doctors can draft a care plan, then explicitly approve it before it is released to the patient; prior approved plans are retained as superseded versions.

The feature is clinician review support, not an automated diagnostic tool. AI and OCR report `not_configured`; the application does not send assessment data to either kind of provider. No medical AI credentials are required or used. Medication allergy/interaction checking, structured prescription issuance, follow-up appointment booking from a plan, antivirus scanning, email/SMS delivery, and clinical sign-off are not implemented. Medication instructions in a care plan are clinician-authored text only, not a prescription workflow. Assessment history filtering currently supports date and review status; category and additional-information workflows are not modeled.

## Database

Apply the migrations in order to the configured PostgreSQL database after inspecting and backing up any non-empty database:

```powershell
psql -U postgres -h localhost -p 5432 -d ethioCare_db -W -v ON_ERROR_STOP=1 -f database\migrations\add_patient_health_assessments.sql
psql -U postgres -h localhost -p 5432 -d ethioCare_db -W -v ON_ERROR_STOP=1 -f database\migrations\add_clinical_review_and_treatment_plans.sql
```

The first migration creates `patient_health_assessments`, `assessment_files`, and `assessment_processing_jobs`. The second is additive and creates versioned clinician review, lab review, and treatment-plan records and adds symptom fields. Neither migration drops existing clinical data. Do not run these commands against production until the SQL has been reviewed, a backup is verified, and a maintenance procedure is approved.

## S3-Compatible Private Storage

Set these backend variables in `server/.env`:

- `S3_BUCKET`: private bucket name
- `S3_REGION`: region required by the S3-compatible service
- `S3_ENDPOINT`: optional custom endpoint; leave empty for AWS S3

The AWS SDK uses its normal credential provider chain (for example, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or an attached workload role). Do not commit credentials. Configure the bucket for private access and review its retention, backup, access logging, and encryption policies before production use.

Files are uploaded through the authenticated API, held in memory only up to 8 MB, checked against their supported file signatures, and stored using server-generated object keys. Downloads use short-lived signed URLs after the API verifies assessment access. A compatible S3 service must support `PutObject`, `GetObject`, `DeleteObject`, and AES-256 server-side encryption.

S3 settings are intentionally blank in `.env.example`. Assessment text can be submitted without files; a file upload returns a configuration error until storage is configured.

## Local Verification

From `server/`, run the API, tests, and use patient/doctor accounts already associated with active, approved doctor profiles:

```powershell
npm test
npm run dev
```

Patient routes are under `/patient/assessment/new` and `/patient/assessments`. Doctors can open `/doctor/assessments`. The backend endpoints are under `/api/assessments`.

The optional `npm run worker:assessments` command processes pending OCR/AI jobs. Both providers currently return `not_configured` without contacting external services.

## Assessment API access

- `POST /api/assessments` — patient creates a draft.
- `PUT /api/assessments/:assessmentId` — owning patient updates their draft.
- `GET /api/assessments` and `GET /api/assessments/:assessmentId` — patient-owned history/details; doctors can only open assigned assessments.
- `PATCH /api/assessments/:assessmentId/submit` — owning patient submits a draft.
- `POST /api/assessments/:assessmentId/files` and `GET /api/assessments/:assessmentId/files/:fileId/download` — upload/retrieve through patient/assigned-doctor authorization.
- `PATCH /api/assessments/:assessmentId/review` — assigned doctor adds a versioned clinician-authored review.
- `POST /api/assessments/:assessmentId/lab-results/:labIndex/reviews` — assigned doctor verifies or corrects a patient-entered result; original values remain stored.
- `POST /api/assessments/:assessmentId/treatment-plans` and `PATCH /api/assessments/:assessmentId/treatment-plans/:planId` — assigned doctor saves/updates a draft.
- `POST /api/assessments/:assessmentId/treatment-plans/:planId/approve` — assigned doctor approves and releases a plan.
- `GET /api/assessments/:assessmentId/treatment-plan` — owning patient receives only the currently approved plan.

Submission, clinician review, and plan approval create in-app notifications without diagnoses, symptoms, lab values, or medication details in the notification text. No external email/SMS provider is configured.

## Render and Vercel deployment

1. Apply the two SQL migrations to the intended PostgreSQL database in order, following the backup/approval precautions above.
2. In Render, configure the existing backend service with `DATABASE_URL`, a strong private `JWT_SECRET`, `CLIENT_URL` set to the deployed Vercel origin, and the private S3 settings `S3_BUCKET` and `S3_REGION` (plus `S3_ENDPOINT` when using a compatible non-AWS provider). Configure storage credentials using Render's secret environment support or a workload identity; never expose them to Vite.
3. In Vercel, set `VITE_API_URL` to the deployed Render API base ending in `/api`. This variable is public by design and must not contain credentials.
4. Deploy the backend and frontend, then verify `/api/health`, patient/doctor login, authorization boundaries, private upload/download, notifications, and the doctor approval-to-patient release flow in a non-production environment first.
5. Require HTTPS, private bucket access, appropriate encryption, retention, backup/recovery, and operational review before using real patient records. The current backend does not provide malware scanning or a clinical audit of deployment controls.
