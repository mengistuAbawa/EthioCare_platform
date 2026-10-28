import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
            <CalendarClock size={24} />
          </div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{user?.full_name || "Doctor"}</h2>
          <p className="mt-1 text-sm text-slate-500">Role: {user?.role}</p>
          <Link to="/doctor/profile" className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Manage professional profile
          </Link>
          <div>
            <Link to="/doctor/assessments" className="mt-3 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white">
              Open assessment inbox
            </Link>
          </div>
        </div>
    </div>
  );
}
