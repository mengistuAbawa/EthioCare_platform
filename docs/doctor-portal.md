# Doctor portal

The Doctor Portal is rendered inside the authenticated shared dashboard layout. Every `/doctor/*` page is protected by the existing doctor role guard. The original dashboard, professional profile, and assigned health-assessment review are reused or extended rather than replaced with duplicate workflows.

## Supported data

The new `/api/doctor-portal` endpoints require a valid authenticated JWT and `doctor` role. Each query resolves the active doctor profile from the authenticated user; patient, appointment, schedule, service, and linked-notification queries are restricted to that doctor.

| Endpoint | Purpose |
| --- | --- |
| `GET /dashboard?from=YYYY-MM-DD` | Today's appointments and supported appointment, assessment, and notification counts |
| `GET /appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&status=...` | Appointments assigned to the current doctor |
| `GET /schedule?from=YYYY-MM-DD&to=YYYY-MM-DD` | Published working hours, time off, and assigned appointments; read-only |
| `GET /patients?search=...&page=1&limit=20` | Patients with an appointment assigned to the current doctor |
| `GET /services` | Active service assignments for the doctor's profile |
| `GET /notifications?page=1&limit=20&read=true\|false` | Notifications owned by the doctor, filtered to their appointments when linked |
| `PATCH /notifications/:notificationId/read` | Mark an authorized notification as read |
| `PATCH /notifications/read-all` | Mark authorized notifications as read |

The existing `/api/assessments/doctor/inbox` and assessment review/download endpoints remain the source of assigned health assessments and their securely authorized attachments. The existing `/api/doctors/me/profile` endpoints remain the source of professional profile data.

Appointment and schedule dates are interpreted in `Africa/Addis_Ababa`, consistent with the current database documentation. Clinics do not currently store a time zone. Appointments are displayed read-only in this portal: existing appointment status is not treated as an encounter or consultation workflow.

## Not implemented by the current data model

The application has no encounter/clinical-note, verified laboratory-result, longitudinal medical-record, prescription/care-plan, follow-up, attendance/queue, or LiveKit consultation model. Those pages explicitly explain that the feature is unavailable rather than showing fabricated records. Patient-submitted lab values remain part of the assessment and are not represented as verified results. The application has no doctor-specific persisted preferences.

## Local checks

From Command Prompt:

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\client"
npx eslint src\App.jsx src\config\dashboardNavigation.js src\components\dashboard\Sidebar.jsx src\pages\doctor\DoctorPortalPage.jsx src\services\doctorPortalService.js
npm run build
```

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare"
node --check server\src\controllers\doctorPortalController.js
node --check server\src\routes\doctorPortalRoutes.js
node --check server\src\app.js
```

No database migration is required for these read-only endpoints. The existing health-assessment migration must already be applied for the existing assessment functionality and dashboard assessment count.
