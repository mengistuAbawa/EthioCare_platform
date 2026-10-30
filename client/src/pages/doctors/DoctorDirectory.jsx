import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Search, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import { Button, PageHeader, SearchInput, StatusBadge } from "../../components/ui/Primitives";
import { getPublicDoctors } from "../../services/doctorService";

const initialFilters = { search: "", specialty: "", clinic: "", city: "" };

export default function DoctorDirectory({ portal = false }) {
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

  const Wrapper = portal ? "div" : "main";

  return (
    <Wrapper className={portal ? "space-y-6" : "flex-1 bg-page px-4 py-10 sm:px-6"}>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          as={portal ? "h2" : "h1"}
          title="Find a doctor"
          description="Explore approved doctor profiles at verified clinics."
          className="mb-8"
        />

        <form
          onSubmit={submitSearch}
          className="ui-card mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        >
          <SearchInput
            label="Doctor name or specialty"
            name="search"
            value={filters.search}
            onChange={changeFilter}
            placeholder="Doctor name or specialty"
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
          <Button type="submit">
            <Search size={17} /> Search
          </Button>
        </form>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600" aria-live="polite">
            {loading ? "Searching doctors..." : `${pagination.total} doctor${pagination.total === 1 ? "" : "s"} found`}
          </p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => { setLoading(true); setRetryKey((current) => current + 1); }} />
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
                <article key={doctor.id} className="ui-card flex flex-col p-5">
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
                      <span className="mt-1 block"><StatusBadge status={doctor.is_available ? "available" : "unavailable"} label={doctor.is_available ? "Currently available" : "Currently unavailable"} /></span>
                    </span>
                    <Link
                      to={portal ? `/patient/doctors/${doctor.id}` : `/doctors/${doctor.id}`}
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
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => { setLoading(true); setPage((current) => current - 1); }}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">Page {page} of {pagination.pages}</span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= pagination.pages}
                  onClick={() => { setLoading(true); setPage((current) => current + 1); }}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="No matching doctors"
            description="Try another name, specialty, clinic, or city."
          />
        )}
      </div>
    </Wrapper>
  );
}
