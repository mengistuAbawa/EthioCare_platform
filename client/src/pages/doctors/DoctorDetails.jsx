import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Stethoscope } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getPublicDoctor } from "../../services/doctorService";

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const loading = loadedId !== id;
  const [error, setError] = useState("");

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
        if (active) setError(loadError.response?.data?.message || "Unable to load this doctor profile.");
      })
      .finally(() => {
        if (active) setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-slate-600">Loading doctor profile...</main>;
  }

  if (error || !doctor) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800" role="alert">
          {error || "Doctor profile not found."}
          <Link to="/doctors" className="mt-4 block font-semibold underline">Back to doctor directory</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <Link to="/doctors" className="mb-6 inline-flex items-center gap-2 font-semibold text-teal-800">
          <ArrowLeft size={17} /> Doctor directory
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
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
            {doctor.is_available ? "Currently available" : "Currently unavailable"}
          </p>
        </div>
      </article>
    </main>
  );
}
