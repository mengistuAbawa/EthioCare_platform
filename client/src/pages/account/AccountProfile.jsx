import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../services/api";
import ErrorState from "../../components/dashboard/ErrorState";
import { Button, Card, FormField, PageHeader } from "../../components/ui/Primitives";

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

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

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (passwordForm.new_password.length < 12) {
      setPasswordError("New password must be at least 12 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.patch("/auth/password", passwordForm);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordNotice("Your password was changed.");
    } catch (saveError) {
      setPasswordError(saveError.response?.data?.message || "Unable to change your password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Account details"
        description="Update your contact information. Your account role and email are managed securely."
        className="mb-5"
      />
      <Card as="section">
        {error && <ErrorState message={error} className="mb-5" />}
        {notice && <p role="status" className="mb-5 rounded-xl border border-success/20 bg-[var(--color-success-surface)] p-4 text-sm text-success">{notice}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField id="account-full-name" label="Full name" required>
            <input
              minLength={2}
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="ui-control w-full"
            />
          </FormField>

          <FormField id="account-email" label="Email address">
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="ui-control w-full"
            />
          </FormField>

          <FormField id="account-phone" label="Phone number">
            <input
              type="tel"
              minLength={7}
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className="ui-control w-full"
            />
          </FormField>

          <div className="rounded-xl bg-surface-subtle p-4">
            <p className="text-sm font-medium text-slate-700">Account role</p>
            <p className="mt-1 text-sm capitalize text-slate-600">
              {user?.role?.replaceAll("_", " ") || "Unavailable"}
            </p>
          </div>

          <Button type="submit" loading={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
      <Card as="section" className="mt-5">
        <h2 className="text-lg font-semibold text-slate-950">Change password</h2>
        <p className="mt-1 text-sm text-slate-600">Confirm your current password and choose a new password with at least 12 characters.</p>
        {passwordError && <ErrorState message={passwordError} className="mt-4" />}
        {passwordNotice && <p role="status" className="mt-4 rounded-xl border border-success/20 bg-[var(--color-success-surface)] p-4 text-sm text-success">{passwordNotice}</p>}
        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          <FormField id="current-password" label="Current password" required>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={passwordForm.current_password}
              onChange={(event) => setPasswordForm((form) => ({ ...form, current_password: event.target.value }))}
              className="ui-control w-full"
            />
          </FormField>
          <FormField id="new-password" label="New password" required>
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={passwordForm.new_password}
              onChange={(event) => setPasswordForm((form) => ({ ...form, new_password: event.target.value }))}
              className="ui-control w-full"
            />
          </FormField>
          <FormField id="confirm-password" label="Confirm new password" required>
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={passwordForm.confirm_password}
              onChange={(event) => setPasswordForm((form) => ({ ...form, confirm_password: event.target.value }))}
              className="ui-control w-full"
            />
          </FormField>
          <Button type="submit" loading={passwordSaving}>
            {passwordSaving ? "Changing password..." : "Change password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
