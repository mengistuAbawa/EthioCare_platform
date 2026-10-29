import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  Menu,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const dashboardByRole = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  receptionist: "/receptionist/dashboard",
  clinic_admin: "/clinic/dashboard",
  system_admin: "/admin/dashboard",
};

const publicLinks = [
  ["Home", "home"],
  ["About EthioCare", "about"],
  ["How It Works", "how-it-works"],
  ["Services", "services"],
  ["For Patients", "for-patients"],
  ["For Doctors", "for-doctors"],
  ["For Clinics", "for-clinics"],
  ["Help & FAQ", "faq"],
  ["Contact", "contact"],
];

const roles = [
  {
    id: "for-patients",
    title: "Patient Portal",
    icon: HeartPulse,
    description: "Create a patient account, discover participating clinics, manage appointments, and review the health information available to your account.",
    availability: "Patient registration and appointment features depend on clinic participation and configured services.",
  },
  {
    id: "for-doctors",
    title: "Doctor Portal",
    icon: Stethoscope,
    description: "Doctors can review assigned appointments and patient-submitted health assessments, and manage their professional profile.",
    availability: "Clinical notes, verified laboratory workflows, prescriptions, care plans, and live video are not currently available.",
  },
  {
    id: "for-clinics",
    title: "Clinic & Reception Portals",
    icon: Users,
    description: "Clinic administrators manage supported clinic operations, staff, doctors, services, and schedules. Reception staff can work with authorized clinic appointments.",
    availability: "Access is assigned by authorized clinic workflows. Dedicated check-in and queue tracking are not currently available.",
  },
  {
    id: "system-portal",
    title: "System Admin Portal",
    icon: ShieldCheck,
    description: "Authorized system administrators oversee platform users, clinic applications, and supported administrative operations.",
    availability: "System administrator accounts are not created through public registration.",
  },
];

const steps = [
  "Browse verified, participating clinics and their published services.",
  "Create a patient account if you do not already have one.",
  "Review clinic, service, and doctor information before choosing care.",
  "Request an appointment using the available booking workflow.",
  "Check your appointment details and any status updates in your account.",
  "Attend the appointment at the clinic and follow clinician-provided instructions.",
  "Review the appointment history and health information available to your account.",
  "Follow up with your clinic or clinician when further care is recommended.",
];

const faqs = [
  {
    question: "What is EthioCare?",
    answer: "EthioCare is a digital platform for discovering participating clinics and coordinating supported appointment and clinic workflows.",
  },
  {
    question: "How do I create a patient account?",
    answer: "Choose Register to create a patient account with your name, email, optional phone number, and password. Public registration cannot create doctor, receptionist, or administrator roles.",
  },
  {
    question: "How do I book an appointment?",
    answer: "Sign in as a patient, find a participating clinic, and use the appointment features available for that clinic. Availability depends on current clinic schedules.",
  },
  {
    question: "Can I register as a doctor?",
    answer: "No. Public registration is for patient accounts. Doctor access must be arranged by an authorized clinic administrator.",
  },
  {
    question: "How does a clinic join EthioCare?",
    answer: "Clinic participation and administrator access require an authorized review process. This application does not currently offer a public clinic application form; contact an existing platform administrator through your organization.",
  },
  {
    question: "How do I contact support?",
    answer: "No public support contact has been configured in this application. If you already have an account, contact your clinic administrator through your established clinic channel.",
  },
  {
    question: "Can I access my medical information online?",
    answer: "Signed-in patients can access the appointment and health-assessment information supported by their account. Access depends on the records actually available and authorized in the system.",
  },
  {
    question: "What should I do if I forget my password?",
    answer: "Password recovery is not available in the current application. Do not share your password with anyone; contact your clinic or platform administrator through an established support channel.",
  },
];

