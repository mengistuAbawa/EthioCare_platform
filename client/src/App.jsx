import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SystemAdminDashboard from "./pages/dashboard/SystemAdminDashboard";
import ClinicAdminDashboard from "./pages/dashboard/ClinicAdminDashboard";
import DoctorDashboard from "./pages/dashboard/DoctorDashboard";
import ReceptionDashboard from "./pages/dashboard/ReceptionDashboard";
import PatientDashboard from "./pages/dashboard/PatientDashboard";
import ClinicDirectory from "./pages/clinics/ClinicDirectory";
import ClinicDetails from "./pages/clinics/ClinicDetails";
import DoctorDirectory from "./pages/doctors/DoctorDirectory";
import DoctorDetails from "./pages/doctors/DoctorDetails";
import DoctorManagement from "./pages/clinic/DoctorManagement";
import ClinicAdminToolsPage from "./pages/clinic/ClinicAdminToolsPage";
import MyDoctorProfile from "./pages/doctor/MyDoctorProfile";
import HealthAssessment from "./pages/patient/HealthAssessment";
import AssessmentHistory from "./pages/patient/AssessmentHistory";
import PatientAssessmentDetails from "./pages/patient/AssessmentDetails";
import AssessmentInbox from "./pages/doctor/AssessmentInbox";
import AssessmentReview from "./pages/doctor/AssessmentReview";
import PatientAppointmentsPage from "./pages/patient/PatientAppointmentsPage";
import {
  PatientNotificationsPage,
  PatientPortalFeaturePage,
} from "./pages/patient/PatientPortalPages";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AccountProfile from "./pages/account/AccountProfile";
import {
  AppointmentsOverviewPage,
  AuditLogsPage,
  ClinicDetailPage,
  ClinicManagementPage,
  ClinicVerificationPage,
  NotificationsPage,
  UnsupportedAdminFeature,
  UserManagementPage,
} from "./pages/admin/SystemAdminPages";
import { PlatformAnalyticsPage } from "./pages/dashboard/SystemAdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/clinics" element={<ClinicDirectory />} />
          <Route path="/clinic/:id" element={<ClinicDetails />} />
          <Route path="/doctors" element={<DoctorDirectory />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/account/profile" element={<AccountProfile />} />
            <Route
              path="/patient/clinics"
              element={<RoleRoute allowedRoles={["patient"]}><ClinicDirectory portal /></RoleRoute>}
            />
            <Route
              path="/patient/clinics/:id"
              element={<RoleRoute allowedRoles={["patient"]}><ClinicDetails portal /></RoleRoute>}
            />
            <Route
              path="/patient/doctors"
              element={<RoleRoute allowedRoles={["patient"]}><DoctorDirectory portal /></RoleRoute>}
            />
            <Route
              path="/patient/doctors/:id"
              element={<RoleRoute allowedRoles={["patient"]}><DoctorDetails portal /></RoleRoute>}
            />
            <Route
              path="/patient/services"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="services" /></RoleRoute>}
            />
            <Route
              path="/patient/book-appointment"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="book-appointment" /></RoleRoute>}
            />
            <Route
              path="/patient/appointments"
              element={<RoleRoute allowedRoles={["patient"]}><PatientAppointmentsPage /></RoleRoute>}
            />
            <Route
              path="/patient/appointment-history"
              element={<RoleRoute allowedRoles={["patient"]}><PatientAppointmentsPage history /></RoleRoute>}
            />
            <Route
              path="/patient/medical-files"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="medical-files" /></RoleRoute>}
            />
            <Route
              path="/patient/lab-results"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="lab-results" /></RoleRoute>}
            />
            <Route
              path="/patient/medical-records"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="medical-records" /></RoleRoute>}
            />
            <Route
              path="/patient/consultations"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="consultations" /></RoleRoute>}
            />
            <Route
              path="/patient/notifications"
              element={<RoleRoute allowedRoles={["patient"]}><PatientNotificationsPage /></RoleRoute>}
            />
            <Route
              path="/patient/health-profile"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="health-profile" /></RoleRoute>}
            />
            <Route
              path="/patient/settings"
              element={<RoleRoute allowedRoles={["patient"]}><PatientPortalFeaturePage feature="settings" /></RoleRoute>}
            />
            <Route
              path="/clinic/admin/:feature"
              element={<RoleRoute allowedRoles={["clinic_admin"]}><ClinicAdminToolsPage /></RoleRoute>}
            />
            <Route
              path="/admin/clinics"
              element={<RoleRoute allowedRoles={["system_admin"]}><ClinicManagementPage /></RoleRoute>}
            />
            <Route
              path="/admin/clinic-status"
              element={<RoleRoute allowedRoles={["system_admin"]}><ClinicManagementPage view="status" /></RoleRoute>}
            />
            <Route
              path="/admin/clinics/:clinicId"
              element={<RoleRoute allowedRoles={["system_admin"]}><ClinicDetailPage /></RoleRoute>}
            />
            <Route
              path="/admin/verification"
              element={<RoleRoute allowedRoles={["system_admin"]}><ClinicVerificationPage /></RoleRoute>}
            />
            <Route
              path="/admin/users"
              element={<RoleRoute allowedRoles={["system_admin"]}><UserManagementPage /></RoleRoute>}
            />
            <Route
              path="/admin/doctors"
              element={<RoleRoute allowedRoles={["system_admin"]}><UserManagementPage mode="doctor" /></RoleRoute>}
            />
            <Route
              path="/admin/staff"
              element={<RoleRoute allowedRoles={["system_admin"]}><UserManagementPage mode="staff" /></RoleRoute>}
            />
            <Route
              path="/admin/appointments"
              element={<RoleRoute allowedRoles={["system_admin"]}><AppointmentsOverviewPage /></RoleRoute>}
            />
            <Route
              path="/admin/service-categories"
              element={<RoleRoute allowedRoles={["system_admin"]}><UnsupportedAdminFeature title="Service Oversight" /></RoleRoute>}
            />
            <Route
              path="/admin/notifications"
              element={<RoleRoute allowedRoles={["system_admin"]}><NotificationsPage /></RoleRoute>}
            />
            <Route
              path="/admin/analytics"
              element={<RoleRoute allowedRoles={["system_admin"]}><PlatformAnalyticsPage /></RoleRoute>}
            />
            <Route
              path="/admin/audit-logs"
              element={<RoleRoute allowedRoles={["system_admin"]}><AuditLogsPage /></RoleRoute>}
            />
            <Route
              path="/admin/settings"
              element={<RoleRoute allowedRoles={["system_admin"]}><UnsupportedAdminFeature title="System Settings" /></RoleRoute>}
            />
            <Route
              path="/clinic/:clinicId/doctors"
              element={
                <RoleRoute allowedRoles={["system_admin", "clinic_admin", "receptionist"]}>
                  <DoctorManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <RoleRoute allowedRoles={["doctor"]}>
                  <MyDoctorProfile />
                </RoleRoute>
              }
            />
            <Route
              path="/patient/assessment/new"
              element={
                <RoleRoute allowedRoles={["patient"]}>
                  <HealthAssessment />
                </RoleRoute>
              }
            />
            <Route
              path="/patient/assessments"
              element={
                <RoleRoute allowedRoles={["patient"]}>
                  <AssessmentHistory />
                </RoleRoute>
              }
            />
            <Route
              path="/patient/assessments/:assessmentId"
              element={
                <RoleRoute allowedRoles={["patient"]}>
                  <PatientAssessmentDetails />
                </RoleRoute>
              }
            />
            <Route
              path="/doctor/assessments"
              element={
                <RoleRoute allowedRoles={["doctor"]}>
                  <AssessmentInbox />
                </RoleRoute>
              }
            />
            <Route
              path="/doctor/assessments/:assessmentId"
              element={
                <RoleRoute allowedRoles={["doctor"]}>
                  <AssessmentReview />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={["system_admin"]}>
                  <SystemAdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/clinic/dashboard"
              element={
                <RoleRoute allowedRoles={["clinic_admin"]}>
                  <ClinicAdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/doctor/dashboard"
              element={
                <RoleRoute allowedRoles={["doctor"]}>
                  <DoctorDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/reception/dashboard"
              element={
                <RoleRoute allowedRoles={["receptionist"]}>
                  <ReceptionDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/patient/dashboard"
              element={
                <RoleRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </RoleRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}