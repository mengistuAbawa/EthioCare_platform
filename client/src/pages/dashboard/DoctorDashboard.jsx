import { CalendarClock, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DoctorDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Doctor</p>
            <h1 className="text-2xl font-bold text-slate-900">Doctor dashboard</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
            <CalendarClock size={24} />
          </div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{user?.full_name || "Doctor"}</h2>
          <p className="mt-1 text-sm text-slate-500">Role: {user?.role}</p>
          <Link to="/doctor/profile" className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Manage professional profile
          </Link>
        </div>
      </div>
    </main>
  );
}
