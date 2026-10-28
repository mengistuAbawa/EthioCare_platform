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
import MyDoctorProfile from "./pages/doctor/MyDoctorProfile";

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
          <Route
            path="/clinic/:clinicId/doctors"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["system_admin", "clinic_admin", "receptionist"]}>
                  <DoctorManagement />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["doctor"]}>
                  <MyDoctorProfile />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["system_admin"]}>
                  <SystemAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clinic/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["clinic_admin"]}>
                  <ClinicAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["doctor"]}>
                  <DoctorDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reception/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["receptionist"]}>
                  <ReceptionDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}