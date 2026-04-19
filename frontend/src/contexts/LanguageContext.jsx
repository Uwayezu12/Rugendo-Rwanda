import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations.js';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('rugendo-lang') || 'en'
  );

  const changeLanguage = (code) => {
    if (SUPPORTED_LANGUAGES.find((l) => l.code === code)) {
      setLanguage(code);
      localStorage.setItem('rugendo-lang', code);
    }
  };

  // t(key, vars?) — look up translation, fall back to English, then the key.
  // vars: object of {placeholder: value} for simple string interpolation.
  const t = (key, vars = {}) => {
    let str = translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    if (vars && typeof str === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
