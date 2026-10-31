import { Languages } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-slate-700 ${className}`}>
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{t("language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("language")}
        className="min-h-10 bg-transparent pr-1 text-sm font-semibold outline-none"
      >
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
      </select>
    </label>
  );
}
