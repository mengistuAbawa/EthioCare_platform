# Public website and account workflows

## Public website

The public website is available at `/` without authentication. Its responsive navigation links to `/about`, `/how-it-works`, `/services`, `/for-patients`, `/for-doctors`, `/for-clinics`, `/help`, and `/contact`. Public clinic discovery remains available at `/clinics`. Signed-in users see a shortcut to the dashboard associated with their server-issued role.

Website copy describes only supported functionality and identifies unavailable workflows. No support address, phone number, privacy policy, terms of use, regulatory certification, or security guarantee is fabricated.

## Existing account behavior

- `/register` is public self-registration for patient accounts. The backend assigns the patient role and hashes the password; privileged requested roles are rejected.
- Registration responds with a generic message and status for both newly created and already-registered email addresses to avoid disclosing account existence. The user can try signing in afterward.
- `/login` redirects to the dashboard for the authenticated role. An intended destination is retained only when it belongs to that role (or is the shared account profile).
- Doctor and receptionist accounts are not created via public registration.
- System administrator accounts are not created via public registration.
- Clinic creation through `POST /api/clinics` now requires an authenticated `clinic_admin`; it no longer promotes another account role. New clinics remain pending System Admin review and cannot use operational clinic management APIs before verification.

## Workflows not configured

The current application has no email/SMS delivery integration or expiring invitation/password-reset token model. It therefore does not offer invitation acceptance, verification delivery, forgot-password/reset-password, or public clinic applications. The public website explains these limits rather than exposing unusable forms. The existing clinic-admin workflow can submit a clinic for review; System Admin review is handled through the existing administration APIs.

There is no documented secure first-System-Admin bootstrap procedure in the existing application. Production deployment must provision that account through an approved trusted administrative process; no default credentials or public bootstrap endpoint were added.

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
