const ROLE_PERMISSIONS = Object.freeze({
  system_admin: new Set(["*"]),
  clinic_admin: new Set([
    "clinic.manage", "staff.manage", "doctors.manage", "doctors.read", "appointments.manage",
    "patients.read", "assessments.read",
  ]),
  doctor: new Set([
    "appointments.read_assigned", "appointments.manage_assigned",
    "patients.read_assigned", "assessments.read_assigned", "assessments.manage_assigned",
  ]),
  receptionist: new Set(["appointments.manage", "patients.read", "doctors.read"]),
  patient: new Set(["appointments.read_own", "assessments.read_own", "assessments.manage_own"]),
});

const hasRolePermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && (permissions.has("*") || permissions.has(permission)));
};

const clinicIdsConflict = (authorizedClinicId, requestedClinicId) => {
  if (!Number.isSafeInteger(authorizedClinicId) || !Number.isSafeInteger(requestedClinicId)) return true;
  return authorizedClinicId !== requestedClinicId;
};

module.exports = { ROLE_PERMISSIONS, hasRolePermission, clinicIdsConflict };
