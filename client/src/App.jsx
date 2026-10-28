import { CalendarDays, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";

const features = [
  {
    icon: Stethoscope,
    title: "Find healthcare providers",
    description: "Explore clinic services and doctor profiles in one place.",
  },
  {
    icon: CalendarDays,
    title: "Book appointments",
    description: "Find available appointment times and manage your bookings.",
  },
  {
    icon: ShieldCheck,
    title: "Manage appointments securely",
    description: "Keep your appointment information organized and accessible.",
  },
];

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-2 font-bold text-teal-700">
            <HeartPulse size={28} />
            <span className="text-xl">EthioCare</span>
          </a>

          <span className="hidden text-sm text-slate-500 sm:block">
            Healthcare appointments made simpler
          </span>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
            Your healthcare, organized
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Better access to care.
            <span className="block text-teal-700">Simpler appointments.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Discover clinics, explore healthcare services, and manage
            appointments through one convenient platform.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#features"
              className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white transition hover:bg-teal-800"
            >
              Explore features
            </a>

            <span className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">
              Coming soon: Online booking
            </span>
          </div>
        </div>

        <div
          id="features"
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 inline-flex rounded-xl bg-teal-50 p-3 text-teal-700">
                <Icon size={26} />
              </div>

              <h2 className="text-xl font-semibold">{title}</h2>

              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} EthioCare. Clinic Appointment Platform.
      </footer>
    </main>
  );
}