import { useEffect, useMemo, useState } from "react";
import { CircleUserRound, KeyRound, Plus, Stethoscope, UserRoundX } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import ErrorState from "../../components/dashboard/ErrorState";
import LoadingState from "../../components/dashboard/LoadingState";
import { Button, Card, PageHeader, SearchInput, StatusBadge } from "../../components/ui/Primitives";
import {
  createDoctorProfile,
  createDoctorAccount,
  deactivateClinicDoctor,
  getClinicDoctorServices,
  getClinicDoctors,
  getDoctorCandidates,
  updateClinicDoctor,
  updateClinicDoctorServices,
  resetDoctorPassword,
} from "../../services/doctorService";

const initialCreateForm = {
  user_id: "",
  specialty: "",
  qualifications: "",
  license_number: "",
  consultation_fee: "0",
};

const initialAccountForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  specialty: "",
  qualifications: "",
  license_number: "",
  consultation_fee: "0",
};

const profileFields = [
  ["specialty", "Specialty"],
  ["qualifications", "Qualifications"],
  ["license_number", "License number"],
  ["consultation_fee", "Consultation fee (ETB)"],
];

export default function DoctorManagement() {
  const { clinicId } = useParams();
  const { user } = useAuth();
  const canManage = ["clinic_admin", "receptionist"].includes(user?.role);
  const [doctors, setDoctors] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [passwordForm, setPasswordForm] = useState({ new_password: "", confirm_password: "" });
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === String(selectedId)),
    [doctors, selectedId]
  );
  const visibleDoctors = useMemo(() => {
    const search = doctorSearch.trim().toLowerCase();
    if (!search) return doctors;
    return doctors.filter((doctor) =>
      `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(search)
    );
  }, [doctorSearch, doctors]);
  const [editForm, setEditForm] = useState({});
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const doctorResponse = await getClinicDoctors(clinicId);
      const candidateResponse = canManage ? await getDoctorCandidates(clinicId) : null;
      const nextDoctors = doctorResponse.data?.data?.doctors || [];
      setDoctors(nextDoctors);
      setCandidates(candidateResponse?.data?.data?.candidates || []);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load clinic doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchClinicDoctors = async () => {
      try {
        const doctorResponse = await getClinicDoctors(clinicId);
        const candidateResponse = canManage ? await getDoctorCandidates(clinicId) : null;
        if (!active) return;
        setDoctors(doctorResponse.data?.data?.doctors || []);
        setCandidates(candidateResponse?.data?.data?.candidates || []);
        setError("");
      } catch (loadError) {
        if (active) setError(loadError.response?.data?.message || "Unable to load clinic doctors.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchClinicDoctors();
    return () => {
      active = false;
    };
  }, [clinicId, canManage]);

  const selectDoctor = async (doctor) => {
    setSelectedId(String(doctor.id));
    setServices([]);
    setSelectedServices([]);
    setEditForm({
      specialty: doctor.specialty || "",
      qualifications: doctor.qualifications || "",
      license_number: doctor.license_number || "",
      consultation_fee: String(doctor.consultation_fee ?? 0),
      is_available: doctor.is_available,
      is_active: doctor.is_active,
      is_profile_approved: doctor.is_profile_approved,
    });

    if (!canManage) return;

    try {
      const response = await getClinicDoctorServices(clinicId, doctor.id);
      const nextServices = response.data?.data?.services || [];
      setServices(nextServices);
      setSelectedServices(
        nextServices
          .filter((service) => service.assignment_is_active && service.service_is_active)
          .map((service) => service.id)
      );
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load doctor services.");
    }
  };

  const updateCreateForm = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const updateAccountForm = (event) => {
    const { name, value } = event.target;
    setAccountForm((current) => ({ ...current, [name]: value }));
  };

  const updateEditForm = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const announce = (text) => {
    setNotice(text);
    setError("");
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await createDoctorProfile(clinicId, {
        ...createForm,
        user_id: Number(createForm.user_id),
        consultation_fee: Number(createForm.consultation_fee),
      });
      setCreateForm(initialCreateForm);
      announce("Doctor profile created. The clinic administrator has approved its public details.");
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the doctor profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDoctorAccount = async (event) => {
    event.preventDefault();
    if (accountForm.password.length < 12) {
      setError("The initial doctor password must be at least 12 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await createDoctorAccount(clinicId, {
        ...accountForm,
        consultation_fee: Number(accountForm.consultation_fee),
      });
      setAccountForm(initialAccountForm);
      announce("Doctor account created and allocated to this clinic.");
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the doctor account.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    if (!selectedDoctor) return;
    if (passwordForm.new_password.length < 12) {
      setError("The new password must be at least 12 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Password confirmation does not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await resetDoctorPassword(clinicId, selectedDoctor.id, passwordForm);
      setPasswordForm({ new_password: "", confirm_password: "" });
      announce("Doctor password reset successfully.");
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to reset the doctor password.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    if (!selectedDoctor) return;
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await updateClinicDoctor(clinicId, selectedDoctor.id, {
        specialty: editForm.specialty,
        qualifications: editForm.qualifications || null,
        license_number: editForm.license_number,
        consultation_fee: Number(editForm.consultation_fee),
        is_available: editForm.is_available,
        is_active: editForm.is_active,
        ...(editForm.is_profile_approved && !selectedDoctor.is_profile_approved
          ? { is_profile_approved: true }
          : {}),
      });
      announce("Doctor profile updated.");
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to update the doctor profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitServices = async (event) => {
    event.preventDefault();
    if (!selectedDoctor) return;
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await updateClinicDoctorServices(clinicId, selectedDoctor.id, selectedServices.map(Number));
      announce("Doctor service assignments updated.");
      await selectDoctor(selectedDoctor);
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to update doctor services.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAssignment = async () => {
    if (!selectedDoctor) return;
    const confirmed = window.confirm(
      `Delete ${selectedDoctor.name}'s clinic assignment? The doctor account and historical records will be preserved.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await deactivateClinicDoctor(clinicId, selectedDoctor.id);
      setSelectedId("");
      announce("Clinic assignment deactivated; doctor account and history were preserved.");
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to deactivate this assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices((current) => (
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    ));
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Doctors"
          description={canManage
            ? "Manage authorized doctor profiles and services for this clinic."
            : "Browse doctor information for your clinic."}
          className="mb-8"
        />

        {error ? (
          <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} className="mb-5" />
        ) : null}
        {notice ? <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status">{notice}</p> : null}

        <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card as="section">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Clinic doctors</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{doctors.length}</span>
            </div>
            <SearchInput
              label="Search clinic doctors"
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
              placeholder="Search name or specialty"
              className="mt-4"
            />
            {loading ? (
              <LoadingState label="Loading clinic doctors..." className="mt-4" />
            ) : visibleDoctors.length ? (
              <ul className="mt-4 space-y-3">
                {visibleDoctors.map((doctor) => (
                  <li key={doctor.id}>
                    <button
                      type="button"
                      onClick={() => selectDoctor(doctor)}
                      aria-pressed={String(doctor.id) === String(selectedId)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        String(doctor.id) === String(selectedId)
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <CircleUserRound className="mt-0.5 shrink-0 text-teal-700" size={20} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900">{doctor.name}</span>
                          <span className="mt-1 block text-sm text-slate-600">{doctor.specialty}</span>
                          {canManage && doctor.email ? (
                            <span className="mt-1 block truncate text-xs text-slate-500">{doctor.email}</span>
                          ) : null}
                        </span>
                        <StatusBadge
                          status={!doctor.is_active ? "inactive" : doctor.is_available ? "available" : "unavailable"}
                          label={!doctor.is_active ? "Inactive" : doctor.is_available ? "Available" : "Unavailable"}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {doctorSearch ? "No doctors match this search." : "No doctor profiles are assigned to this clinic yet."}
              </p>
            )}
          </Card>

          <div className="space-y-6">
            {canManage ? (
              <Card as="section">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Plus size={20} className="text-teal-700" /> Link existing doctor account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Allocate an existing active doctor account to this clinic.
                </p>
                <form onSubmit={submitCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Active doctor account
                    <select
                      required
                      name="user_id"
                      value={createForm.user_id}
                      onChange={updateCreateForm}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                    >
                      <option value="">Select an unassigned account</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.full_name} ({candidate.email})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Specialty
                    <input required minLength="2" maxLength="120" name="specialty" value={createForm.specialty} onChange={updateCreateForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    License number
                    <input required minLength="2" maxLength="120" name="license_number" value={createForm.license_number} onChange={updateCreateForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Qualifications
                    <textarea maxLength="2000" rows="2" name="qualifications" value={createForm.qualifications} onChange={updateCreateForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Consultation fee (ETB)
                    <input required min="0" step="0.01" type="number" name="consultation_fee" value={createForm.consultation_fee} onChange={updateCreateForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
                  </label>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={submitting || !candidates.length}
                      loading={submitting}
                      className="w-full"
                    >
                      {submitting ? "Saving..." : "Create doctor profile"}
                    </Button>
                  </div>
                  {!candidates.length ? (
                    <p className="text-sm text-amber-800 sm:col-span-2">
                      No unassigned active doctor accounts are available to link.
                    </p>
                  ) : null}
                </form>
              </Card>
            ) : null}

            {canManage ? (
              <Card as="section">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Plus size={20} className="text-teal-700" /> Add new doctor account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Create the login account and doctor profile, then allocate both to this clinic.
                </p>
                <form onSubmit={submitDoctorAccount} className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["full_name", "Full name", "text", ""],
                    ["email", "Email address", "email", ""],
                    ["phone", "Phone number", "tel", ""],
                    ["password", "Initial password", "password", ""],
                    ["specialty", "Specialty", "text", ""],
                    ["license_number", "License number", "text", ""],
                    ["consultation_fee", "Consultation fee (ETB)", "number", "0"],
                  ].map(([name, label, type, placeholder]) => (
                    <label key={name} className="text-sm font-medium text-slate-700">
                      {label}
                      <input
                        required={name !== "phone"}
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={accountForm[name]}
                        onChange={updateAccountForm}
                        minLength={["full_name", "specialty", "license_number"].includes(name) ? 2 : undefined}
                        maxLength={name === "email" ? 254 : 120}
                        min={name === "consultation_fee" ? 0 : undefined}
                        step={name === "consultation_fee" ? 0.01 : undefined}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                  ))}
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Qualifications
                    <textarea maxLength="2000" rows="2" name="qualifications" value={accountForm.qualifications} onChange={updateAccountForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
                  </label>
                  <Button type="submit" loading={submitting} disabled={submitting} className="sm:col-span-2">
                    Create doctor account
                  </Button>
                </form>
              </Card>
            ) : null}

            {selectedDoctor && canManage ? (
              <>
                <Card as="section">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">Professional profile and assignment status</p>
                    </div>
                    <StatusBadge
                      status={selectedDoctor.is_profile_approved ? "approved" : "pending"}
                      label={selectedDoctor.is_profile_approved ? "Public profile approved" : "Awaiting review"}
                    />
                  </div>

                  <form onSubmit={submitProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
                    {profileFields.map(([name, label]) => (
                      <label key={name} className="text-sm font-medium text-slate-700">
                        {label}
                        <input
                          required={name !== "qualifications"}
                          type={name === "consultation_fee" ? "number" : "text"}
                          min={name === "consultation_fee" ? "0" : undefined}
                          step={name === "consultation_fee" ? "0.01" : undefined}
                          maxLength={name === "qualifications" ? 2000 : 120}
                          name={name}
                          value={editForm[name] ?? ""}
                          onChange={updateEditForm}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                        />
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" name="is_available" checked={Boolean(editForm.is_available)} onChange={updateEditForm} />
                      Available to patients
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" name="is_active" checked={Boolean(editForm.is_active)} onChange={updateEditForm} />
                      Active clinic assignment
                    </label>
                    {!selectedDoctor.is_profile_approved ? (
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                        <input type="checkbox" name="is_profile_approved" checked={Boolean(editForm.is_profile_approved)} onChange={updateEditForm} />
                        I reviewed these public profile details
                      </label>
                    ) : null}
                    <Button
                      type="submit"
                      loading={submitting}
                    >
                      Save profile
                    </Button>
                  </form>
                  <form onSubmit={submitPasswordReset} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                        <KeyRound size={17} /> Reset doctor password
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">Set a new password with at least 12 characters.</p>
                    </div>
                    <label className="text-sm font-medium text-slate-700">
                      New password
                      <input
                        required
                        type="password"
                        minLength={12}
                        autoComplete="new-password"
                        value={passwordForm.new_password}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Confirm new password
                      <input
                        required
                        type="password"
                        minLength={12}
                        autoComplete="new-password"
                        value={passwordForm.confirm_password}
                        onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                    <Button type="submit" variant="secondary" loading={submitting} disabled={submitting}>
                      Reset password
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={submitting || !selectedDoctor.is_active}
                    onClick={removeAssignment}
                    className="mt-4"
                  >
                    <UserRoundX size={17} /> Delete doctor assignment
                  </Button>
                </Card>

                <Card as="section">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Stethoscope size={20} className="text-teal-700" /> Clinic services
                  </h2>
                  <form onSubmit={submitServices} className="mt-4">
                    {services.length ? (
                      <ul className="space-y-2">
                        {services.map((service) => (
                          <li key={service.id}>
                            <label className={`flex items-start gap-3 rounded-xl border p-3 ${
                              service.service_is_active ? "border-slate-200" : "border-slate-100 bg-slate-50 text-slate-400"
                            }`}>
                              <input
                                type="checkbox"
                                disabled={!service.service_is_active}
                                checked={selectedServices.includes(service.id)}
                                onChange={() => toggleService(service.id)}
                                className="mt-1"
                              />
                              <span>
                                <span className="block font-medium">{service.name}</span>
                                <span className="mt-0.5 block text-sm">
                                  {service.duration_minutes} min · {service.fee} ETB
                                  {!service.service_is_active ? " · Inactive" : ""}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No clinic services are configured yet.</p>
                    )}
                    <Button type="submit" variant="secondary" disabled={submitting || !selectedDoctor.is_active} loading={submitting} className="mt-4">
                      Save service assignments
                    </Button>
                  </form>
                </Card>
              </>
            ) : selectedDoctor ? (
              <Card as="section">
                <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                <p className="mt-2 text-teal-800">{selectedDoctor.specialty}</p>
                {selectedDoctor.qualifications ? <p className="mt-4 text-sm text-slate-600">{selectedDoctor.qualifications}</p> : null}
              </Card>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                Select a doctor to view {canManage ? "or manage" : ""} their clinic profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
