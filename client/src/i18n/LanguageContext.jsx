import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("ethiocare_language");
    return saved === "am" ? "am" : "en";
  });

  useEffect(() => {
    localStorage.setItem("ethiocare_language", language);
    document.documentElement.lang = language === "am" ? "am" : "en";
    document.documentElement.dir = "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key) => translations[language]?.[key] || translations.en[key] || key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
