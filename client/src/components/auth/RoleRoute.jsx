import { Navigate } from "react-router-dom";
import AccessDenied from "./AccessDenied";
import { useAuth } from "../../context/useAuth";

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

  if (!allowedRoles.includes(user.role)) return <AccessDenied />;

  return children;
}
