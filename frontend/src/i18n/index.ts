import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./fr.json";
import en from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    detection: {
      // A signed-in account's saved preference (applied via i18n.changeLanguage
      // after login/register) always wins on the next load because it's
      // written to the same localStorage key the detector reads first.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Used wherever the app formats a date with toLocaleDateString/toLocaleTimeString
// so dates follow the active UI language instead of being hardcoded to fr-FR.
export function getDateLocale(): string {
  return i18n.language?.startsWith("en") ? "en-US" : "fr-FR";
}

export default i18n;
