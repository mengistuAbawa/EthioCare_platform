import { useEffect, useState } from "react";
import { MapPin, Save, Stethoscope } from "lucide-react";
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
    return <main className="flex min-h-screen items-center justify-center text-slate-600">Loading your profile...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Doctor workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">My professional profile</h1>
        </header>
        {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800" role="alert">{error}</p> : null}
        {notice ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status">{notice}</p> : null}
        {profile ? (
          <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  <p className={`mt-2 text-sm font-medium ${profile.is_profile_approved ? "text-emerald-700" : "text-amber-800"}`}>
                    {profile.is_profile_approved ? "Public profile approved" : "Profile details require clinic review"}
                  </p>
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
            </section>
            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700">
                Specialty
                <input
                  required
                  minLength="2"
                  maxLength="120"
                  value={form.specialty}
                  onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Qualifications
                <textarea
                  rows="4"
                  maxLength="2000"
                  value={form.qualifications}
                  onChange={(event) => setForm((current) => ({ ...current, qualifications: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(event) => setForm((current) => ({ ...current, is_available: event.target.checked }))}
                />
                Available to patients
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                <Save size={17} /> {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          </>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900" role="status">
            Your account does not yet have a clinic doctor profile. Contact your clinic administrator to link your existing account.
            <button type="button" onClick={() => { setLoading(true); load(); }} className="ml-2 font-semibold underline">Retry</button>
          </section>
        )}
      </div>
    </main>
  );
}
