import { useEffect, useState } from "react";
import { MapPin, Save, Stethoscope } from "lucide-react";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, Card, FormField, PageHeader, StatusBadge } from "../../components/ui/Primitives";
import { getMyDoctorProfile, updateMyDoctorProfile } from "../../services/doctorService";

export default function MyDoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ specialty: "", qualifications: "", is_available: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const response = await getMyDoctorProfile();
      const nextProfile = response.data?.data?.doctor;
      setProfile(nextProfile);
      setForm({
        specialty: nextProfile?.specialty || "",
        qualifications: nextProfile?.qualifications || "",
        is_available: Boolean(nextProfile?.is_available),
      });
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load your professional profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getMyDoctorProfile()
      .then((response) => {
        if (!active) return;
        const nextProfile = response.data?.data?.doctor;
        setProfile(nextProfile);
        setForm({
          specialty: nextProfile?.specialty || "",
          qualifications: nextProfile?.qualifications || "",
          is_available: Boolean(nextProfile?.is_available),
        });
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || "Unable to load your professional profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateMyDoctorProfile({
        specialty: form.specialty,
        qualifications: form.qualifications || null,
        is_available: form.is_available,
      });
      await load();
      setNotice("Profile saved. Changes to professional details are hidden from public search until your clinic reviews them.");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading your professional profile..." />;
  }

  return (
    <div className="mx-auto max-w-3xl">
        <PageHeader title="My professional profile" className="mb-6" />
        {error ? <ErrorState message={error} className="mb-4" /> : null}
        {notice ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status">{notice}</p> : null}
        {profile ? (
          <>
            <Card as="section" className="mb-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-800"><Stethoscope size={24} /></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{profile.clinic_name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin size={15} /> {profile.city}{profile.region ? `, ${profile.region}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    License number: {profile.license_number} · Consultation fee: {profile.consultation_fee} ETB
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={profile.is_profile_approved ? "approved" : "pending"} label={profile.is_profile_approved ? "Public profile approved" : "Profile details require clinic review"} />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-800">Assigned clinic services</h3>
                    {profile.services?.length ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {profile.services.map((service) => (
                          <li key={service.id} className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900">
                            {service.name}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-1 text-sm text-slate-600">No active service assignments.</p>}
                  </div>
                </div>
              </div>
            </Card>
            <Card as="form" onSubmit={submit} className="space-y-5">
              <FormField id="doctor-specialty" label="Specialty" required>
                <input
                  minLength="2"
                  maxLength="120"
                  value={form.specialty}
                  onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                  className="ui-control w-full"
                />
              </FormField>
              <FormField id="doctor-qualifications" label="Qualifications">
                <textarea
                  rows="4"
                  maxLength="2000"
                  value={form.qualifications}
                  onChange={(event) => setForm((current) => ({ ...current, qualifications: event.target.value }))}
                  className="ui-control w-full"
                />
              </FormField>
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-text-primary">
                <input type="checkbox" checked={form.is_available} onChange={(event) => setForm((current) => ({ ...current, is_available: event.target.checked }))} />
                Available to patients
              </label>
              <Button type="submit" loading={saving}>
                <Save size={17} /> {saving ? "Saving..." : "Save profile"}
              </Button>
            </Card>
          </>
        ) : (
          <EmptyState
            title="No clinic doctor profile"
            description="Your account is not linked to a clinic doctor profile yet. Contact your clinic administrator to link your existing account."
            action={<Button onClick={() => { setLoading(true); load(); }}>Retry</Button>}
          />
        )}
    </div>
  );
}
