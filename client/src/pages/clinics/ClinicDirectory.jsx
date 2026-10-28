import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ClinicDirectory() {
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());

    return params.toString();
  }, [search, city]);

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/clinics/public${query ? `?${query}` : ""}`);
        setClinics(response.data?.data?.clinics || []);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load clinics right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Clinic directory</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Discover trusted care providers</h1>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.5fr_1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search clinics</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by clinic or specialization"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Filter by city</span>
            <MapPin className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Filter by city"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCity("");
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Reset
          </button>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading clinics...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
            {error}
          </div>
        ) : clinics.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No verified clinics match your search.
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clinics.map((clinic) => (
              <article key={clinic.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Building2 size={22} />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">{clinic.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} />
                  {clinic.city}{clinic.region ? `, ${clinic.region}` : ""}
                </p>

                <p className="mt-4 line-clamp-3 text-sm text-slate-600">{clinic.address}</p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Sparkles size={14} className="text-teal-600" />
                    Trusted care
                  </div>
                  <Link
                    to={`/clinic/${clinic.id}`}
                    className="inline-flex items-center rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    View clinic
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
