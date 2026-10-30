import { Link, Outlet } from "react-router-dom";

const publicLinks = [
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/services", label: "Services" },
  { to: "/clinics", label: "Clinics" },
  { to: "/doctors", label: "Doctors" },
  { to: "/help", label: "Help" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a href="#main-content" className="ui-skip-link">Skip to main content</a>
      <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-brand-navy">
            EthioCare
          </Link>
          <nav aria-label="Public navigation" className="order-3 flex w-full flex-wrap gap-x-4 gap-y-2 sm:order-none sm:w-auto sm:gap-x-5">
            {publicLinks.map((item) => (
              <Link key={item.to} to={item.to} className="min-h-10 inline-flex items-center text-sm font-medium text-text-secondary hover:text-brand-teal">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="ui-button ui-button-secondary">Sign in</Link>
            <Link to="/register" className="ui-button ui-button-primary">Create account</Link>
          </div>
        </div>
      </header>
      <div id="main-content" tabIndex="-1" className="flex-1">
        <Outlet />
      </div>
      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-semibold text-brand-navy">EthioCare</span>
          <span>Clinic information and patient services available through participating providers.</span>
        </div>
      </footer>
    </div>
  );
}
