const pool = require("../config/db");

const DEFAULT_SETTINGS = {
  platform_name: "EthioCare",
  contact_email: "",
  contact_phone: "",
  patient_registration_enabled: true,
  clinic_approval_required: true,
  max_booking_days: 2,
  min_booking_lead_hours: 2,
  cancellation_cutoff_hours: 24,
  notify_appointment_enabled: true,
  notify_general_enabled: true,
  maintenance_mode: false,
  maintenance_message: "EthioCare is temporarily unavailable for maintenance. Please try again later.",
};

let cachedSettings;
let cachedAt = 0;
const CACHE_DURATION_MS = 5000;

const getPlatformSettings = async ({ refresh = false } = {}) => {
  if (!refresh && cachedSettings && Date.now() - cachedAt < CACHE_DURATION_MS) {
    return cachedSettings;
  }

  const result = await pool.query(
    `SELECT platform_name, contact_email, contact_phone,
            patient_registration_enabled, clinic_approval_required,
            max_booking_days, min_booking_lead_hours, cancellation_cutoff_hours,
            notify_appointment_enabled, notify_general_enabled,
            maintenance_mode, maintenance_message
       FROM platform_settings
      WHERE id = 1`
  );

  if (!result.rowCount) {
    throw new Error("Platform settings have not been initialized.");
  }

  cachedSettings = result.rows[0];
  cachedAt = Date.now();
  return cachedSettings;
};

const invalidatePlatformSettings = () => {
  cachedSettings = undefined;
  cachedAt = 0;
};

module.exports = {
  DEFAULT_SETTINGS,
  getPlatformSettings,
  invalidatePlatformSettings,
};
