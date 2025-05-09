import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./lib/i18n";

// Set the dir attribute on the HTML element for RTL languages
const handleLanguageChange = () => {
  const lang = localStorage.getItem('i18nextLng') || 'en';
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

// Initialize direction
handleLanguageChange();

// Listen for language changes
window.addEventListener('languagechange', handleLanguageChange);

createRoot(document.getElementById("root")!).render(<App />);
