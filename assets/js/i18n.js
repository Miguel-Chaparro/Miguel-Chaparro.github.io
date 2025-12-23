/**
 * Simple Client-Side Internationalization (i18n)
 */

const defaultLocale = 'es';
const supportedLocales = ['es', 'en'];

// Load translations from JSON files
async function loadTranslations(locale) {
  try {
    const response = await fetch(`assets/locales/${locale}.json`);
    return await response.json();
  } catch (error) {
    console.error("Could not load translations:", error);
    return {};
  }
}

// Apply translations to the page
function applyTranslations(translations) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    // Handle nested keys (e.g. "header.nav.internet")
    const translation = key.split('.').reduce((obj, k) => obj && obj[k], translations);

    if (translation) {
      // Check if it's an input placeholder or standard text
      if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
}

// Initialize i18n
async function initI18n() {
  // 1. Determine language (LocalStorage > Browser > Default)
  let locale = localStorage.getItem('lang') || navigator.language.slice(0, 2);
  if (!supportedLocales.includes(locale)) locale = defaultLocale;

  // 2. Load and apply
  const translations = await loadTranslations(locale);
  applyTranslations(translations);

  // 3. Set text on language toggle button if it exists
  const langBtn = document.getElementById('lang-toggle-text');
  if (langBtn) {
    langBtn.textContent = locale.toUpperCase();
  }

  document.documentElement.lang = locale;
}

// Language Switcher Function
async function toggleLanguage() {
  const currentLang = localStorage.getItem('lang') || 'es';
  const newLang = currentLang === 'es' ? 'en' : 'es';

  localStorage.setItem('lang', newLang);
  await initI18n();
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', initI18n);

// Expose toggle function globally
window.toggleLanguage = toggleLanguage;
