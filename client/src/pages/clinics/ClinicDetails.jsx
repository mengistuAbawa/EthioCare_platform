import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

export default function ClinicDetails() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClinic = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/clinics/${id}`);
        setClinic(response.data?.data?.clinic || null);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load the clinic.");
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading clinic details...
      </main>
    );
  }

  if (error || !clinic) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          <p className="font-semibold">Clinic not found</p>
          <p className="mt-2">{error || "This clinic is not available for public viewing."}</p>
          <Link to="/clinics" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
            <ArrowLeft size={16} /> Back to clinics
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Link to="/clinics" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ArrowLeft size={16} /> Back to clinics
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Building2 size={28} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Verified clinic</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{clinic.name}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} />
                  <span>
                    {clinic.city}{clinic.region ? `, ${clinic.region}` : ""}
                  </span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={16} /> Verified
            </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section>
              <h2 className="text-xl font-bold text-slate-900">About this clinic</h2>
              <p className="mt-4 text-slate-600">{clinic.address}</p>

              {clinic.contact_email || clinic.contact_phone ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Contact</h3>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {clinic.contact_email ? <p>Email: {clinic.contact_email}</p> : null}
                    {clinic.contact_phone ? <p>Phone: {clinic.contact_phone}</p> : null}
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Clinic services</h3>
              <div className="mt-4 space-y-3">
                {Array.isArray(clinic.services) && clinic.services.length > 0 ? (
                  clinic.services.map((service) => (
                    <div key={service.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-800">{service.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{service.duration_minutes} minutes</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No public services listed yet.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
