import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { locales } from '@/locales/index';
import { LanguageContextType, Language } from '../types';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to get nested values from an object using a dot-notation string
const getNestedTranslation = (obj: any, key: string): string | undefined => {
  return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem('trin_app_language');
    // Check if storedLang is a valid key in our locales
    if (storedLang && Object.keys(locales).includes(storedLang)) {
      return storedLang as Language;
    }
    return 'en'; // Default language
  });

  const changeLanguage = useCallback((lang: Language) => {
    if (Object.keys(locales).includes(lang)) {
      setLanguage(lang);
      localStorage.setItem('trin_app_language', lang);
      document.documentElement.lang = lang;
    } else {
      console.warn(`Attempted to switch to an unsupported language: ${lang}`);
    }
  }, []);
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);


  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const translations = locales[language];
    let translation = getNestedTranslation(translations, key);

    if (translation === undefined) {
      console.warn(`Translation key not found: "${key}" for language "${language}".`);
      // Fallback to English if key not found in current language
      const fallbackTranslations = locales['en'];
      translation = getNestedTranslation(fallbackTranslations, key);
      if (translation === undefined) {
          return key; // Return the key itself if not found anywhere
      }
    }
    
    // Replace placeholders like {{variable}}
    if (options && translation) {
      Object.keys(options).forEach(optionKey => {
        translation = translation!.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(options[optionKey]));
      });
    }

    return translation || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};