import { useCallback, useEffect, useRef, useState } from "react";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, Card, PageHeader } from "../../components/ui/Primitives";
import {
  getAdminPlatformSettings,
  updateAdminPlatformSettings,
} from "../../services/systemAdminService";

const initialSettings = {
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

const controlClass = "ui-control w-full";
const normalizeSettings = (value = {}) => Object.fromEntries(
  Object.keys(initialSettings).map((key) => [
    key,
    value[key] ?? initialSettings[key],
  ])
);

function SettingToggle({ name, label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-teal-700"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
      </span>
    </label>
  );
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const initialMaintenanceMode = useRef(false);

  const loadSettings = useCallback(async () => {
    try {
      const response = await getAdminPlatformSettings();
      const loadedSettings = normalizeSettings(response.data?.data?.settings);
      initialMaintenanceMode.current = loadedSettings.maintenance_mode;
      setSettings(loadedSettings);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load platform settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
  }, [loadSettings]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (settings.maintenance_mode && !initialMaintenanceMode.current &&
        !window.confirm("Enable maintenance mode? Non-admin users will be unable to make changes.")) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await updateAdminPlatformSettings(settings);
      const savedSettings = normalizeSettings(response.data?.data?.settings);
      initialMaintenanceMode.current = savedSettings.maintenance_mode;
      setSettings(savedSettings);
      setNotice("Platform settings saved.");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Unable to save platform settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        description="Configure platform information, patient registration, clinic review, appointment rules, notifications, and maintenance mode."
        className="mb-5"
      />
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); void loadSettings(); }} />}
      {notice && <p role="status" className="rounded-xl border border-success/20 bg-[var(--color-success-surface)] p-4 text-sm text-success">{notice}</p>}
      {loading ? <LoadingState label="Loading system settings..." /> : !error && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card as="section">
            <h2 className="text-lg font-semibold text-slate-950">Platform information</h2>
            <p className="mt-1 text-sm text-slate-600">Support contacts are informational; this application does not send email or SMS.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Platform name
                <input name="platform_name" required minLength={2} maxLength={120} value={settings.platform_name} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Contact email
                <input name="contact_email" type="email" maxLength={254} value={settings.contact_email || ""} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Contact phone
                <input name="contact_phone" type="tel" minLength={7} maxLength={30} value={settings.contact_phone || ""} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
            </div>
          </Card>

          <Card as="section">
            <h2 className="text-lg font-semibold text-slate-950">Registration and clinic review</h2>
            <div className="mt-4 grid gap-3">
              <SettingToggle
                name="patient_registration_enabled"
                label="Allow patient self-registration"
                description="When off, new patient account registration is rejected by the server."
                checked={settings.patient_registration_enabled}
                onChange={updateField}
              />
              <SettingToggle
                name="clinic_approval_required"
                label="Require System Admin approval for clinics"
                description="When on, newly submitted clinics remain pending and are hidden from public discovery until reviewed."
                checked={settings.clinic_approval_required}
                onChange={updateField}
              />
            </div>
          </Card>

          <Card as="section">
            <h2 className="text-lg font-semibold text-slate-950">Appointment rules</h2>
            <p className="mt-1 text-sm text-slate-600">These limits are enforced on the server for clinic appointment creation.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Maximum days ahead
                <input name="max_booking_days" type="number" min={1} max={365} required value={settings.max_booking_days} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Minimum booking lead time (hours)
                <input name="min_booking_lead_hours" type="number" min={0} max={720} required value={settings.min_booking_lead_hours} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Cancellation cutoff (hours)
                <input name="cancellation_cutoff_hours" type="number" min={0} max={720} required value={settings.cancellation_cutoff_hours} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
            </div>
          </Card>

          <Card as="section">
            <h2 className="text-lg font-semibold text-slate-950">In-app notifications</h2>
            <p className="mt-1 text-sm text-slate-600">Controls apply to new notifications only. Email and SMS delivery are not configured.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SettingToggle
                name="notify_appointment_enabled"
                label="Appointment notifications"
                description="Store new appointment-related in-app notifications."
                checked={settings.notify_appointment_enabled}
                onChange={updateField}
              />
              <SettingToggle
                name="notify_general_enabled"
                label="General notifications"
                description="Store assessment and other general in-app notifications."
                checked={settings.notify_general_enabled}
                onChange={updateField}
              />
            </div>
          </Card>

          <Card as="section">
            <h2 className="text-lg font-semibold text-slate-950">Maintenance mode</h2>
            <p className="mt-1 text-sm text-slate-600">Sign-in and read-only access remain available. Non-admin write actions are blocked; System Admins retain access to disable maintenance mode.</p>
            <div className="mt-4 space-y-3">
              <SettingToggle
                name="maintenance_mode"
                label="Enable maintenance mode"
                description="Temporarily prevent non-admin users from changing application data."
                checked={settings.maintenance_mode}
                onChange={updateField}
              />
              <label className="block text-sm font-medium text-slate-700">
                Maintenance notice
                <textarea name="maintenance_message" required minLength={5} maxLength={500} rows={3} value={settings.maintenance_message} onChange={updateField} className={`${controlClass} mt-1`} />
              </label>
            </div>
          </Card>

          <Button type="submit" loading={saving}>
            {saving ? "Saving settings..." : "Save system settings"}
          </Button>
        </form>
      )}
    </div>
  );
}
