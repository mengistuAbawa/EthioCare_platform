import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Card, StatusBadge } from "../../components/ui/Primitives";
import api from "../../services/api";

export default function ClinicDetails({ portal = false }) {
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

  const Wrapper = portal ? "div" : "main";
  const directoryPath = portal ? "/patient/clinics" : "/clinics";

  if (loading) {
    return (
      <Wrapper className={portal ? "p-6" : "flex min-h-48 flex-1 items-center justify-center bg-page px-4 py-8"}>
        <LoadingState label="Loading clinic details..." />
      </Wrapper>
    );
  }

  if (error || !clinic) {
    return (
      <Wrapper className={portal ? "p-6" : "flex-1 bg-page p-6"}>
        <div className="mx-auto max-w-3xl">
          <ErrorState
            message={error || "This clinic is not available for public viewing."}
            action={<Link to={directoryPath} className="ui-button ui-button-secondary"><ArrowLeft size={16} /> Back to clinics</Link>}
          />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={portal ? "px-1 py-2" : "flex-1 bg-page px-4 py-12"}>
      <div className="mx-auto max-w-5xl">
        <Link to={directoryPath} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand-navy">
          <ArrowLeft size={16} /> Back to clinics
        </Link>

        <Card as="article" className="md:p-8">
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

            <StatusBadge status="verified" label={<><ShieldCheck size={16} aria-hidden="true" /> Verified</>} />
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
        </Card>
      </div>
    </Wrapper>
  );
}
