import { Link, Outlet } from "react-router-dom";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";
import ThemeToggle from "../ui/ThemeToggle";

const publicLinks = [
  { to: "/about", key: "about", fallback: "About" },
  { to: "/how-it-works", key: "howItWorks", fallback: "How it works" },
  { to: "/services", key: "services", fallback: "Services" },
  { to: "/clinics", key: "clinics", fallback: "Clinics" },
  { to: "/doctors", key: "doctors", fallback: "Doctors" },
  { to: "/help", key: "help", fallback: "Help" },
  { to: "/contact", key: "contact", fallback: "Contact" },
];

export default function PublicLayout() {
  const { t } = useLanguage();
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
                {t(item.key) === item.key ? item.fallback : t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login" className="ui-button ui-button-secondary">{t("signIn")}</Link>
            <Link to="/register" className="ui-button ui-button-primary">{t("createAccount")}</Link>
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
