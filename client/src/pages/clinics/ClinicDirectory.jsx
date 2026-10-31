import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, FormField, PageHeader, SearchInput, StatusBadge } from "../../components/ui/Primitives";
import api from "../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";

export default function ClinicDirectory({ portal = false }) {
  const { language, t } = useLanguage();
  const amharic = language === "am";
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    params.set("page", String(page));
    params.set("limit", "12");

    return params.toString();
  }, [search, city, page]);

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/clinics/public${query ? `?${query}` : ""}`);
        setClinics(response.data?.data?.clinics || []);
        setPagination(response.data?.data?.pagination || null);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load clinics right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [query, attempt]);

  const Wrapper = portal ? "div" : "main";

  return (
    <Wrapper className={portal ? "space-y-6" : "flex-1 bg-page px-4 py-12"}>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          as={portal ? "h2" : "h1"}
          title={t("discoverCare")}
          description={t("discoverCareDescription")}
          actions={portal ? <Link to="/patient/dashboard" className="ui-button ui-button-secondary">{t("dashboard")}</Link> : null}
          className="mb-8"
        />

        <section aria-label="Filter clinics" className="ui-card mb-8 grid gap-4 p-4 md:grid-cols-[1.5fr_1fr_auto]">
          <SearchInput
            label={t("searchClinics")}
            value={search}
            onChange={(event) => { setPage(1); setSearch(event.target.value); }}
            placeholder="Search by clinic or specialization"
          />
          <FormField id="clinic-city-filter" label={t("city")} className="mb-0">
            <input
              value={city}
              onChange={(event) => { setPage(1); setCity(event.target.value); }}
              placeholder="Filter by city"
              className="ui-control w-full"
            />
          </FormField>
          <Button
            variant="secondary"
            onClick={() => { setSearch(""); setCity(""); setPage(1); }}
          >
            {t("resetFilters")}
          </Button>
        </section>

        {loading ? (
          <LoadingState label={t("loadingClinics")} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => { setLoading(true); setAttempt((current) => current + 1); }} />
        ) : clinics.length === 0 ? (
          <EmptyState title={t("noClinics")} description={amharic ? "ምንም ክሊኒክ አልተገኘም። ፍለጋውን ያስተካክሉ ወይም ያጽዱ።" : "No clinics match the current search. Adjust or clear your filters and try again."} />
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clinics.map((clinic) => (
              <article key={clinic.id} className="ui-card p-5 transition-colors hover:border-brand-teal">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Building2 size={22} />
                  </div>
                  <StatusBadge status="verified" label={<><ShieldCheck size={12} aria-hidden="true" /> {t("verified")}</>} />
                </div>

                <h2 className="text-xl font-bold text-slate-900">{clinic.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} />
                  {clinic.city}{clinic.region ? `, ${clinic.region}` : ""}
                </p>

                <p className="mt-4 line-clamp-3 text-sm text-slate-600">{clinic.address}</p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <Link
                    to={portal ? `/patient/clinics/${clinic.id}` : `/clinic/${clinic.id}`}
                    className="ui-button ui-button-secondary"
                  >
                    {t("viewClinic")}
                  </Link>
                  <Link
                    to={`/patient/assessment/new?clinicId=${clinic.id}`}
                    className="ui-button ui-button-primary"
                  >
                    Request Treatment
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
        {!loading && !error && pagination?.totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Clinic directory pages">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => { setLoading(true); setPage((current) => current - 1); }}
            >
              {t("previous")}
            </Button>
            <span className="text-sm text-slate-600">Page {page} of {pagination.totalPages}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => { setLoading(true); setPage((current) => current + 1); }}
            >
              {t("next")}
            </Button>
          </nav>
        )}
      </div>
    </Wrapper>
  );
}
