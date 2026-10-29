# EthioCare

EthioCare is a clinic discovery, appointment, patient assessment, and clinic-operations platform built with React/Vite, Express, and PostgreSQL.

## Repository

- `client/` — React 19, Vite, Tailwind CSS, and React Router
- `server/` — Express 5 API, JWT authentication, RBAC, and PostgreSQL access
- `database/` — schema, migrations, and optional development seeds
- `docs/` — feature and deployment documentation

## Local development

Prerequisites: Node.js 20.19+ (or 22.12+), npm, and PostgreSQL 12+ with `btree_gist` enabled.

1. Configure the database by following [database setup](./database/README.md).
2. Copy `server/.env.example` to `server/.env`, set the database connection and a long random `JWT_SECRET`, and configure a private S3-compatible bucket if testing medical-file uploads.
3. In one terminal:

   ```cmd
   cd /d "D:\Mobile Appliction Development\EthioCare\server"
   npm ci
   npm run dev
   ```

4. In a second terminal:

   ```cmd
   cd /d "D:\Mobile Appliction Development\EthioCare\client"
   npm ci
   npm run dev
   ```

The client runs at `http://localhost:5173`, the API at `http://localhost:5000`, and the database readiness endpoint at `http://localhost:5000/api/health`.

## Validate

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\server"
npm test
```

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\client"
npm run lint
npm run build
```

## Deploy

Deployment configuration targets a Render Node web service and Vercel static frontend:

- Render Blueprint: [`render.yaml`](./render.yaml)
- Vercel SPA routing: [`client/vercel.json`](./client/vercel.json)
- Deployment and production-readiness checklist: [docs/deployment.md](./docs/deployment.md)

The deployment configuration does not create a database, storage bucket, credentials, or initial system administrator. Apply and verify migrations explicitly before deploying. Do not use the free Render plan for production clinical data.

AI and OCR are intentionally `not_configured`; the application does not send health information to external analysis services or generate diagnostic results.

## Security and privacy

Never commit `.env` files, API keys, database URLs, or storage credentials. Use the hosting provider's secret environment-variable manager. Do not use real patient information until privacy, clinical, legal, security, retention, backup, and operational requirements have been independently reviewed and approved.
