import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleRoute({ allowedRoles, children, fallbackPath = "/login" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectMap = {
      system_admin: "/admin/dashboard",
      clinic_admin: "/clinic/dashboard",
      doctor: "/doctor/dashboard",
      receptionist: "/reception/dashboard",
      patient: "/patient/dashboard",
    };

    const destination = redirectMap[user.role] || "/login";
    return <Navigate to={destination} replace />;
  }

  return children;
}
