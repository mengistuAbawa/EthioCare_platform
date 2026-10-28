import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardHomeByRole, getDashboardPageTitle } from "../../config/dashboardNavigation";
import api from "../../services/api";
import { getMyDoctorProfile } from "../../services/doctorService";
import DashboardHeader from "./DashboardHeader";
import MobileSidebar from "./MobileSidebar";
import PageContainer from "./PageContainer";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clinicData, setClinicData] = useState({ role: "", status: "idle", clinics: [], doctor: null, error: "" });
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);
  const homePath = dashboardHomeByRole[user?.role];
  const title = getDashboardPageTitle(location.pathname, user?.role);
  const role = user?.role;
  const clinicRole = role === "clinic_admin" || role === "receptionist";
  const doctorRole = role === "doctor";
  const clinicDataIsCurrent = clinicData.role === role;
  const clinicContextData = clinicDataIsCurrent
    ? clinicData
    : { status: clinicRole || doctorRole ? "loading" : "idle", clinics: [], doctor: null, error: "" };
  const selectedClinicId = location.pathname.match(/^\/clinic\/([^/]+)\/doctors$/)?.[1];
  const selectedClinic = clinicContextData.clinics.find(
    (clinic) => String(clinic.id) === selectedClinicId
  );
  const clinicContext = doctorRole
    ? clinicContextData.doctor?.clinic_name ||
      (clinicContextData.status === "error" ? "Clinic context unavailable" :
        clinicContextData.status === "loading" ? "Loading clinic context..." : "No clinic assigned")
    : clinicRole
      ? selectedClinic?.name ||
        (selectedClinicId && clinicContextData.status === "success" ? "Clinic context unavailable" :
          clinicContextData.status === "error" ? "Clinic context unavailable" :
            clinicContextData.status === "loading" ? "Loading clinic context..." :
              clinicContextData.clinics.length === 1 ? clinicContextData.clinics[0].name :
                clinicContextData.clinics.length > 1 ? `${clinicContextData.clinics.length} clinics` : "No clinic assigned")
      : null;

  useEffect(() => {
    if (role !== "doctor" && role !== "clinic_admin" && role !== "receptionist") return undefined;
    let active = true;

    const request = role === "doctor"
      ? getMyDoctorProfile().then((response) => ({ doctor: response.data?.data?.doctor || null }))
      : api.get("/clinics/my/clinics").then((response) => ({
          clinics: response.data?.data?.clinics || [],
        }));

    request
      .then((data) => {
        if (active) setClinicData({
          role,
          status: "success",
          clinics: data.clinics || [],
          doctor: data.doctor || null,
          error: "",
        });
      })
      .catch((error) => {
        if (active) setClinicData({
          role,
          status: "error",
          clinics: [],
          doctor: null,
          error: error.response?.data?.message || "Unable to verify your clinic access.",
        });
      });

    return () => {
      active = false;
    };
  }, [role]);
  const breadcrumbs = homePath && location.pathname !== homePath
    ? [{ label: "Dashboard", to: homePath }, { label: title }]
    : [];

  useEffect(() => {
    if (!location.hash) return;

    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;

    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white transition-[width] motion-reduce:transition-none lg:flex ${
          collapsed ? "w-[76px]" : "w-72"
        }`}
      >
        <div className="sticky top-0 h-screen w-full">
          <Sidebar
            role={user?.role}
            collapsed={collapsed}
            onLogout={logout}
            onToggleCollapse={() => setCollapsed((current) => !current)}
          />
        </div>
      </aside>

      <MobileSidebar open={mobileOpen} onClose={closeMobileMenu}>
        <Sidebar role={user?.role} mobile onNavigate={closeMobileMenu} onLogout={logout} />
      </MobileSidebar>

      <div className="min-h-screen min-w-0 flex-1">
        <DashboardHeader
          title={title}
          breadcrumbs={breadcrumbs}
          user={user}
          clinicContext={clinicContext}
          clinicContextError={clinicContextData.status === "error" ? clinicContextData.error : ""}
          onLogout={logout}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
