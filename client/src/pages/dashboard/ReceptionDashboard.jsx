import { CalendarCheck2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/clinics/my/clinics")
      .then((response) => setClinics(response.data?.data?.clinics || []))
      .catch((loadError) => setError(loadError.response?.data?.message || "Unable to load your clinics."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Reception</p>
            <h1 className="text-2xl font-bold text-slate-900">Reception dashboard</h1>
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
          <div className="mb-5 inline-flex rounded-xl bg-cyan-100 p-3 text-cyan-700">
            <CalendarCheck2 size={24} />
          </div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{user?.full_name || "Receptionist"}</h2>
          <p className="mt-1 text-sm text-slate-500">Role: {user?.role}</p>
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Doctors at your clinics</h2>
          {error ? <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p> : null}
          <div className="mt-4 space-y-3">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{clinic.name} · {clinic.city}</p>
                <Link to={`/clinic/${clinic.id}/doctors`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">
                  View clinic doctors
                </Link>
              </div>
            ))}
            {!error && clinics.length === 0 ? <p className="text-sm text-slate-600">No clinic memberships are available.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
