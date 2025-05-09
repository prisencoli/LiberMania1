import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Create i18next instance once
const i18nInstance = i18n
  // load translation using http -> see /public/locales
  .use(HttpBackend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next);

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18nInstance.init({
    fallbackLng: 'en',
    debug: false, // Disabilita debug in produzione
    supportedLngs: ['en', 'it', 'fr', 'es', 'pt', 'zh', 'ar', 'de'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    // backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Opzioni avanzate per migliorare la gestione delle traduzioni mancanti
    keySeparator: '.',
    saveMissing: true, // Utile in fase di sviluppo per identificare chiavi mancanti
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`TRANSLATION MISSING: [${lng}] ${ns}:${key}`);
    },
    
    // react-i18next options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded', // Reagisci quando cambiano le traduzioni
      bindI18nStore: 'added removed', // Reagisci quando vengono aggiunte/rimosse traduzioni
      transEmptyNodeValue: '', // Cosa mostrare quando una traduzione è vuota
    },
  });
}

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

// Helper per identificare le lingue RTL
export const rtlLanguages = ['ar'];

// Helper per verificare se una lingua è RTL
export const isRTL = (lang: string) => rtlLanguages.includes(lang);