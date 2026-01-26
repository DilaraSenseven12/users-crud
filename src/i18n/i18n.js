import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/en.json";
import tr from "./locales/tr/tr.json";

const saved = localStorage.getItem("lang");

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr }
  },
  lng: saved || "tr",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
