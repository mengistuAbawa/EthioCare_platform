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
  const [workspaceTab, setWorkspaceTab] = useState("profile");
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
    setWorkspaceTab("profile");
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
    <main className="doctor-management">
      <PageHeader
        title="Doctor management"
        description={canManage
          ? "Create doctor accounts, maintain profiles, and control clinic assignments."
          : "Browse the doctor profiles assigned to your clinic."}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} className="doctor-alert" />
      ) : null}
      {notice ? (
        <p className="doctor-notice" role="status">{notice}</p>
      ) : null}

      <section className="doctor-summary" aria-label="Doctor summary">
        <div>
          <span className="doctor-summary-label">Clinic doctors</span>
          <strong>{doctors.length}</strong>
        </div>
        <div>
          <span className="doctor-summary-label">Available now</span>
          <strong>{doctors.filter((doctor) => doctor.is_active && doctor.is_available).length}</strong>
        </div>
        <div>
          <span className="doctor-summary-label">Approved profiles</span>
          <strong>{doctors.filter((doctor) => doctor.is_profile_approved).length}</strong>
        </div>
      </section>

      <div className="doctor-layout">
        <aside className="doctor-directory" aria-label="Clinic doctor directory">
          <div className="doctor-directory-header">
            <div>
              <span className="doctor-section-kicker">Directory</span>
              <h2>Clinic doctors</h2>
            </div>
            <span className="doctor-count">{visibleDoctors.length}</span>
          </div>
          <SearchInput
            label="Search clinic doctors"
            value={doctorSearch}
            onChange={(event) => setDoctorSearch(event.target.value)}
            placeholder="Search name or specialty"
            className="doctor-search"
          />
          {loading ? (
            <LoadingState label="Loading clinic doctors..." />
          ) : visibleDoctors.length ? (
            <ul className="doctor-list">
              {visibleDoctors.map((doctor) => {
                const isSelected = String(doctor.id) === String(selectedId);
                return (
                  <li key={doctor.id}>
                    <button
                      type="button"
                      onClick={() => selectDoctor(doctor)}
                      aria-pressed={isSelected}
                      className={`doctor-row ${isSelected ? "is-selected" : ""}`}
                    >
                      <span className="doctor-avatar" aria-hidden="true">
                        <CircleUserRound size={22} />
                      </span>
                      <span className="doctor-row-main">
                        <strong>{doctor.name}</strong>
                        <span>{doctor.specialty || "Specialty not set"}</span>
                        {canManage && doctor.email ? <small>{doctor.email}</small> : null}
                      </span>
                      <span className={`doctor-state ${doctor.is_active && doctor.is_available ? "available" : ""}`}>
                        {doctor.is_active ? (doctor.is_available ? "Available" : "Unavailable") : "Inactive"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="doctor-empty">
              {doctorSearch ? "No doctors match this search." : "No doctor profiles are assigned to this clinic yet."}
            </div>
          )}
        </aside>

        <section className="doctor-workspace">
          {canManage ? (
            <div className="doctor-add-actions">
              <details className="doctor-action-card">
                <summary>
                  <span className="doctor-action-icon"><Plus size={18} /></span>
                  <span>
                    <strong>Link existing doctor</strong>
                    <small>Allocate an existing account</small>
                  </span>
                </summary>
                <form onSubmit={submitCreate} className="doctor-form-grid">
                  <label className="doctor-field doctor-span-2">
                    Active doctor account
                    <select required name="user_id" value={createForm.user_id} onChange={updateCreateForm}>
                      <option value="">Select an unassigned account</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.full_name} ({candidate.email})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="doctor-field">
                    Specialty
                    <input required minLength="2" maxLength="120" name="specialty" value={createForm.specialty} onChange={updateCreateForm} />
                  </label>
                  <label className="doctor-field">
                    License number
                    <input required minLength="2" maxLength="120" name="license_number" value={createForm.license_number} onChange={updateCreateForm} />
                  </label>
                  <label className="doctor-field doctor-span-2">
                    Qualifications
                    <textarea maxLength="2000" rows="2" name="qualifications" value={createForm.qualifications} onChange={updateCreateForm} />
                  </label>
                  <label className="doctor-field">
                    Consultation fee (ETB)
                    <input required min="0" step="0.01" type="number" name="consultation_fee" value={createForm.consultation_fee} onChange={updateCreateForm} />
                  </label>
                  <div className="doctor-form-action">
                    <Button type="submit" disabled={submitting || !candidates.length} loading={submitting}>
                      {submitting ? "Saving..." : "Allocate doctor"}
                    </Button>
                  </div>
                  {!candidates.length ? (
                    <p className="doctor-warning doctor-span-2">No unassigned active doctor accounts are available to link.</p>
                  ) : null}
                </form>
              </details>

              <details className="doctor-action-card">
                <summary>
                  <span className="doctor-action-icon"><Plus size={18} /></span>
                  <span>
                    <strong>Create new doctor</strong>
                    <small>Add account and profile</small>
                  </span>
                </summary>
                <form onSubmit={submitDoctorAccount} className="doctor-form-grid">
                  {[
                    ["full_name", "Full name", "text", ""],
                    ["email", "Email address", "email", ""],
                    ["phone", "Phone number", "tel", ""],
                    ["password", "Initial password", "password", ""],
                    ["specialty", "Specialty", "text", ""],
                    ["license_number", "License number", "text", ""],
                    ["consultation_fee", "Consultation fee (ETB)", "number", "0"],
                  ].map(([name, label, type, placeholder]) => (
                    <label key={name} className="doctor-field">
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
                      />
                    </label>
                  ))}
                  <label className="doctor-field doctor-span-2">
                    Qualifications
                    <textarea maxLength="2000" rows="2" name="qualifications" value={accountForm.qualifications} onChange={updateAccountForm} />
                  </label>
                  <div className="doctor-form-action doctor-span-2">
                    <Button type="submit" loading={submitting} disabled={submitting}>Create doctor account</Button>
                  </div>
                </form>
              </details>
            </div>
          ) : null}

          {selectedDoctor && canManage ? (
            <Card className="doctor-profile-panel" as="section">
              <header className="doctor-profile-header">
                <div className="doctor-profile-person">
                  <span className="doctor-avatar doctor-avatar-large" aria-hidden="true"><CircleUserRound size={28} /></span>
                  <div>
                    <span className="doctor-section-kicker">Selected doctor</span>
                    <h2>{selectedDoctor.name}</h2>
                    <p>{selectedDoctor.specialty || "Specialty not set"}</p>
                  </div>
                </div>
                <StatusBadge
                  status={selectedDoctor.is_profile_approved ? "approved" : "pending"}
                  label={selectedDoctor.is_profile_approved ? "Profile approved" : "Awaiting review"}
                />
              </header>

              <nav className="doctor-tabs" aria-label="Doctor management sections">
                {[
                  ["profile", "Profile"],
                  ["services", "Services"],
                  ["security", "Password"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={workspaceTab === id ? "active" : ""}
                    aria-current={workspaceTab === id ? "page" : undefined}
                    onClick={() => setWorkspaceTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {workspaceTab === "profile" ? (
                <form onSubmit={submitProfile} className="doctor-tab-content doctor-form-grid">
                  {profileFields.map(([name, label]) => (
                    <label key={name} className={`doctor-field ${name === "qualifications" ? "doctor-span-2" : ""}`}>
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
                      />
                    </label>
                  ))}
                  <div className="doctor-toggle-grid doctor-span-2">
                    <label><input type="checkbox" name="is_available" checked={Boolean(editForm.is_available)} onChange={updateEditForm} /><span><strong>Available to patients</strong><small>Show as bookable</small></span></label>
                    <label><input type="checkbox" name="is_active" checked={Boolean(editForm.is_active)} onChange={updateEditForm} /><span><strong>Active assignment</strong><small>Keep allocated to clinic</small></span></label>
                    {!selectedDoctor.is_profile_approved ? (
                      <label><input type="checkbox" name="is_profile_approved" checked={Boolean(editForm.is_profile_approved)} onChange={updateEditForm} /><span><strong>Approve public profile</strong><small>Confirm reviewed details</small></span></label>
                    ) : null}
                  </div>
                  <div className="doctor-profile-actions doctor-span-2">
                    <Button type="submit" loading={submitting}>Save profile</Button>
                    <Button type="button" variant="danger" disabled={submitting || !selectedDoctor.is_active} onClick={removeAssignment}>
                      <UserRoundX size={17} /> Delete assignment
                    </Button>
                  </div>
                </form>
              ) : null}

              {workspaceTab === "services" ? (
                <form onSubmit={submitServices} className="doctor-tab-content">
                  <div className="doctor-tab-heading">
                    <div>
                      <span className="doctor-section-kicker">Clinic allocation</span>
                      <h3>Services</h3>
                    </div>
                    <span>{selectedServices.length} selected</span>
                  </div>
                  {services.length ? (
                    <div className="doctor-service-grid">
                      {services.map((service) => (
                        <label key={service.id} className={!service.service_is_active ? "disabled" : ""}>
                          <input
                            type="checkbox"
                            disabled={!service.service_is_active}
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                          />
                          <span>
                            <strong>{service.name}</strong>
                            <small>{service.duration_minutes} min · {service.fee} ETB{!service.service_is_active ? " · Inactive" : ""}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="doctor-empty">No clinic services are configured yet.</div>
                  )}
                  <div className="doctor-profile-actions">
                    <Button type="submit" disabled={submitting || !selectedDoctor.is_active} loading={submitting}>Save service assignments</Button>
                  </div>
                </form>
              ) : null}

              {workspaceTab === "security" ? (
                <form onSubmit={submitPasswordReset} className="doctor-tab-content">
                  <div className="doctor-security-heading">
                    <span><KeyRound size={20} /></span>
                    <div>
                      <h3>Reset doctor password</h3>
                      <p>Set a secure new password with at least 12 characters.</p>
                    </div>
                  </div>
                  <div className="doctor-form-grid">
                    <label className="doctor-field">
                      New password
                      <input required type="password" minLength={12} autoComplete="new-password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} />
                    </label>
                    <label className="doctor-field">
                      Confirm new password
                      <input required type="password" minLength={12} autoComplete="new-password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} />
                    </label>
                    <div className="doctor-form-action doctor-span-2">
                      <Button type="submit" variant="secondary" loading={submitting} disabled={submitting}>Reset password</Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </Card>
          ) : selectedDoctor ? (
            <Card className="doctor-profile-panel" as="section">
              <div className="doctor-profile-person">
                <span className="doctor-avatar doctor-avatar-large"><CircleUserRound size={28} /></span>
                <div><span className="doctor-section-kicker">Doctor profile</span><h2>{selectedDoctor.name}</h2><p>{selectedDoctor.specialty}</p></div>
              </div>
              {selectedDoctor.qualifications ? <p className="doctor-qualifications">{selectedDoctor.qualifications}</p> : null}
            </Card>
          ) : (
            <div className="doctor-selection-empty">
              <span><Stethoscope size={24} /></span>
              <h2>Select a doctor</h2>
              <p>Choose a doctor from the directory to {canManage ? "edit their profile, services, or password." : "view their clinic profile."}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
