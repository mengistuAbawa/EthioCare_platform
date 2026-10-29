import {
  BriefcaseMedical,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarCheck2,
  CalendarPlus,
  ClipboardList,
  FileClock,
  FileImage,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  Hospital,
  KeyRound,
  Link2,
  ListOrdered,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UserRoundSearch,
  Users,
  Video,
} from "lucide-react";

export const dashboardHomeByRole = {
  system_admin: "/admin/dashboard",
  clinic_admin: "/clinic/dashboard",
  doctor: "/doctor/dashboard",
  receptionist: "/reception/dashboard",
  patient: "/patient/dashboard",
};

const dashboardNavigation = {
  system_admin: [
    {
      label: "Administration",
      items: [
        { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
        { label: "Clinic Management", to: "/admin/clinics", icon: Building2 },
        { label: "Clinic Verification", to: "/admin/verification", icon: ShieldCheck },
        { label: "User Management", to: "/admin/users", icon: Users },
        { label: "Doctor Management", to: "/admin/doctors", icon: Stethoscope },
        { label: "Service Oversight", to: "/admin/service-categories", icon: ClipboardList },
        { label: "Appointment Oversight", to: "/admin/appointments", icon: CalendarCheck2 },
        { label: "Platform Analytics", to: "/admin/analytics", icon: BarChart3 },
        { label: "Notifications", to: "/admin/notifications", icon: Bell },
        { label: "Audit Logs", to: "/admin/audit-logs", icon: FileClock },
        { label: "Security & Access Control", to: "/admin/staff", icon: KeyRound },
        { label: "System Settings", to: "/admin/settings", icon: Settings },
        { label: "My Profile", to: "/account/profile", icon: UserRound },
        { label: "Logout", action: "logout", icon: LogOut },
      ],
    },
  ],
  clinic_admin: [
    {
      label: "Clinic Administration",
      items: [
        { label: "Dashboard", to: "/clinic/dashboard", icon: LayoutDashboard, end: true },
        { label: "Clinic Profile", to: "/clinic/dashboard#your-clinics", icon: Building2 },
        { label: "Staff Management", to: "/clinic/admin/staff", icon: Users },
        { label: "Doctor Management", to: "/clinic/admin/doctors", icon: Stethoscope },
        { label: "Services Management", to: "/clinic/admin/services", icon: ClipboardList },
        { label: "Doctor-Service Assignments", to: "/clinic/admin/doctor-services", icon: Link2 },
        { label: "Doctor Schedules", to: "/clinic/admin/schedules", icon: CalendarClock },
        { label: "Appointment Management", to: "/clinic/admin/appointments", icon: CalendarCheck2 },
        { label: "Patient Directory", to: "/clinic/admin/patients", icon: UserRoundSearch },
        { label: "Reception & Queue Overview", to: "/clinic/admin/queue", icon: ListOrdered },
        { label: "Clinic Analytics", to: "/clinic/admin/analytics", icon: BarChart3 },
        { label: "Notifications", to: "/clinic/admin/notifications", icon: Bell },
        { label: "Clinic Settings", to: "/clinic/admin/settings", icon: Settings },
        { label: "My Profile", to: "/account/profile", icon: UserRound },
        { label: "Logout", action: "logout", icon: LogOut },
      ],
    },
  ],
  doctor: [
    {
      label: "Doctor Portal",
      items: [
        { label: "Dashboard", to: "/doctor/dashboard", icon: LayoutDashboard, end: true },
        { label: "My Schedule", to: "/doctor/schedule", icon: CalendarClock },
        { label: "My Appointments", to: "/doctor/appointments", icon: CalendarCheck2 },
        { label: "My Patients", to: "/doctor/patients", icon: UserRoundSearch },
        { label: "Patient Health Assessments", to: "/doctor/assessments", icon: ClipboardList },
        { label: "Medical Images & Reports", to: "/doctor/medical-files", icon: FileImage },
        { label: "Lab Results Review", to: "/doctor/lab-results", icon: FlaskConical },
        { label: "Clinical Notes", to: "/doctor/clinical-notes", icon: FileText },
        { label: "Medical Records", to: "/doctor/medical-records", icon: HeartPulse },
        { label: "Live Consultation", to: "/doctor/consultations", icon: Video },
        { label: "Prescriptions & Care Plans", to: "/doctor/prescriptions-care-plans", icon: BriefcaseMedical },
        { label: "Follow-up Management", to: "/doctor/follow-ups", icon: CalendarCheck },
        { label: "My Services", to: "/doctor/services", icon: Stethoscope },
        { label: "Notifications", to: "/doctor/notifications", icon: Bell },
        { label: "Professional Profile", to: "/doctor/profile", icon: UserRound },
        { label: "Settings", to: "/doctor/settings", icon: Settings },
        { label: "Logout", action: "logout", icon: LogOut },
      ],
    },
  ],
  receptionist: [
    {
      label: "Reception Portal",
      items: [
        { label: "Dashboard", to: "/receptionist/dashboard", icon: LayoutDashboard, end: true },
        { label: "Today's Appointments", to: "/receptionist/appointments/today", icon: CalendarCheck2 },
        { label: "Appointment Registration", to: "/receptionist/appointments/register", icon: CalendarPlus },
        { label: "Patient Registration", to: "/receptionist/patients/register", icon: Users },
        { label: "Patient Directory", to: "/receptionist/patients", icon: UserRoundSearch },
        { label: "Check-in & Check-out", to: "/receptionist/check-in-out", icon: ClipboardList },
        { label: "Queue Management", to: "/receptionist/queue", icon: ListOrdered },
        { label: "Doctor Availability", to: "/receptionist/doctor-availability", icon: CalendarClock },
        { label: "Clinic Services", to: "/receptionist/services", icon: BriefcaseMedical },
        { label: "Notifications", to: "/receptionist/notifications", icon: Bell },
        { label: "My Profile", to: "/account/profile", icon: UserRound },
        { label: "Settings", to: "/receptionist/settings", icon: Settings },
        { label: "Logout", action: "logout", icon: LogOut },
      ],
    },
  ],
  patient: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", to: "/patient/dashboard", icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: "Discover Healthcare",
      items: [
        { label: "Find Clinics", to: "/patient/clinics", icon: Hospital },
        { label: "Find Doctors", to: "/patient/doctors", icon: Stethoscope },
        { label: "Browse Services", to: "/patient/services", icon: BriefcaseMedical },
      ],
    },
    {
      label: "Appointments",
      items: [
        { label: "Book Appointment", to: "/patient/book-appointment", icon: CalendarPlus },
        { label: "My Appointments", to: "/patient/appointments", icon: CalendarCheck },
        { label: "Appointment History", to: "/patient/appointment-history", icon: History },
      ],
    },
    {
      label: "My Health",
      items: [
        { label: "Health Assessment", to: "/patient/assessment/new", icon: ClipboardList },
        { label: "My Medical Images & Reports", to: "/patient/medical-files", icon: FileImage },
        { label: "My Lab Results", to: "/patient/lab-results", icon: FlaskConical },
        { label: "My Medical Records", to: "/patient/medical-records", icon: FileText },
        { label: "Online Consultation", to: "/patient/consultations", icon: Video },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Notifications", to: "/patient/notifications", icon: Bell },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Health Profile", to: "/patient/health-profile", icon: HeartPulse },
        { label: "My Profile", to: "/account/profile", icon: UserRound },
        { label: "Settings & Privacy", to: "/patient/settings", icon: Settings },
        { label: "Logout", action: "logout", icon: LogOut },
      ],
    },
  ],
};

