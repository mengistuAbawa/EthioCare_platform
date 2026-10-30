const pool = require("../config/db");
const {
  getPlatformSettings,
  invalidatePlatformSettings,
} = require("../services/platformSettingsService");

const getPublicSettings = async (req, res) => {
  try {
    const settings = await getPlatformSettings();
    return res.json({
      success: true,
      data: {
        platform_name: settings.platform_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        patient_registration_enabled: settings.patient_registration_enabled,
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
      },
    });
  } catch (error) {
    console.error("Public platform settings error:", error.message);
    return res.status(503).json({
      success: false,
      message: "Platform settings are temporarily unavailable.",
    });
  }
};

const getAdminSettings = async (req, res) => {
  try {
    const settings = await getPlatformSettings({ refresh: true });
    return res.json({ success: true, data: { settings } });
  } catch (error) {
    console.error("Load platform settings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load platform settings.",
    });
  }
};

const updateAdminSettings = async (req, res) => {
  const settings = req.body;
  const stringFields = ["platform_name", "contact_email", "contact_phone", "maintenance_message"];
  const booleanFields = [
    "patient_registration_enabled",
    "clinic_approval_required",
    "notify_appointment_enabled",
    "notify_general_enabled",
    "maintenance_mode",
  ];
  const integerFields = ["max_booking_days", "min_booking_lead_hours", "cancellation_cutoff_hours"];
  const allowedFields = new Set([...stringFields, ...booleanFields, ...integerFields]);

  if (!settings || typeof settings !== "object" || Array.isArray(settings) ||
      Object.keys(settings).length !== allowedFields.size ||
      Object.keys(settings).some((field) => !allowedFields.has(field))) {
    return res.status(400).json({
      success: false,
      message: "Provide all supported platform settings and no additional fields.",
    });
  }

  if (typeof settings.platform_name !== "string" ||
      settings.platform_name.trim().length < 2 ||
      settings.platform_name.trim().length > 120 ||
      (settings.contact_email !== "" &&
        (typeof settings.contact_email !== "string" || settings.contact_email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email))) ||
      typeof settings.contact_phone !== "string" || settings.contact_phone.length > 30 ||
      (settings.contact_phone && settings.contact_phone.length < 7) ||
      typeof settings.maintenance_message !== "string" ||
      settings.maintenance_message.trim().length < 5 ||
      settings.maintenance_message.trim().length > 500 ||
      booleanFields.some((field) => typeof settings[field] !== "boolean") ||
      integerFields.some((field) => !Number.isInteger(settings[field]))) {
    return res.status(400).json({
      success: false,
      message: "One or more platform settings are invalid.",
    });
  }

  if (settings.max_booking_days < 1 || settings.max_booking_days > 365 ||
      settings.min_booking_lead_hours < 0 || settings.min_booking_lead_hours > 720 ||
      settings.cancellation_cutoff_hours < 0 || settings.cancellation_cutoff_hours > 720) {
    return res.status(400).json({
      success: false,
      message: "Booking limits must be within their supported ranges.",
    });
  }

  const values = [
    settings.platform_name.trim(),
    settings.contact_email.trim().toLowerCase() || null,
    settings.contact_phone.trim() || null,
    settings.patient_registration_enabled,
    settings.clinic_approval_required,
    settings.max_booking_days,
    settings.min_booking_lead_hours,
    settings.cancellation_cutoff_hours,
    settings.notify_appointment_enabled,
    settings.notify_general_enabled,
    settings.maintenance_mode,
    settings.maintenance_message.trim(),
  ];

  try {
    const result = await pool.query(
      `UPDATE platform_settings
          SET platform_name = $1,
              contact_email = $2,
              contact_phone = $3,
              patient_registration_enabled = $4,
              clinic_approval_required = $5,
              max_booking_days = $6,
              min_booking_lead_hours = $7,
              cancellation_cutoff_hours = $8,
              notify_appointment_enabled = $9,
              notify_general_enabled = $10,
              maintenance_mode = $11,
              maintenance_message = $12,
              updated_at = now()
        WHERE id = 1
        RETURNING platform_name, contact_email, contact_phone,
                  patient_registration_enabled, clinic_approval_required,
                  max_booking_days, min_booking_lead_hours, cancellation_cutoff_hours,
                  notify_appointment_enabled, notify_general_enabled,
                  maintenance_mode, maintenance_message, updated_at`,
      values
    );

    if (!result.rowCount) {
      return res.status(500).json({
        success: false,
        message: "Platform settings have not been initialized.",
      });
    }

    invalidatePlatformSettings();
    try {
      await pool.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1, 'platform_settings_updated', 'platform_settings', '1', $2::jsonb)`,
        [req.user.id, JSON.stringify({ maintenance_mode: settings.maintenance_mode })]
      );
    } catch (error) {
      console.error("Platform settings audit log write failed:", error.message);
    }
    return res.json({
      success: true,
      message: "Platform settings saved.",
      data: { settings: result.rows[0] },
    });
  } catch (error) {
    console.error("Update platform settings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save platform settings.",
    });
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
};
