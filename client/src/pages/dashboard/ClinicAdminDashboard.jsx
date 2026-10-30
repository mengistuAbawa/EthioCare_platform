import { Building2, PlusCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import ErrorState from "../../components/dashboard/ErrorState";
import { Button, Card, FormField, PageHeader, StatusBadge } from "../../components/ui/Primitives";

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
  const [loadError, setLoadError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadAttempt, setLoadAttempt] = useState(0);

  const fetchClinics = useCallback(async () => {
    const response = await api.get("/clinics/my/clinics");
    return response.data?.data?.clinics || [];
  }, []);

  useEffect(() => {
    let active = true;
    fetchClinics()
      .then((nextClinics) => {
        if (active) {
          setClinics(nextClinics);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.response?.data?.message || "Unable to load your clinics.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchClinics, loadAttempt]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    setFieldErrors({});

    try {
      await api.post("/clinics", form);
      setForm(emptyForm);
      try {
        const nextClinics = await fetchClinics();
        setClinics(nextClinics);
        setLoadError("");
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
      const validationErrors = error.response?.data?.errors;
      const nextFieldErrors = Array.isArray(validationErrors)
        ? validationErrors.reduce((result, item) => {
            if (item.field && item.message) result[item.field] = item.message;
            return result;
          }, {})
        : {};
      setFieldErrors(nextFieldErrors);
      setMessage({
        type: "error",
        text: Object.keys(nextFieldErrors).length
          ? "Review the highlighted fields and try again."
          : error.response?.data?.message || "Unable to register the clinic.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        as="h2"
        title={`Welcome, ${user?.full_name || "Clinic administrator"}`}
        description="Manage your clinic profile and review your participation status."
      />

      <section aria-label="Clinic overview" aria-busy={loading} className="grid gap-4 md:grid-cols-3">
          <Card as="article" className="shadow-none">
            <div className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Building2 size={22} />
            </div>
            <p className="text-sm text-text-secondary">Account</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{user?.role?.replaceAll("_", " ") || "Clinic administrator"}</p>
          </Card>

          <Card as="article" className="shadow-none">
            <div className="mb-4 inline-flex rounded-xl bg-sky-100 p-3 text-sky-700">
              <PlusCircle size={22} />
            </div>
            <p className="text-sm text-text-secondary">Registered clinics</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{loading || loadError ? "—" : clinics.length}</p>
          </Card>

          <Card as="article" className="shadow-none">
            <div className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
              <ShieldCheck size={22} />
            </div>
            <p className="text-sm text-text-secondary">Verified clinics</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {loading || loadError ? "—" : clinics.filter((clinic) => clinic.verification_status === "verified").length}
            </p>
          </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card id="your-clinics" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Your clinics</h3>
                <p className="mt-1 text-sm text-text-secondary">Clinic profiles linked to your administrator account.</p>
              </div>
            </div>

            {loading ? (
              <p role="status" className="py-6 text-sm text-text-secondary">Loading clinic profiles…</p>
            ) : loadError ? (
              <ErrorState
                message={loadError}
                onRetry={() => {
                  setLoading(true);
                  setLoadError("");
                  setLoadAttempt((current) => current + 1);
                }}
              />
            ) : clinics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong bg-page p-6 text-sm leading-6 text-text-secondary">
                No clinics are linked to your account yet. Submit a clinic profile for authorized review using the form.
              </div>
            ) : (
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <article key={clinic.id} className="rounded-xl border border-border bg-surface-subtle p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{clinic.name}</h4>
                        <p className="mt-1 text-sm text-text-secondary">{clinic.city}{clinic.region ? `, ${clinic.region}` : ""}</p>
                      </div>
                      <StatusBadge status={clinic.verification_status} />
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">{clinic.address}</p>
                    <Link
                      to={`/clinic/${clinic.id}/doctors`}
                      className="ui-button ui-button-secondary mt-4 min-h-10"
                    >
                      Manage doctors
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card as="section" id="register-clinic" className="scroll-mt-24">
            <h3 className="text-lg font-bold text-text-primary">Register a clinic</h3>
            <p className="mt-1 text-sm leading-6 text-text-secondary">Submit a clinic profile for authorized verification review.</p>

            {message.text ? (
              <div
                role={message.type === "error" ? "alert" : "status"}
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
              <FormField id="clinic-slug" label="Clinic URL identifier" required hint="Use lowercase letters, numbers, and hyphens." error={fieldErrors.slug}>
                <input name="slug" value={form.slug} onChange={handleChange} placeholder="clinic-name" pattern="[a-z0-9]+(-[a-z0-9]+)*" className="ui-control w-full" />
              </FormField>
              <FormField id="clinic-name" label="Clinic name" required error={fieldErrors.name}>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Clinic name" minLength={2} maxLength={160} className="ui-control w-full" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="clinic-city" label="City" required error={fieldErrors.city}>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="City" minLength={2} maxLength={120} className="ui-control w-full" />
                </FormField>
                <FormField id="clinic-region" label="Region" hint="Optional" error={fieldErrors.region}>
                  <input name="region" value={form.region} onChange={handleChange} placeholder="Region" minLength={2} maxLength={120} className="ui-control w-full" />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="clinic-email" label="Contact email" hint="Optional" error={fieldErrors.contact_email}>
                  <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="contact@example.com" className="ui-control w-full" />
                </FormField>
                <FormField id="clinic-phone" label="Contact phone" hint="Optional" error={fieldErrors.contact_phone}>
                  <input name="contact_phone" type="tel" value={form.contact_phone} onChange={handleChange} placeholder="+251…" minLength={7} maxLength={30} className="ui-control w-full" />
                </FormField>
              </div>
              <FormField id="clinic-address" label="Clinic address" required error={fieldErrors.address}>
                <textarea name="address" value={form.address} onChange={handleChange} placeholder="Street address and area" rows={3} minLength={8} maxLength={250} className="ui-control w-full resize-y" />
              </FormField>

              <Button type="submit" loading={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit clinic for review"}
              </Button>
            </form>
          </Card>
      </div>
    </div>
  );
}
