const test = require("node:test");
const assert = require("node:assert/strict");
const {
  hasRolePermission,
  clinicIdsConflict,
} = require("../src/services/clinicAuthorizationService");

test("system administrators have explicit platform-wide permission", () => {
  assert.equal(hasRolePermission("system_admin", "clinic.manage"), true);
});

test("clinic administrators are limited to clinic management permissions", () => {
  assert.equal(hasRolePermission("clinic_admin", "clinic.manage"), true);
  assert.equal(hasRolePermission("clinic_admin", "assessments.manage_assigned"), false);
});

test("doctors receive only assigned-work permissions", () => {
  assert.equal(hasRolePermission("doctor", "assessments.manage_assigned"), true);
  assert.equal(hasRolePermission("doctor", "staff.manage"), false);
});

test("receptionists receive appointment and patient clinic permissions only", () => {
  assert.equal(hasRolePermission("receptionist", "appointments.manage"), true);
  assert.equal(hasRolePermission("receptionist", "clinic.manage"), false);
});

test("patients receive only owner-owned permissions", () => {
  assert.equal(hasRolePermission("patient", "appointments.read_own"), true);
  assert.equal(hasRolePermission("patient", "appointments.manage_assigned"), false);
});

test("cross-clinic IDs are rejected by tenant comparison", () => {
  assert.equal(clinicIdsConflict(101, 101), false);
  assert.equal(clinicIdsConflict(101, 202), true);
  assert.equal(clinicIdsConflict(101, 0), true);
  assert.equal(clinicIdsConflict(Number.NaN, 101), true);
});
