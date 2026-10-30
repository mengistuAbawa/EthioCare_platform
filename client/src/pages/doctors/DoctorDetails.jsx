import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Stethoscope } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Card, StatusBadge } from "../../components/ui/Primitives";
import { getPublicDoctor } from "../../services/doctorService";

export default function DoctorDetails({ portal = false }) {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const loading = loadedId !== id;
  const [error, setError] = useState("");
  const Wrapper = portal ? "div" : "main";
  const directoryPath = portal ? "/patient/doctors" : "/doctors";

  useEffect(() => {
    let active = true;

    getPublicDoctor(id)
      .then((response) => {
        if (active) {
          setDoctor(response.data?.data?.doctor || null);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) {
          setDoctor(null);
          setError(loadError.response?.data?.message || "Unable to load this doctor profile.");
        }
      })
      .finally(() => {
        if (active) setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Wrapper className={portal ? "flex min-h-48 items-center justify-center" : "flex min-h-48 flex-1 items-center justify-center bg-page px-4 py-8"}>
        <LoadingState label="Loading doctor profile..." />
      </Wrapper>
    );
  }

  if (error || !doctor) {
    return (
      <Wrapper className={portal ? "p-6" : "flex-1 bg-page p-6"}>
        <div className="mx-auto max-w-3xl">
          <ErrorState
            message={error || "Doctor profile not found."}
            action={<Link to={directoryPath} className="ui-button ui-button-secondary"><ArrowLeft size={16} /> Back to doctor directory</Link>}
          />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={portal ? "px-1 py-2" : "flex-1 bg-page px-4 py-10 sm:px-6"}>
      <article className="mx-auto max-w-4xl">
        <Link to={directoryPath} className="mb-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-800">
          <ArrowLeft size={17} /> Doctor directory
        </Link>
        <Card as="div" className="sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <Stethoscope size={30} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Doctor profile</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">{doctor.name}</h1>
              <p className="mt-2 font-semibold text-slate-700">{doctor.specialty}</p>
            </div>
          </div>
          {doctor.qualifications ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Qualifications</h2>
              <p className="mt-2 leading-7 text-slate-700">{doctor.qualifications}</p>
            </section>
          ) : null}
          <section className="mt-8 rounded-2xl bg-slate-50 p-5">
            <h2 className="font-bold text-slate-900">Clinic</h2>
            <p className="mt-2 flex items-center gap-2 text-slate-700">
              <MapPin size={17} className="text-teal-700" />
              {doctor.clinic_name} · {doctor.city}{doctor.region ? `, ${doctor.region}` : ""}
            </p>
            {doctor.services?.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {doctor.services.map((service) => (
                  <li key={service.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="font-medium text-slate-900">{service.name}</span>
                    {service.fee > 0 ? <span className="ml-2 text-sm text-slate-500">· {service.fee} ETB</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No public services listed.</p>
            )}
          </section>
          <p className="mt-6 text-sm text-slate-500">
            Consultation fee: {doctor.consultation_fee > 0 ? `${doctor.consultation_fee} ETB` : "Contact the clinic"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <StatusBadge status={doctor.is_available ? "available" : "unavailable"} label={doctor.is_available ? "Currently available" : "Currently unavailable"} />
          </p>
        </Card>
      </article>
    </Wrapper>
  );
}
