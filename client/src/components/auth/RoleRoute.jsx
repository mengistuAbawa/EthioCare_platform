import { Navigate } from "react-router-dom";
import AccessDenied from "./AccessDenied";
import { useAuth } from "../../context/useAuth";
import LoadingState from "../dashboard/LoadingState";

export default function RoleRoute({ allowedRoles, children, fallbackPath = "/login" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4">
        <LoadingState label="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!allowedRoles.includes(user.role)) return <AccessDenied />;

  return children;
}
