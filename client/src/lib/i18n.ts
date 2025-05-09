import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translation using http -> see /public/locales
  .use(HttpBackend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: true,
    supportedLngs: ['en', 'it', 'fr', 'es', 'pt', 'zh', 'ar', 'de'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    // backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // react-i18next options
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Language names in their native language
export const languageNames = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  zh: '中文',
  ar: 'العربية',
  de: 'Deutsch',
};