function PublicNav({ mobileOpen, setMobileOpen, dashboardPath }) {
  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="EthioCare home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white"><HeartPulse size={21} /></span>
            <span className="text-xl font-bold tracking-tight text-slate-950">EthioCare</span>
          </Link>

          <nav aria-label="Public navigation" className="hidden items-center gap-5 xl:flex">
            {publicLinks.map(([label, section]) => (
              <a key={section} href={`#${section}`} className="text-sm font-medium text-slate-600 transition hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {dashboardPath ? (
              <Link to={dashboardPath} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Login</Link>
                <Link to="/register" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Register</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 xl:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" className="absolute inset-0 bg-slate-950/30" onClick={closeMenu} aria-label="Close navigation" />
          <nav className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white p-5 shadow-2xl" aria-label="Mobile public navigation">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-bold text-slate-950">Explore EthioCare</span>
              <button type="button" onClick={closeMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close navigation"><X size={20} /></button>
            </div>
            {publicLinks.map(([label, section]) => (
              <a key={section} href={`#${section}`} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900">{label}</a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
              {dashboardPath ? (
                <Link to={dashboardPath} onClick={closeMenu} className="col-span-2 rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white">Open dashboard</Link>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">Login</Link>
                  <Link to="/register" onClick={closeMenu} className="rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white">Register</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default function PublicHome({ initialSection = "" }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = isAuthenticated ? dashboardByRole[user?.role] : "";

  useEffect(() => {
    if (!initialSection) return;
    document.getElementById(initialSection)?.scrollIntoView({ block: "start" });
  }, [initialSection]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} dashboardPath={dashboardPath} />

      <main>
        <section id="home" className="relative isolate scroll-mt-24 overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <div aria-hidden="true" className="absolute -right-36 -top-32 -z-10 size-[34rem] rounded-full border-[70px] border-teal-100/60" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                <span className="size-2 rounded-full bg-teal-600" /> Healthcare coordination platform
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Healthcare Access, <span className="text-teal-700">Simplified</span> with EthioCare.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Connect with participating clinics and doctors, coordinate appointments, and access the healthcare information your account is permitted to see.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/clinics" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                  Find Clinics <ArrowRight size={17} />
                </Link>
                {!isAuthenticated && !loading && (
                  <>
                    <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-teal-500 hover:text-teal-800">Create Patient Account</Link>
                    <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Sign In</Link>
                  </>
                )}
                {dashboardPath && <Link to={dashboardPath} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-900">Go to your dashboard</Link>}
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">Availability depends on participating clinics, their published schedules, and your account permissions.</p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-[2rem] border border-teal-100 bg-white p-5 shadow-xl shadow-teal-900/10 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">One connected workspace</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">Care coordination, made clearer.</h2>
                  </div>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white"><HeartPulse size={24} /></span>
                </div>
                <div className="mt-7 space-y-3">
                  {[
                    [CalendarCheck2, "Appointment access", "Explore participating clinics and manage supported appointments."],
                    [CalendarClock, "Clinic schedules", "View available providers and service information where published."],
                    [ShieldCheck, "Role-based access", "Account permissions shape which information and workflows are available."],
                  ].map(([Icon, title, copy]) => (
                    <div key={title} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-800 shadow-sm"><Icon size={20} /></span>
                      <div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{copy}</p></div>
                    </div>
                  ))}
                </div>
                <a href="#how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950">See how it works <ArrowDown size={16} /></a>
              </div>
              <div aria-hidden="true" className="absolute -bottom-4 -left-4 -z-10 size-28 rounded-3xl bg-cyan-100" />
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">About EthioCare</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A shared digital space for care coordination.</h2>
            </div>
            <div className="space-y-4 text-base leading-7 text-slate-600">
              <p>EthioCare brings patients and participating healthcare organizations into a common system for clinic discovery, appointment coordination, and supported care workflows.</p>
              <p>Patients, doctors, reception teams, clinic administrators, and platform administrators each use role-specific tools. The records and actions available to each user depend on their assigned permissions and the features currently enabled.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Why use EthioCare</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Designed to make coordination easier.</h2>
              <p className="mt-4 leading-7 text-slate-600">These are intended platform benefits, not guarantees of medical outcomes. Actual availability depends on each participating clinic.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Discover participating clinics and doctors.",
                "Use supported appointment booking and status updates.",
                "Help clinics organize provider schedules and services.",
                "Give authorized staff role-appropriate coordination tools.",
                "Access permitted appointment and health-assessment information.",
                "Keep clinic and patient workflows within assigned access boundaries.",
              ].map((benefit) => (
                <article key={benefit} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-teal-700" size={20} />
                  <p className="text-sm font-medium leading-6 text-slate-700">{benefit}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A straightforward path to a visit.</h2>
              <p className="mt-4 leading-7 text-slate-600">Clinic participation, service availability, and appointment schedules can change. Confirm details in your account and with the clinic.</p>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-900">{index + 1}</span>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 bg-teal-950 px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">Platform services</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tools supported by the current application.</h2>
              <div>
                <p className="leading-7 text-teal-50/80">EthioCare currently supports public clinic and doctor discovery, patient accounts, appointment workflows, clinic and doctor administration, and assigned patient health assessments with protected attachment access.</p>
                <p className="mt-4 leading-7 text-teal-50/80">Dedicated check-in queues, electronic prescriptions, verified lab-result review, longitudinal clinical notes, follow-up task tracking, and live video consultations are not enabled in the current application.</p>
                <Link to="/clinics" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-teal-950 hover:bg-teal-50">Browse clinics <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Portals</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">The right workspace for each role.</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {roles.map(({ id, title, icon: Icon, description, availability }) => (
                <article id={id} key={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Icon size={22} /></span>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{availability}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Trust & privacy</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Your access is tied to your account and role.</h2>
            </div>
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <p>Protected workflows use authenticated accounts and role-based access. Clinic and care-record access is restricted according to available server-side relationships and permissions.</p>
              <p>Only access information you are authorized to view. The public website does not display private dashboard or patient records.</p>
              <p>A public privacy policy, terms of use, support contact, and external compliance certification have not been configured in this application. Do not rely on this site as a substitute for emergency or clinical advice.</p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Help & FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Common questions.</h2>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-slate-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
                    <span className="flex items-center justify-between gap-4">{faq.question}<span aria-hidden="true" className="text-xl text-teal-800 transition group-open:rotate-45">+</span></span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl bg-teal-50 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">Get started</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Find a participating clinic.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Browse published clinic information or create a patient account to continue.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/clinics" className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">Find Clinics</Link>
              {!isAuthenticated && <Link to="/register" className="rounded-xl border border-teal-300 bg-white px-5 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-100">Register</Link>}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-slate-950"><HeartPulse className="text-teal-700" size={21} />EthioCare</Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">A digital platform for discovering participating clinics and coordinating supported healthcare workflows.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Explore</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              {publicLinks.slice(0, 4).map(([label, section]) => <a key={section} className="hover:text-teal-800" href={`#${section}`}>{label}</a>)}
              <Link className="hover:text-teal-800" to="/clinics">Find Clinics</Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Account</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <Link className="hover:text-teal-800" to="/login">Login</Link>
              <Link className="hover:text-teal-800" to="/register">Patient registration</Link>
              <p className="text-xs leading-5 text-slate-500">No support contact, privacy policy, or terms link is configured.</p>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl border-t border-slate-100 pt-5 text-xs text-slate-500">© {new Date().getFullYear()} EthioCare. Availability depends on participating clinics.</p>
      </footer>
    </div>
  );
}
