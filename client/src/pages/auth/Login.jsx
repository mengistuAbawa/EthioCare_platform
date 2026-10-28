import { useState } from "react";
import { Eye, EyeOff, HeartPulse, LockKeyhole, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleRoutes = {
  system_admin: "/admin/dashboard",
  clinic_admin: "/clinic/dashboard",
  doctor: "/doctor/dashboard",
  receptionist: "/reception/dashboard",
  patient: "/patient/dashboard",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.password) nextErrors.password = "Password is required.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await login(form.email, form.password);
      const nextRoute = roleRoutes[response.data.user.role] || "/patient/dashboard";
      const from = location.state?.from || nextRoute;
      navigate(from, { replace: true });
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          "Unable to sign in. Please check your email and password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-teal-50 via-white to-cyan-50 px-4 py-12">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-teal-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <HeartPulse className="h-8 w-8" />
              <span className="text-2xl font-bold">EthioCare</span>
            </div>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              Secure access to your healthcare workspace.
            </h1>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-teal-100">Trusted care coordination</p>
            <p className="mt-3 text-base text-teal-50/90">
              Manage appointments, clinic operations, and patient schedules in one dependable system.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
              </div>

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
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-3.5 text-slate-500 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}
              </div>

              {errors.general && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errors.general}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-500"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              New to EthioCare?{" "}
              <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
                Create a patient account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
