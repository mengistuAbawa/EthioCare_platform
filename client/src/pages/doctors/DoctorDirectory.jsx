import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Search, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicDoctors } from "../../services/doctorService";

const initialFilters = { search: "", specialty: "", clinic: "", city: "" };

export default function DoctorDirectory() {
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPublicDoctors({ ...query, page, limit: 12, sort: "name" })
      .then((response) => {
        if (!active) return;
        setDoctors(response.data?.data?.doctors || []);
        setPagination(response.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || "Unable to load doctors. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, query, retryKey]);

  const changeFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPage(1);
    setQuery(Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value.trim()])
    ));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">EthioCare directory</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Find a doctor</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Explore approved doctor profiles at verified clinics.
          </p>
        </header>

        <form
          onSubmit={submitSearch}
          className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        >
          <label className="sr-only" htmlFor="doctor-search">Doctor name or specialty</label>
          <input
            id="doctor-search"
            name="search"
            value={filters.search}
            onChange={changeFilter}
            placeholder="Doctor name or specialty"
            className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <label className="sr-only" htmlFor="doctor-specialty">Specialty</label>
          <input
            id="doctor-specialty"
            name="specialty"
            value={filters.specialty}
            onChange={changeFilter}
            placeholder="Specialty"
            className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <label className="sr-only" htmlFor="doctor-clinic">Clinic</label>
          <input
            id="doctor-clinic"
            name="clinic"
            value={filters.clinic}
            onChange={changeFilter}
            placeholder="Clinic"
            className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <label className="sr-only" htmlFor="doctor-city">City</label>
          <input
            id="doctor-city"
            name="city"
            value={filters.city}
            onChange={changeFilter}
            placeholder="City"
            className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800"
          >
            <Search size={17} /> Search
          </button>
        </form>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600" aria-live="polite">
            {loading ? "Searching doctors..." : `${pagination.total} doctor${pagination.total === 1 ? "" : "s"} found`}
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800" role="alert">
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => { setLoading(true); setRetryKey((current) => current + 1); }} className="mt-3 font-semibold underline">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading doctor profiles">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="mt-5 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                <div className="mt-8 h-4 w-3/4 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : doctors.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <article key={doctor.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Stethoscope size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-slate-900">{doctor.name}</h2>
                      <p className="mt-1 text-sm font-medium text-teal-800">{doctor.specialty}</p>
                    </div>
                  </div>
                  {doctor.qualifications ? (
                    <p className="mt-4 line-clamp-2 text-sm text-slate-600">{doctor.qualifications}</p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="shrink-0 text-slate-400" />
                    <span>{doctor.clinic_name} · {doctor.city}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        {doctor.consultation_fee > 0 ? `${doctor.consultation_fee} ETB` : "Fee not listed"}
                      </span>
                      <span className={`mt-1 block text-xs font-medium ${doctor.is_available ? "text-emerald-700" : "text-slate-500"}`}>
                        {doctor.is_available ? "Currently available" : "Currently unavailable"}
                      </span>
                    </span>
                    <Link
                      to={`/doctors/${doctor.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
                    >
                      View profile <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {pagination.pages > 1 ? (
              <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Doctor directory pages">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => { setLoading(true); setPage((current) => current - 1); }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {page} of {pagination.pages}</span>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => { setLoading(true); setPage((current) => current + 1); }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Stethoscope className="mx-auto text-slate-400" size={30} />
            <h2 className="mt-3 font-semibold text-slate-900">No matching doctors</h2>
            <p className="mt-1 text-sm text-slate-600">Try another name, specialty, clinic, or city.</p>
          </div>
        )}
      </div>
    </main>
  );
}
