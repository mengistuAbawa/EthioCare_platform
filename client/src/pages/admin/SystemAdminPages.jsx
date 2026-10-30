import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getAdminAppointments,
  getAdminAuditLogs,
  getAdminClinic,
  getAdminClinics,
  getAdminNotifications,
  getAdminUsers,
  createAdminManagedUser,
  markAdminNotificationRead,
  reviewAdminClinic,
  updateAdminClinic,
  updateAdminClinicStatus,
} from "../../services/systemAdminService";
import EmptyState from "../../components/dashboard/EmptyState";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, PageHeader, StatusBadge as UiStatusBadge } from "../../components/ui/Primitives";

const panelClass = "ui-card p-5 sm:p-6";
const inputClass = "ui-control w-full text-sm";
const buttonClass = "ui-button ui-button-primary";

const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";
const humanize = (value) => String(value || "").replaceAll("_", " ");
const messageFrom = (error, fallback) => error.response?.data?.message || fallback;

function PageTitle({ title, description, children }) {
  return <PageHeader title={title} description={description} actions={children} className="mb-6" />;
}

function AdminPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages < 2) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-sm text-slate-600">
        Page {pagination.page} of {pagination.pages} · {pagination.total} records
      </p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass} disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          Previous
        </button>
        <button type="button" className={buttonClass} disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ children, tone = "slate" }) {
  const statusByTone = {
    slate: "unknown",
    green: "verified",
    amber: "pending",
    red: "rejected",
    blue: "not_configured",
  };
  return <UiStatusBadge status={statusByTone[tone] || "unknown"} label={humanize(children)} />;
}

const statusTone = (value) => value === "verified" || value === "active" || value === "completed" ? "green"
  : value === "pending" || value === "confirmed" ? "amber"
    : value === "suspended" || value === "rejected" || value === "cancelled" ? "red" : "slate";

export function ClinicManagementPage({ view = "all" }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [clinics, setClinics] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20, ...filters };
      if (search.trim()) params.search = search.trim();
      const response = await getAdminClinics(params);
      setClinics(response.data?.data?.clinics || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load clinic records."));
    } finally {
      setLoading(false);
    }
  }, [filters, page, search]);

  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  const title = view === "status" ? "Clinic status and suspension" : "Clinic management";
  const description = view === "status"
    ? "Review operating status and open clinic records to suspend or reactivate with an auditable reason."
    : "Search and review clinic records, verification status, and authorized profile details.";

  return (
    <section className={panelClass}>
      <PageTitle title={title} description={description} />
      <form
        className="mb-5 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_12rem_12rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          setPage(1);
          setReload((current) => current + 1);
        }}
      >
        <label>
          <span className="sr-only">Search clinics</span>
          <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, slug, city, email" />
        </label>
        <label>
          <span className="sr-only">Verification status</span>
          <select className={inputClass} value={filters.verification_status || ""} onChange={(event) => setFilters((current) => ({ ...current, verification_status: event.target.value || undefined }))}>
            <option value="">All verification states</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Operating status</span>
          <select className={inputClass} value={view === "status" ? filters.operational_status || "" : ""} disabled={view !== "status"} onChange={(event) => setFilters((current) => ({ ...current, operational_status: event.target.value || undefined }))}>
            <option value="">All operating states</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button type="submit" className={buttonClass}>Search</button>
      </form>

      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading clinics..." /> : clinics.length === 0 ? (
        <EmptyState title="No clinics found" description="No clinic records match the selected search and filters." />
      ) : (
        <div className="overflow-x-auto" role="region" aria-label="Clinic results, horizontally scrollable table" tabIndex={0}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-3">Clinic</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Verification</th><th className="px-3 py-3">Operating status</th><th className="px-3 py-3">Registered</th><th className="px-3 py-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="px-3 py-3"><p className="font-semibold text-slate-900">{clinic.name}</p><p className="text-xs text-slate-500">{clinic.slug}</p></td>
                  <td className="px-3 py-3 text-slate-600">{clinic.city}{clinic.region ? `, ${clinic.region}` : ""}</td>
                  <td className="px-3 py-3"><StatusBadge tone={statusTone(clinic.verification_status)}>{clinic.verification_status}</StatusBadge></td>
                  <td className="px-3 py-3"><StatusBadge tone={statusTone(clinic.operational_status)}>{clinic.operational_status}</StatusBadge></td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(clinic.created_at)}</td>
                  <td className="px-3 py-3"><Link className="font-semibold text-teal-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700" to={`/admin/clinics/${clinic.id}`}>View details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}

