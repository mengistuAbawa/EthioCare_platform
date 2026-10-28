import { useState } from "react";
import { Eye, EyeOff, HeartPulse, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
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

      setSuccess("Your patient account was created successfully. You can now sign in.");
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
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-100 p-2 text-teal-700">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create patient account</h1>
              <p className="text-sm text-slate-500">Join EthioCare for secure appointment access</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            {errors.full_name && <p className="mt-1 text-sm text-rose-600">{errors.full_name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
              Phone number (optional)
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+2519XXXXXXXX"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.general}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-500"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