export function getDashboardNavigation(role) {
  return dashboardNavigation[role] || [];
}

export function getDashboardPageTitle(pathname, role) {
  const homeTitles = {
    system_admin: "System administration",
    clinic_admin: "Clinic administration",
    doctor: "Doctor dashboard",
    receptionist: "Reception dashboard",
    patient: "Patient dashboard",
  };

  const titles = {
    "/admin/dashboard": homeTitles.system_admin,
    "/admin/clinics": "Clinic Management",
    "/admin/verification": "Clinic Verification",
    "/admin/clinic-status": "Clinic Management",
    "/admin/users": "User Management",
    "/admin/doctors": "Doctor Management",
    "/admin/staff": "Security & Access Control",
    "/admin/appointments": "Appointment Oversight",
    "/admin/service-categories": "Service Oversight",
    "/admin/notifications": "Notifications",
    "/admin/analytics": "Platform Analytics",
    "/admin/audit-logs": "Audit Logs",
    "/admin/settings": "System Settings",
    "/clinic/dashboard": homeTitles.clinic_admin,
    "/doctor/dashboard": homeTitles.doctor,
    "/doctor/schedule": "My Schedule",
    "/doctor/appointments": "My Appointments",
    "/doctor/patients": "My Patients",
    "/doctor/assessments": "Patient Health Assessments",
    "/doctor/medical-files": "Medical Images & Reports",
    "/doctor/lab-results": "Lab Results Review",
    "/doctor/clinical-notes": "Clinical Notes",
    "/doctor/medical-records": "Medical Records",
    "/doctor/consultations": "Live Consultation",
    "/doctor/prescriptions-care-plans": "Prescriptions & Care Plans",
    "/doctor/follow-ups": "Follow-up Management",
    "/doctor/services": "My Services",
    "/doctor/notifications": "Notifications",
    "/doctor/settings": "Settings",
    "/reception/dashboard": homeTitles.receptionist,
    "/receptionist/dashboard": homeTitles.receptionist,
    "/receptionist/appointments": "Today's Appointments",
    "/receptionist/appointments/today": "Today's Appointments",
    "/receptionist/booking": "Appointment Registration",
    "/receptionist/appointments/register": "Appointment Registration",
    "/receptionist/register-patient": "Patient Registration",
    "/receptionist/patients/register": "Patient Registration",
    "/receptionist/patients": "Patient Directory",
    "/receptionist/check-in-out": "Check-in & Check-out",
    "/receptionist/queue": "Queue Management",
    "/receptionist/doctor-availability": "Doctor Availability",
    "/receptionist/services": "Clinic Services",
    "/receptionist/notifications": "Notifications",
    "/receptionist/settings": "Settings",
    "/receptionist/doctors-services": "Doctors & Services",
    "/patient/dashboard": homeTitles.patient,
    "/patient/clinics": "Find Clinics",
    "/patient/doctors": "Find Doctors",
    "/patient/services": "Browse Services",
    "/patient/book-appointment": "Book Appointment",
    "/patient/appointments": "My Appointments",
    "/patient/appointment-history": "Appointment History",
    "/doctor/profile": "Professional Profile",
    "/patient/assessment/new": "Health Assessment",
    "/patient/assessments": "Assessment history",
    "/account/profile": "Account profile",
    "/patient/medical-files": "My Medical Images & Reports",
    "/patient/lab-results": "My Lab Results",
    "/patient/medical-records": "My Medical Records",
    "/patient/consultations": "Online Consultation",
    "/patient/notifications": "Notifications",
    "/patient/health-profile": "Health Profile",
    "/patient/settings": "Settings & Privacy",
  };

  if (pathname.startsWith("/doctor/assessments/")) return "Review assessment";
  if (pathname.startsWith("/patient/assessments/")) return "Assessment details";
  if (pathname.startsWith("/patient/clinics/")) return "Clinic details";
  if (pathname.startsWith("/patient/doctors/")) return "Doctor details";
  if (pathname.startsWith("/admin/clinics/")) return "Clinic details";
  if (pathname.startsWith("/clinic/admin/")) {
    const feature = pathname.slice("/clinic/admin/".length);
    const titles = {
      staff: "Staff Management",
      doctors: "Doctor Management",
      services: "Services Management",
      "doctor-services": "Doctor-Service Assignments",
      schedules: "Doctor Schedules",
      appointments: "Appointment Management",
      patients: "Patient Directory",
      queue: "Reception & Queue Overview",
      analytics: "Clinic Analytics",
      notifications: "Notifications",
      settings: "Clinic Settings",
    };
    return titles[feature] || homeTitles[role] || "Clinic Administration";
  }
  if (pathname.startsWith("/clinic/") && pathname.endsWith("/doctors")) return "Clinic doctors";

  return titles[pathname] || homeTitles[role] || "Dashboard";
}

export default dashboardNavigation;
