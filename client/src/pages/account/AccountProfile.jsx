import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import ErrorState from "../../components/dashboard/ErrorState";

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.patch("/auth/profile", {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });
      try {
        await refreshUser();
        setNotice("Your profile was updated.");
      } catch {
        setError("Your profile was saved, but your session could not be refreshed. Please sign in again.");
      }
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-950">Account details</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your contact information. Your account role and email are managed securely.
        </p>
      </div>

      {error && <ErrorState message={error} className="mb-5" />}
      {notice && (
        <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span>
          <input
            type="email"
            value={user?.email || ""}
            readOnly
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</span>
          <input
            type="tel"
            minLength={7}
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Account role</p>
          <p className="mt-1 text-sm capitalize text-slate-600">
            {user?.role?.replaceAll("_", " ") || "Unavailable"}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
