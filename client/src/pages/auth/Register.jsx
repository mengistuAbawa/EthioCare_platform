import { useEffect, useState } from "react";
import { Eye, EyeOff, HeartPulse, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Button, IconButton } from "../../components/ui/Primitives";
import api from "../../services/api";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Register() {
  const { language } = useLanguage();
  const amharic = language === "am";
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [publicSettings, setPublicSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    api.get("/settings")
      .then((response) => setPublicSettings(response.data?.data))
      .catch(() => setSettingsError("Registration availability could not be checked. Please try again later."));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.full_name.trim()) nextErrors.full_name = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.password) nextErrors.password = "Password is required.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSuccess("");
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setSuccess("Registration request processed. Try signing in. If you cannot access your account, contact your platform administrator through an established support channel.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const fieldErrors = Array.isArray(validationErrors)
        ? validationErrors.reduce((result, item) => {
            if (item.field && item.message) {
              result[item.field] = item.message;
            }
            return result;
          }, {})
        : {};
      const message = error.response?.data?.message;

      setErrors({
        ...fieldErrors,
        general:
          message && message !== "Validation failed."
            ? message
            : Object.keys(fieldErrors).length === 0
              ? "Unable to create your patient account right now."
              : "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="fixed right-4 top-4 z-40"><LanguageSwitcher /></div>
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-100 p-2 text-teal-700">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{amharic ? "የታካሚ መለያ ይፍጠሩ" : "Create patient account"}</h1>
              <p className="text-sm text-slate-500">{amharic ? "ይህ ምዝገባ ለታካሚዎች ብቻ ነው።" : "Public registration is for patients only."}</p>
            </div>
          </div>
        </div>

        {settingsError && (
          <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {settingsError}
          </p>
        )}
        {publicSettings?.maintenance_mode && (
          <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {publicSettings.maintenance_message}
          </p>
        )}
        {publicSettings && !publicSettings.patient_registration_enabled && (
          <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Patient registration is currently unavailable. Please try again later.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-700">
              {amharic ? "ሙሉ ስም" : "Full name"} <span className="text-rose-700" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="full_name"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={errors.full_name ? "register-name-error" : undefined}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            {errors.full_name && <p id="register-name-error" className="mt-1 text-sm text-rose-700" role="alert">{errors.full_name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              {amharic ? "ኢሜይል አድራሻ" : "Email address"} <span className="text-rose-700" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            {errors.email && <p id="register-email-error" className="mt-1 text-sm text-rose-700" role="alert">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
              {amharic ? "ስልክ ቁጥር (አማራጭ)" : "Phone number (optional)"}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+2519XXXXXXXX"
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                {amharic ? "የይለፍ ቃል" : "Password"} <span className="text-rose-700" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "register-password-error" : undefined}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <IconButton
                  onClick={() => setShowPassword((value) => !value)}
                  label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </IconButton>
              </div>
              {errors.password && <p id="register-password-error" className="mt-1 text-sm text-rose-700" role="alert">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                {amharic ? "የይለፍ ቃል ያረጋግጡ" : "Confirm password"} <span className="text-rose-700" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <IconButton
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </IconButton>
              </div>
              {errors.confirmPassword && (
                <p id="register-confirm-password-error" className="mt-1 text-sm text-rose-700" role="alert">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.general && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.general}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={Boolean(settingsError || !publicSettings || !publicSettings.patient_registration_enabled || publicSettings.maintenance_mode)}
            className="w-full"
          >
            {loading ? (amharic ? "መለያ በመፍጠር ላይ..." : "Creating account...") : (amharic ? "የታካሚ መለያ ይፍጠሩ" : "Create patient account")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {amharic ? "መለያ አለዎት?" : "Already have an account?"}{" "}
          <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
