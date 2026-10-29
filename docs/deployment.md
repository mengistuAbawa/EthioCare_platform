# Deployment setup

This repository is configured for a Render Express API and a Vercel Vite/React frontend. The checked-in files configure build/routing only; this procedure does not create services, databases, buckets, credentials, or deploy automatically until the services are connected to the repository.

## Before deploying

- Use separate non-production and production databases.
- Back up and inspect an existing database; never drop it to make migrations apply.
- Apply `database/schema.sql` to a new database first, then apply all applicable additive migrations in dependency order. For an existing installation, compare its schema and migration history before running any migration.
- Apply `database/migrations/add_patient_health_assessments.sql` before `database/migrations/add_clinical_review_and_treatment_plans.sql`.
- Validate every migration against a disposable PostgreSQL database and test rollback/recovery before production. No automated migration runner is configured.
- The database/schema setup has no supported public first-system-admin bootstrap. Provision initial privileged access only through an approved trusted administrative procedure; never seed default credentials.
- Keep medical document storage in a private, encrypted S3-compatible bucket. Use a host-managed identity or secret store for storage credentials.
- AI/OCR, antivirus scanning, medication interaction checking, prescription issuance, identity verification, and electronic clinical signatures are not configured. Do not describe this deployment as a validated clinical decision-support system.

## Render API

`render.yaml` defines a **free-tier staging** web service, rooted at `server/`, with `npm ci`, `npm start`, and `/api/health` health checks. Free instances can sleep and are not suitable for production or clinical availability.

1. Create/connect a Render Blueprint to this GitHub repository and select the `main` branch.
2. Supply the `sync: false` variables in Render's environment settings:
   - `DATABASE_URL` — the intended PostgreSQL connection URL.
   - `JWT_SECRET` — independently generated, high-entropy secret; do not reuse development or other application secrets.
   - `CLIENT_URL` — exact HTTPS origin of the Vercel production frontend, with no trailing path.
   - `S3_BUCKET` and `S3_REGION` — private bucket configuration. Set `S3_ENDPOINT` only for an S3-compatible custom endpoint.
3. Add storage credentials using Render's secret environment-variable facility or an identity-based credential provider. Do not add them to the client or source control. The server SDK uses its standard AWS credential provider chain.
4. Confirm Render's `/api/health` reports success. The endpoint performs a database readiness query and reports `503` if PostgreSQL is unavailable.
5. For production, create a separately reviewed service using an appropriate paid plan, availability, backups, network controls, log policy, and data-processing terms. Do not promote the free staging service or database with production health data.

## Vercel frontend

`client/vercel.json` sends browser routes to `index.html` so React Router routes continue to work after refresh.

1. Import the same repository into Vercel and set **Root Directory** to `client`.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Set `VITE_API_URL` to the Render API origin ending in `/api`, for example `https://your-service.onrender.com/api`.
4. Redeploy after setting environment variables. `VITE_*` values are public browser configuration; never put credentials in them.
5. Set Render's `CLIENT_URL` to the deployed Vercel origin. If using preview deployments, configure an explicit approved preview origin instead of broad wildcard CORS.

## Post-deployment verification

Run these checks against staging before any production change:

1. Open `https://<render-host>/api/health`; verify a successful response and database connectivity.
2. Open the Vercel site, refresh direct routes (including patient and doctor routes), and verify the frontend can call the Render API.
3. Verify registration/login, expected role routing, and unauthenticated API requests.
4. With designated test patient and doctor accounts, verify assessment ownership, doctor assignment boundaries, draft save/resume, submission, review versions, lab-value history, treatment-plan approval, and patient-only release of approved plans.
5. Verify private S3 uploads/downloads and permission denial for unrelated users. Do not use a public bucket.
6. Confirm notification text is generic and contains no clinical details; AI/OCR show `not_configured`.
7. Review service logs, database backups and restore, HTTPS/CORS, session/JWT policy, retention/deletion, and incident response.

No live Render or Vercel deployment was performed by this repository setup.
