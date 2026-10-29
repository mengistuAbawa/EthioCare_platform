# Receptionist portal

The receptionist workspace lives under `/receptionist/*` inside the shared protected dashboard layout. `/reception/dashboard` redirects to the new dashboard path for compatibility.

Reception data is served by `/api/receptionist/clinics/:clinicId/*`. Every route requires an authenticated receptionist and an active receptionist membership for that clinic. Appointment lists, counts, patient directory entries, doctor/service catalog data, creation, and status changes are filtered by that clinic on the server.

Available operations:

- View appointment counts and the selected day's schedule.
- List appointments by day; confirm/reject pending appointments and cancel, complete, or mark no-show for confirmed appointments.
- Search active patients who have an appointment history with that clinic.
- Browse active doctors and services.
- Request an appointment for an existing clinic patient. The request is pending until confirmed. The server verifies the patient account, clinic/doctor/service assignment, doctor availability, working hours, time off, and relies on the database overlap constraints to prevent double booking. Creation and its audit/notification records are transactional.

The clinic schema has no timezone column. Appointment booking therefore interprets working hours as `Africa/Addis_Ababa` (EAT); confirm this assumption before using the booking flow for clinics outside that timezone. There is no patient registration credential workflow, receptionist notification inbox, receptionist settings model, or queue/check-in timestamp. Registration, notifications, and settings explain these limitations in the UI. The schedule view is explicitly not a check-in queue. Payments are not exposed.
