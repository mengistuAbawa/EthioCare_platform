import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import PublicLayout from "./components/public/PublicLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PublicHome from "./pages/public/PublicHome";
import SystemAdminDashboard from "./pages/dashboard/SystemAdminDashboard";
import ClinicAdminDashboard from "./pages/dashboard/ClinicAdminDashboard";
import DoctorPortalPage from "./pages/doctor/DoctorPortalPage";
import ReceptionPortalPage from "./pages/dashboard/ReceptionPortalPage";
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
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import { PlatformAnalyticsPage } from "./pages/dashboard/SystemAdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/about" element={<PublicHome initialSection="about" />} />
          <Route path="/how-it-works" element={<PublicHome initialSection="how-it-works" />} />
          <Route path="/services" element={<PublicHome initialSection="services" />} />
          <Route path="/for-patients" element={<PublicHome initialSection="for-patients" />} />
          <Route path="/for-doctors" element={<PublicHome initialSection="for-doctors" />} />
          <Route path="/for-clinics" element={<PublicHome initialSection="for-clinics" />} />
          <Route path="/help" element={<PublicHome initialSection="faq" />} />
          <Route path="/contact" element={<PublicHome initialSection="contact" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PublicLayout />}>
            <Route path="/clinics" element={<ClinicDirectory />} />
            <Route path="/clinic/:id" element={<ClinicDetails />} />
            <Route path="/doctors" element={<DoctorDirectory />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />
          </Route>
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
              element={<RoleRoute allowedRoles={["system_admin"]}><SystemSettingsPage /></RoleRoute>}
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
              path="/patient/assessment/:assessmentId/edit"
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
                  <DoctorPortalPage page="dashboard" />
                </RoleRoute>
              }
            />
            <Route path="/doctor/schedule" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="schedule" /></RoleRoute>} />
            <Route path="/doctor/appointments" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="appointments" /></RoleRoute>} />
            <Route path="/doctor/patients" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="patients" /></RoleRoute>} />
            <Route path="/doctor/medical-files" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="files" /></RoleRoute>} />
            <Route path="/doctor/lab-results" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="labs" /></RoleRoute>} />
            <Route path="/doctor/clinical-notes" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="notes" /></RoleRoute>} />
            <Route path="/doctor/medical-records" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="records" /></RoleRoute>} />
            <Route path="/doctor/consultations" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="consultations" /></RoleRoute>} />
            <Route path="/doctor/prescriptions-care-plans" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="treatment" /></RoleRoute>} />
            <Route path="/doctor/follow-ups" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="followups" /></RoleRoute>} />
            <Route path="/doctor/services" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="services" /></RoleRoute>} />
            <Route path="/doctor/notifications" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="notifications" /></RoleRoute>} />
            <Route path="/doctor/settings" element={<RoleRoute allowedRoles={["doctor"]}><DoctorPortalPage page="settings" /></RoleRoute>} />
            <Route
              path="/reception/dashboard"
              element={
                <RoleRoute allowedRoles={["receptionist"]}>
                  <Navigate to="/receptionist/dashboard" replace />
                </RoleRoute>
              }
            />
            <Route
              path="/receptionist/dashboard"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="dashboard" /></RoleRoute>}
            />
            <Route
              path="/receptionist/appointments"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="appointments" /></RoleRoute>}
            />
            <Route
              path="/receptionist/appointments/today"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="appointments" /></RoleRoute>}
            />
            <Route
              path="/receptionist/booking"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="booking" /></RoleRoute>}
            />
            <Route
              path="/receptionist/appointments/register"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="booking" /></RoleRoute>}
            />
            <Route
              path="/receptionist/patients"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="patients" /></RoleRoute>}
            />
            <Route
              path="/receptionist/register-patient"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="patient-registration" /></RoleRoute>}
            />
            <Route
              path="/receptionist/patients/register"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="patient-registration" /></RoleRoute>}
            />
            <Route
              path="/receptionist/check-in-out"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="check-in-out" /></RoleRoute>}
            />
            <Route
              path="/receptionist/doctors-services"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="doctors-services" /></RoleRoute>}
            />
            <Route
              path="/receptionist/doctor-availability"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="doctor-availability" /></RoleRoute>}
            />
            <Route
              path="/receptionist/services"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="services" /></RoleRoute>}
            />
            <Route
              path="/receptionist/queue"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="queue" /></RoleRoute>}
            />
            <Route
              path="/receptionist/notifications"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="notifications" /></RoleRoute>}
            />
            <Route
              path="/receptionist/settings"
              element={<RoleRoute allowedRoles={["receptionist"]}><ReceptionPortalPage page="settings" /></RoleRoute>}
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