export function ClinicVerificationPage() {
  const [clinics, setClinics] = useState([]);
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await getAdminClinics({ page: 1, limit: 100, verification_status: "pending" });
      setClinics(response.data?.data?.clinics || []);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load pending clinic applications."));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  const review = async (clinic, decision) => {
    const reason = reasons[clinic.id]?.trim() || "";
    if (decision === "rejected" && reason.length < 5) {
      setError("Enter a rejection reason of at least five characters.");
      return;
    }
    if (!window.confirm(`${decision === "verified" ? "Approve" : "Reject"} ${clinic.name}? This records your decision in the audit history.`)) return;
    setBusyId(clinic.id);
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await reviewAdminClinic(clinic.id, { decision, reason: decision === "rejected" ? reason : undefined });
      setMessage(response.data?.message || `Clinic ${decision} successfully.`);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to record the verification decision."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={panelClass}>
      <PageTitle title="Clinic verification" description="Review submitted clinic profiles. This database does not currently store uploaded verification evidence." />
      {message && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading pending applications..." /> : clinics.length === 0 ? (
        <EmptyState title="No pending applications" description="All currently stored clinic applications have been reviewed." />
      ) : (
        <div className="space-y-4">
          {clinics.map((clinic) => (
            <article key={clinic.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{clinic.name}</h3>
                  <p className="text-sm text-slate-600">{clinic.city}{clinic.region ? `, ${clinic.region}` : ""} · {clinic.slug}</p>
                  <p className="mt-2 text-sm text-slate-600">{clinic.address}</p>
                  <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(clinic.created_at)} · {clinic.created_by_name || "Owner unavailable"}</p>
                  <Link className="mt-3 inline-block text-sm font-semibold text-teal-800 hover:underline" to={`/admin/clinics/${clinic.id}`}>Review full clinic details</Link>
                </div>
                <div className="w-full max-w-xl">
                  <label className="block text-sm font-medium text-slate-700">
                    Rejection reason (required only when rejecting)
                    <textarea className={`${inputClass} mt-1 min-h-20`} minLength={5} maxLength={1000} value={reasons[clinic.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [clinic.id]: event.target.value }))} />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} disabled={busyId === clinic.id} onClick={() => review(clinic, "verified")}>{busyId === clinic.id ? "Saving..." : "Approve application"}</button>
                    <button type="button" className="min-h-10 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:opacity-60" disabled={busyId === clinic.id} onClick={() => review(clinic, "rejected")}>Reject application</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ClinicDetailPage() {
  const { clinicId } = useParams();
  const [clinic, setClinic] = useState(null);
  const [form, setForm] = useState({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await getAdminClinic(clinicId);
      const result = response.data?.data?.clinic;
      setClinic(result);
      setForm({
        name: result?.name || "",
        contact_email: result?.contact_email || "",
        contact_phone: result?.contact_phone || "",
        city: result?.city || "",
        region: result?.region || "",
        address: result?.address || "",
      });
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load clinic details."));
    } finally {
      setLoading(false);
    }
  }, [clinicId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  const save = async (event) => {
    event.preventDefault();
    if (!window.confirm("Save these clinic profile changes? The action will be recorded.")) return;
    setSaving(true);
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null, region: form.region || null };
      const response = await updateAdminClinic(clinicId, payload);
      setMessage(response.data?.message || "Clinic details updated.");
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to save clinic details."));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    const status = clinic.operational_status === "suspended" ? "active" : "suspended";
    if (reason.trim().length < 5) {
      setError("Enter a reason of at least five characters before changing clinic status.");
      return;
    }
    if (!window.confirm(`${status === "suspended" ? "Suspend" : "Reactivate"} ${clinic.name}? Existing access will be affected.`)) return;
    setSaving(true);
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await updateAdminClinicStatus(clinicId, { status, reason: reason.trim() });
      setMessage(response.data?.message || `Clinic ${status}.`);
      setReason("");
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to change clinic status."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading clinic details..." />;
  if (error && !clinic) return <ErrorState message={error} onRetry={() => setReload((current) => current + 1)} />;
  if (!clinic) return <EmptyState title="Clinic not found" description="This clinic record may have been removed." />;

  return (
    <div className="space-y-5">
      <Link to="/admin/clinics" className="inline-flex text-sm font-semibold text-teal-800 hover:underline">← Back to clinic management</Link>
      {error && <ErrorState message={error} onRetry={() => setReload((current) => current + 1)} />}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <section className={panelClass}>
        <PageTitle title={clinic.name} description={`Clinic ID ${clinic.id} · ${clinic.slug}`} />
        <div className="mb-5 flex flex-wrap gap-2">
          <StatusBadge tone={statusTone(clinic.verification_status)}>Verification: {clinic.verification_status}</StatusBadge>
          <StatusBadge tone={statusTone(clinic.operational_status)}>Operations: {clinic.operational_status}</StatusBadge>
        </div>
        <div className="mb-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p>Submitted: {formatDate(clinic.created_at)}</p><p>Last updated: {formatDate(clinic.updated_at)}</p>
          <p>Reviewed by: {clinic.reviewed_by_name || "Not reviewed"}</p><p>Review timestamp: {formatDate(clinic.reviewed_at)}</p>
          {clinic.rejection_reason && <p className="sm:col-span-2">Rejection reason: {clinic.rejection_reason}</p>}
          {clinic.suspended_by_name && <p>Suspended by: {clinic.suspended_by_name}</p>}
          {clinic.suspension_reason && <p className="sm:col-span-2">Suspension reason: {clinic.suspension_reason}</p>}
        </div>
        <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No uploaded verification documents are available in the current schema.</p>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          {[
            ["name", "Clinic name"],
            ["contact_email", "Contact email"],
            ["contact_phone", "Contact phone"],
            ["city", "City"],
            ["region", "Region"],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-medium text-slate-700">
              {label}
              <input className={`${inputClass} mt-1`} value={form[field] || ""} type={field === "contact_email" ? "email" : "text"} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            </label>
          ))}
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Address
            <textarea required minLength={8} maxLength={250} className={`${inputClass} mt-1 min-h-20`} value={form.address || ""} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <div className="sm:col-span-2"><button type="submit" className={buttonClass} disabled={saving}>{saving ? "Saving..." : "Save clinic details"}</button></div>
        </form>
      </section>
      <section className={`${panelClass} border-rose-200`}>
        <h3 className="text-base font-bold text-slate-950">Operational status</h3>
        <p className="mt-1 text-sm text-slate-600">Suspending blocks public clinic and doctor discovery and prevents clinic staff operations.</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Required reason
          <textarea className={`${inputClass} mt-1 min-h-20`} minLength={5} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button type="button" className="mt-3 min-h-10 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:opacity-60" onClick={changeStatus} disabled={saving}>
          {clinic.operational_status === "suspended" ? "Reactivate clinic" : "Suspend clinic"}
        </button>
      </section>
    </div>
  );
}

export function UserManagementPage({ mode = "all" }) {
  const location = useLocation();
  const fixedRole = mode === "doctor" ? "doctor" : mode === "staff" ? undefined : undefined;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(fixedRole || "");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const isStaff = mode === "staff";
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "clinic_admin",
    clinic_id: "",
  });
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createNotice, setCreateNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      const selectedRole = fixedRole || role;
      if (selectedRole) params.role = selectedRole;
      else if (isStaff) params.roles = "clinic_admin,receptionist";
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      const response = await getAdminUsers(params);
      setUsers(response.data?.data?.users || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load user accounts."));
    } finally {
      setLoading(false);
    }
  }, [fixedRole, isStaff, page, role, search, status]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, location.pathname, reload]);

  const loadClinics = useCallback(async () => {
    setClinicsLoading(true);
    try {
      const response = await getAdminClinics({ page: 1, limit: 100 });
      setClinics(response.data?.data?.clinics || []);
    } catch (requestError) {
      setCreateError(messageFrom(requestError, "Unable to load clinics for the administrator account."));
    } finally {
      setClinicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!["clinic_admin", "receptionist"].includes(createForm.role) || mode !== "all") return;
    void Promise.resolve().then(loadClinics);
  }, [createForm.role, loadClinics, mode]);

  const submitCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateNotice("");

    try {
      const payload = {
        full_name: createForm.full_name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || undefined,
        password: createForm.password,
        role: createForm.role,
      };
      if (["clinic_admin", "receptionist"].includes(createForm.role)) {
        payload.clinic_id = Number(createForm.clinic_id);
      }
      const response = await createAdminManagedUser(payload);
      setCreateNotice(response.data?.message || "Account created.");
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "clinic_admin",
        clinic_id: "",
      });
      setReload((current) => current + 1);
    } catch (requestError) {
      setCreateError(messageFrom(requestError, "Unable to create the account."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className={panelClass}>
      <PageTitle
        title={mode === "doctor" ? "Doctor Management" : isStaff ? "Security & Access Control" : "User Management"}
        description="Review platform accounts and provision clinic administrator, receptionist, and doctor accounts. Existing accounts cannot have their role changed here."
      />
      {mode === "all" && (
        <form onSubmit={submitCreate} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-slate-950">Create a clinic account</h3>
          <p className="mt-1 text-sm text-slate-600">
            Set an initial password of at least 12 characters and share it with the account holder through a secure channel. They can change it from Account Details.
          </p>
          {createError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{createError}</p>}
          {createNotice && <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createNotice}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Account type
              <select
                className={`${inputClass} mt-1`}
                value={createForm.role}
                onChange={(event) => setCreateForm((form) => ({ ...form, role: event.target.value, clinic_id: "" }))}
              >
                <option value="clinic_admin">Clinic administrator</option>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input
                required
                minLength={2}
                maxLength={120}
                className={`${inputClass} mt-1`}
                value={createForm.full_name}
                onChange={(event) => setCreateForm((form) => ({ ...form, full_name: event.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                maxLength={254}
                className={`${inputClass} mt-1`}
                value={createForm.email}
                onChange={(event) => setCreateForm((form) => ({ ...form, email: event.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone (optional)
              <input
                type="tel"
                minLength={7}
                maxLength={30}
                className={`${inputClass} mt-1`}
                value={createForm.phone}
                onChange={(event) => setCreateForm((form) => ({ ...form, phone: event.target.value }))}
              />
            </label>
            {["clinic_admin", "receptionist"].includes(createForm.role) && (
              <label className="text-sm font-medium text-slate-700">
                Clinic assignment
                <select
                  required
                  className={`${inputClass} mt-1`}
                  value={createForm.clinic_id}
                  onChange={(event) => setCreateForm((form) => ({ ...form, clinic_id: event.target.value }))}
                  disabled={clinicsLoading}
                >
                  <option value="">{clinicsLoading ? "Loading clinics..." : "Select a clinic"}</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name} · {humanize(clinic.verification_status)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">
              Initial password (12+ characters)
              <input
                required
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                className={`${inputClass} mt-1`}
                value={createForm.password}
                onChange={(event) => setCreateForm((form) => ({ ...form, password: event.target.value }))}
              />
            </label>
          </div>
          {createForm.role === "doctor" && (
            <p className="mt-3 text-sm text-slate-600">
              This creates the doctor login account. A clinic administrator must then assign it to a verified clinic and create the doctor profile.
            </p>
          )}
          {["clinic_admin", "receptionist"].includes(createForm.role) && clinics.length === 0 && !clinicsLoading && (
            <p className="mt-3 text-sm text-amber-800">
              Create a clinic record before provisioning a clinic administrator or receptionist.
            </p>
          )}
          <Button
            type="submit"
            loading={creating}
            disabled={clinicsLoading || (["clinic_admin", "receptionist"].includes(createForm.role) && clinics.length === 0)}
            className="mt-4"
          >
            {creating ? "Creating account..." : "Create account"}
          </Button>
        </form>
      )}
      <form className="mb-5 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_12rem_12rem_auto]" onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(""); setPage(1); setReload((current) => current + 1); }}>
        <label><span className="sr-only">Search users</span><input className={inputClass} placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {fixedRole ? <div className={`${inputClass} flex items-center capitalize`}>Doctor accounts</div> : (
          <label><span className="sr-only">Role</span><select className={inputClass} value={role} onChange={(event) => setRole(event.target.value)}><option value="">{isStaff ? "All clinic staff" : "All roles"}</option>{(isStaff ? ["clinic_admin", "receptionist"] : ["system_admin", "clinic_admin", "doctor", "receptionist", "patient"]).map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>
        )}
        <label><span className="sr-only">Account status</span><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All account states</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <button type="submit" className={buttonClass}>Search</button>
      </form>
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading accounts..." /> : users.length === 0 ? <EmptyState title="No accounts found" description="No accounts match the selected filters." /> : (
        <div className="overflow-x-auto" role="region" aria-label="User results, horizontally scrollable table" tabIndex={0}>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Account</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Profile</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}>
              <td className="px-3 py-3"><p className="font-semibold text-slate-900">{user.full_name}</p><p className="text-xs text-slate-500">{user.email} · ID {user.id}</p></td>
              <td className="px-3 py-3 capitalize">{humanize(user.role)}</td>
              <td className="px-3 py-3 text-slate-600">{user.specialty ? `${user.specialty}${user.clinic_name ? ` · ${user.clinic_name}` : ""}` : user.phone || "—"}</td>
              <td className="px-3 py-3"><StatusBadge tone={user.is_active ? "green" : "red"}>{user.is_active ? "active" : "inactive"}</StatusBadge>{user.is_verified && <span className="ml-1"><StatusBadge tone="blue">verified</StatusBadge></span>}</td>
              <td className="px-3 py-3 text-slate-600">{formatDate(user.created_at)}</td>
            </tr>)}</tbody>
          </table>
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}

export function AppointmentsOverviewPage() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
      const response = await getAdminAppointments(params);
      setRows(response.data?.data?.appointments || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load appointment records."));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  return (
    <section className={panelClass}>
      <PageTitle title="Appointments overview" description="Read-only operational view. Patient names, contact details, and appointment reasons are intentionally omitted." />
      <form className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(""); setPage(1); setReload((current) => current + 1); }}>
        <label><span className="sr-only">Appointment status</span><select className={inputClass} value={filters.status || ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"].map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
        <label><span className="sr-only">Clinic ID</span><input type="number" min="1" className={inputClass} placeholder="Clinic ID" value={filters.clinic_id || ""} onChange={(event) => setFilters((current) => ({ ...current, clinic_id: event.target.value }))} /></label>
        <label><span className="sr-only">Doctor ID</span><input type="number" min="1" className={inputClass} placeholder="Doctor ID" value={filters.doctor_id || ""} onChange={(event) => setFilters((current) => ({ ...current, doctor_id: event.target.value }))} /></label>
        <label><span className="sr-only">From date</span><input type="date" className={inputClass} value={filters.from || ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label><span className="sr-only">To date</span><input type="date" className={inputClass} value={filters.to || ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <button className={`${buttonClass} sm:col-span-2 xl:col-span-5`} type="submit">Apply filters</button>
      </form>
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading appointments..." /> : rows.length === 0 ? <EmptyState title="No appointments found" description="No appointment data matches the selected filters." /> : (
        <div className="overflow-x-auto" role="region" aria-label="Audit log results, horizontally scrollable table" tabIndex={0}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Appointment</th><th className="px-3 py-3">Clinic</th><th className="px-3 py-3">Doctor</th><th className="px-3 py-3">Service</th><th className="px-3 py-3">Patient reference</th><th className="px-3 py-3">Schedule</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id}><td className="px-3 py-3 font-semibold">#{row.id}</td><td className="px-3 py-3">{row.clinic_name}</td><td className="px-3 py-3">{row.doctor_name}<span className="block text-xs text-slate-500">{row.specialty}</span></td><td className="px-3 py-3">{row.service_name}</td><td className="px-3 py-3">Patient #{row.patient_id}</td><td className="px-3 py-3">{formatDate(row.starts_at)}</td><td className="px-3 py-3"><StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge></td></tr>)}</tbody>
          </table>
          <AdminPagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 30 };
      Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
      const response = await getAdminAuditLogs(params);
      setEvents(response.data?.data?.events || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load audit history."));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  return (
    <section className={panelClass}>
      <PageTitle title="Audit logs" description="Immutable administrative and security history. This interface is read-only." />
      <form className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(""); setPage(1); setReload((current) => current + 1); }}>
        <label><span className="sr-only">Actor user ID</span><input type="number" min="1" className={inputClass} placeholder="Actor user ID" value={filters.actor_id || ""} onChange={(event) => setFilters((current) => ({ ...current, actor_id: event.target.value }))} /></label>
        <label><span className="sr-only">Action</span><input className={inputClass} placeholder="Action contains..." value={filters.action || ""} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} /></label>
        <label><span className="sr-only">Resource type</span><input className={inputClass} placeholder="Resource (e.g. clinics)" value={filters.entity || ""} onChange={(event) => setFilters((current) => ({ ...current, entity: event.target.value }))} /></label>
        <label><span className="sr-only">From date</span><input type="date" className={inputClass} value={filters.from || ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label><span className="sr-only">To date</span><input type="date" className={inputClass} value={filters.to || ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <button type="submit" className={`${buttonClass} sm:col-span-2 xl:col-span-5`}>Apply filters</button>
      </form>
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading audit events..." /> : events.length === 0 ? <EmptyState title="No audit events found" description="The audit log is empty for these filters." /> : (
        <div className="space-y-3">{events.map((event) => (
          <article key={event.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div><h3 className="font-semibold text-slate-900">{humanize(event.action)}</h3><p className="text-sm text-slate-600">{event.actor_name || "Deleted account"} · {humanize(event.actor_role || "unknown role")} · {event.entity} {event.entity_id ? `#${event.entity_id}` : ""}</p></div>
              <time className="shrink-0 text-xs text-slate-500" dateTime={event.created_at}>{formatDate(event.created_at)}</time>
            </div>
            {event.details && Object.keys(event.details).length > 0 && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{JSON.stringify(event.details, null, 2)}</pre>}
          </article>
        ))}<AdminPagination pagination={pagination} onPageChange={setPage} /></div>
      )}
    </section>
  );
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await getAdminNotifications({ page, limit: 25 });
      setNotifications(response.data?.data?.notifications || []);
      setPagination(response.data?.data?.pagination || null);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  const markRead = async (notificationId) => {
    setError("");
    try {
      await markAdminNotificationRead(notificationId);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to mark the notification as read."));
    }
  };

  return (
    <section className={panelClass}>
      <PageTitle title="Notifications" description="Notifications addressed to your authenticated administrator account. This page does not send notifications." />
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(""); setReload((current) => current + 1); }} className="mb-4" />}
      {loading ? <LoadingState label="Loading notifications..." /> : notifications.length === 0 ? <EmptyState title="No notifications" description="There are no notifications for this account." /> : (
        <div className="space-y-3">{notifications.map((notification) => (
          <article key={notification.id} className={`rounded-xl border p-4 ${notification.is_read ? "border-slate-200" : "border-teal-200 bg-teal-50/50"}`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div><div className="flex items-center gap-2"><h3 className="font-semibold text-slate-900">{notification.title}</h3><StatusBadge tone={notification.is_read ? "slate" : "blue"}>{notification.is_read ? "read" : "unread"}</StatusBadge></div><p className="mt-1 text-sm text-slate-600">{notification.message}</p><p className="mt-2 text-xs capitalize text-slate-500">{humanize(notification.type)} · {formatDate(notification.created_at)}</p></div>
              {!notification.is_read && <button type="button" className={buttonClass} onClick={() => markRead(notification.id)}>Mark as read</button>}
            </div>
          </article>
        ))}<AdminPagination pagination={pagination} onPageChange={setPage} /></div>
      )}
    </section>
  );
}

export function UnsupportedAdminFeature({ title }) {
  return (
    <section className={panelClass}>
      <PageTitle title={title} description="This capability is not configured in the current application data model." />
      <EmptyState
        title="No global service-category model exists"
        description="Services currently belong to individual clinics; there is no platform-wide category table, category API, or category authorization workflow. Adding categories safely requires a product decision about their relationship to clinic services."
      />
    </section>
  );
}
