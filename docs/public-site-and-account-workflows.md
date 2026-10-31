# Public website and account workflows

## Public website

The public website is available at `/` without authentication. Its responsive navigation links to `/about`, `/how-it-works`, `/services`, `/for-patients`, `/for-doctors`, `/for-clinics`, `/help`, and `/contact`. Public clinic discovery remains available at `/clinics`. Signed-in users see a shortcut to the dashboard associated with their server-issued role.

Website copy describes only supported functionality and identifies unavailable workflows. No support address, phone number, privacy policy, terms of use, regulatory certification, or security guarantee is fabricated.

## Existing account behavior

- `/register` is public self-registration for patient accounts. The backend assigns the patient role and hashes the password; privileged requested roles are rejected.
- Registration responds with a generic message and status for both newly created and already-registered email addresses to avoid disclosing account existence. The user can try signing in afterward.
- `/login` redirects to the dashboard for the authenticated role. An intended destination is retained only when it belongs to that role (or is the shared account profile).
- Doctor and receptionist accounts are not created via public registration.
- System Admins can create doctor and clinic administrator accounts from User Management. Clinic administrator creation requires selecting a clinic and creates the clinic membership; doctor accounts must subsequently be assigned to a verified clinic and given a doctor profile by a clinic administrator.
- System administrator accounts are not created via public registration.
- Clinic creation through `POST /api/clinics` now requires an authenticated `clinic_admin`; it no longer promotes another account role. New clinics remain pending System Admin review and cannot use operational clinic management APIs before verification.
- Authenticated users can edit their own name and phone and change their password by confirming the current password and setting a new password of at least 12 characters. Password changes do not revoke already-issued stateless JWTs.
- System Admins can configure platform name/contact details, patient registration, clinic approval, appointment booking limits, in-app notification categories, and maintenance mode at `/admin/settings`. Defaults limit bookings to two days ahead, require two hours' lead time, and set a 24-hour cancellation cutoff. Maintenance mode keeps login and reads available, blocks non-admin write requests, and allows authenticated System Admins to manage settings.

## Workflows not configured

Patients can browse approved doctor profiles and submit health assessments to a selected doctor for review. A health assessment is the supported way to share a health-related question through the current application; it does not provide live chat or an emergency-care channel.

Appointment booking is not available yet. Although the database contains appointment and schedule tables, the backend has no patient-facing availability or booking API. A booking implementation must validate live slots and clinic policy on the server before confirming a request.

Uploaded medical files are stored within health assessments, not in a separate patient file library. Patients can open an assessment from their assessment history and use the existing ownership-checked download flow for its attached files.

The current application has no email/SMS delivery integration or expiring invitation/password-reset token model. It therefore does not offer invitation acceptance, verification delivery, forgot-password/reset-password, or public clinic applications. The public website explains these limits rather than exposing unusable forms. The existing clinic-admin workflow can submit a clinic for review; System Admin review is handled through the existing administration APIs.

Production deployment provisions the first System Admin through the trusted server-shell bootstrap command documented in `docs/deployment.md`. This creates no public bootstrap endpoint or default credentials.

Existing databases must apply `database/migrations/20261030_platform_settings.sql` before the settings page, registration switch, or appointment rules are used. New databases get the settings table and defaults from `database/schema.sql`.

### Local development/test admin accounts

For local development or automated testing, the server includes an interactive script that creates one System Admin account, one Clinic Admin account, and a pending test clinic with the Clinic Admin assigned to it. It refuses to run unless `NODE_ENV` is `development` or `test`; it does not add an HTTP endpoint or change public registration.

Configure `server/.env` and apply `database/schema.sql` to a new database. For an existing database, apply `database/migrations/20261028_system_admin_clinic_controls.sql` if the clinic status columns are absent, then apply `database/migrations/20261030_platform_settings.sql`. The following PowerShell command, run from the project root, applies a migration using the server's configured database connection; replace the migration path for each required migration:

```powershell
node -e "const fs=require('fs'); const pool=require('./server/src/config/db'); pool.query(fs.readFileSync('database/migrations/20261030_platform_settings.sql','utf8')).then(()=>console.log('Migration applied')).catch(error=>{console.error('Migration failed:',error.message);process.exitCode=1}).finally(()=>pool.end())"
```

Then, from the `server` directory, run:

```cmd
npm run create:test-admins
```

Enter distinct email addresses and passwords of at least 12 characters when prompted. The passwords are typed into the terminal, so use this only in a trusted local development environment. The test clinic is pending verification; sign in as the System Admin to review it. The script creates new rows and exits with an error if either email already exists.

The authentication system uses stateless JWTs and has no server-side revocation list. Logout clears client-side state but cannot revoke a copied JWT before its expiry.

## Validation commands

From Command Prompt:

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare\client"
npx eslint src\pages\public\PublicHome.jsx src\App.jsx src\pages\auth\Login.jsx src\pages\auth\Register.jsx src\config\dashboardNavigation.js src\components\dashboard\Sidebar.jsx
npm run build
```

```cmd
cd /d "D:\Mobile Appliction Development\EthioCare"
node --check server\src\controllers\authController.js
node --check server\src\controllers\clinicController.js
node --check server\src\routes\clinicRoutes.js
node --check server\src\middleware\clinicAccess.js
```

No schema migration is required for the website or the existing patient registration flow.
