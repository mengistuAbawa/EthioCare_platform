BEGIN;

CREATE TABLE IF NOT EXISTS platform_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'EthioCare'
    CHECK (length(trim(platform_name)) BETWEEN 2 AND 120),
  contact_email TEXT,
  contact_phone TEXT,
  patient_registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  clinic_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  max_booking_days INTEGER NOT NULL DEFAULT 2 CHECK (max_booking_days BETWEEN 1 AND 365),
  min_booking_lead_hours INTEGER NOT NULL DEFAULT 2 CHECK (min_booking_lead_hours BETWEEN 0 AND 720),
  cancellation_cutoff_hours INTEGER NOT NULL DEFAULT 24 CHECK (cancellation_cutoff_hours BETWEEN 0 AND 720),
  notify_appointment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_general_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT NOT NULL DEFAULT 'EthioCare is temporarily unavailable for maintenance. Please try again later.'
    CHECK (length(trim(maintenance_message)) BETWEEN 5 AND 500),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
