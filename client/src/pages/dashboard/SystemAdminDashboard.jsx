import { LogOut, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function SystemAdminDashboard() {
  const { user, logout } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [doctorStats, setDoctorStats] = useState(null);
  const [doctorAuditEvents, setDoctorAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchClinics = async () => {
    try {
      const response = await api.get("/clinics/admin/pending");
      setClinics(response.data?.data?.clinics || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to load clinic verification queue.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/clinics/admin/pending")
      .then((response) => {
        setClinics(response.data?.data?.clinics || []);
        setMessage({ type: "", text: "" });
      })
      .catch((error) => {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to load clinic verification queue.",
        });
      })
      .finally(() => setLoading(false));
    api.get("/doctors/admin/statistics")
      .then((response) => setDoctorStats(response.data?.data || null))
      .catch((error) => {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to load doctor statistics.",
        });
      });
    api.get("/doctors/admin/audit?limit=8")
      .then((response) => setDoctorAuditEvents(response.data?.data?.events || []))
      .catch((error) => {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to load doctor audit history.",
        });
      });
  }, []);

  const stats = useMemo(() => {
    const summary = {
      pending: 0,
      verified: 0,
      rejected: 0,
    };

    clinics.forEach((clinic) => {
      if (clinic.verification_status === "pending") summary.pending += 1;
      if (clinic.verification_status === "verified") summary.verified += 1;
      if (clinic.verification_status === "rejected") summary.rejected += 1;
    });

    return summary;
  }, [clinics]);

  const handleReview = async (clinicId, decision, reason = "") => {
    setProcessingId(clinicId);
    setMessage({ type: "", text: "" });

    try {
      await api.post(`/clinics/${clinicId}/review`, { decision, reason });
      setMessage({
        type: "success",
        text: `Clinic ${decision} successfully.`,
      });
      fetchClinics();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to update clinic review status.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">System</p>
            <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
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

        {message.text ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-teal-100 p-3 text-teal-700">
              <ShieldCheck size={22} />
            </div>

            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Doctor platform statistics</h2>
              {doctorStats ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Profiles", doctorStats.totals.total],
                    ["Active", doctorStats.totals.active],
                    ["Available", doctorStats.totals.available],
                    ["Awaiting profile review", doctorStats.totals.awaiting_profile_review],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Doctor statistics are unavailable.</p>}
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Recent doctor-management audit events</h2>
              {doctorAuditEvents.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {doctorAuditEvents.map((event) => (
                    <li key={event.id} className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                      <span>
                        <span className="font-semibold text-slate-900">{event.action.replaceAll("_", " ")}</span>
                        <span className="ml-2 text-sm text-slate-600">
                          by {event.actor_name || "Deleted account"} ({event.actor_role || "unknown role"})
                        </span>
                      </span>
                      <time className="text-sm text-slate-500" dateTime={event.created_at}>
                        {new Date(event.created_at).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-slate-500">No doctor-management events recorded.</p>}
            </section>
            <p className="text-sm text-slate-500">Signed in as</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{user?.full_name || "System Admin"}</h2>
            <p className="mt-1 text-sm text-slate-500">{user?.role}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-sky-100 p-3 text-sky-700">
              <Users size={22} />
            </div>
            <p className="text-sm text-slate-500">Pending clinics</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.pending}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <ShieldCheck size={22} />
            </div>
            <p className="text-sm text-slate-500">Verified</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.verified}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-rose-100 p-3 text-rose-700">
              <ShieldCheck size={22} />
            </div>
            <p className="text-sm text-slate-500">Rejected</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{stats.rejected}</h2>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Clinic verification queue</h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading clinic review queue...</p>
          ) : clinics.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              There are no clinics waiting for review.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{clinic.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {clinic.city}{clinic.region ? `, ${clinic.region}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{clinic.address}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                        Status: {clinic.verification_status}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={processingId === clinic.id}
                        onClick={() => handleReview(clinic.id, "verified")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        {processingId === clinic.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === clinic.id}
                        onClick={() => handleReview(clinic.id, "rejected", "Incomplete or invalid clinic profile.")}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
