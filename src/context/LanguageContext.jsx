import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../mockData';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('salesmate_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('salesmate_lang', lang);
    const htmlDir = lang === 'ar' ? 'rtl' : 'ltr';
    const htmlLang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = htmlDir;
    document.documentElement.lang = htmlLang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key) => {
    const translations = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    return translations[key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
