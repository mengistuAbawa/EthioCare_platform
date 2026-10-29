import { Building2, PlusCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";

const emptyForm = {
  slug: "",
  name: "",
  contact_email: "",
  contact_phone: "",
  city: "",
  region: "",
  address: "",
};

export default function ClinicAdminDashboard() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchClinics = useCallback(async () => {
    const response = await api.get("/clinics/my/clinics");
    return response.data?.data?.clinics || [];
  }, []);

  useEffect(() => {
    let active = true;
    fetchClinics()
      .then((nextClinics) => {
        if (active) setClinics(nextClinics);
      })
      .catch((error) => {
        if (active) {
          setMessage({
            type: "error",
            text: error.response?.data?.message || "Unable to load your clinics.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchClinics]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/clinics", form);
      setForm(emptyForm);
      try {
        const nextClinics = await fetchClinics();
        setClinics(nextClinics);
        setMessage({
          type: "success",
          text: "Clinic registration submitted successfully and is pending verification.",
        });
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Clinic registered, but your clinic list could not be refreshed.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to register the clinic.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Building2 size={22} />
            </div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{user?.full_name || "Clinic Admin"}</h2>
            <p className="mt-1 text-sm text-slate-500">Role: {user?.role}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-sky-100 p-3 text-sky-700">
              <PlusCircle size={22} />
            </div>
            <p className="text-sm text-slate-500">Registered clinics</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{clinics.length}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
              <ShieldCheck size={22} />
            </div>
            <p className="text-sm text-slate-500">Verification status</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {clinics.some((clinic) => clinic.verification_status === "verified") ? "Verified" : "Pending review"}
            </h2>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section id="your-clinics" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Your clinics</h2>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Loading clinics...</p>
            ) : clinics.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No clinics yet. Add your first clinic record below.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{clinic.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{clinic.city}{clinic.region ? `, ${clinic.region}` : ""}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {clinic.verification_status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{clinic.address}</p>
                    <Link
                      to={`/clinic/${clinic.id}/doctors`}
                      className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                    >
                      Manage doctors
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="register-clinic" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Register clinic</h2>
            <p className="mt-1 text-sm text-slate-500">Submit a clinic profile for verification review.</p>

            {message.text ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="clinic-slug"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Clinic name"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <input
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="Region (optional)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="Contact email"
                  type="email"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  placeholder="Contact phone"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Clinic address"
                rows={4}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-500"
              >
                {submitting ? "Submitting..." : "Submit clinic for review"}
              </button>
            </form>
          </section>
        </div>
    </div>
  );
}
