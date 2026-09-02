import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (keyPath: string, defaultText?: string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const STORAGE_KEY = 'karwaan_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && ['en', 'hi', 'or', 'bn', 'te'].includes(saved)) {
      return saved;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (keyPath: string, defaultText?: string): string => {
    const keys = keyPath.split('.');
    
    // 1. Try active language
    let activeObj: any = translations[language];
    for (const key of keys) {
      if (activeObj && typeof activeObj === 'object' && key in activeObj) {
        activeObj = activeObj[key];
      } else {
        activeObj = undefined;
        break;
      }
    }

    if (typeof activeObj === 'string') {
      return activeObj;
    }

    // 2. Fallback to English
    let enObj: any = translations['en'];
    for (const key of keys) {
      if (enObj && typeof enObj === 'object' && key in enObj) {
        enObj = enObj[key];
      } else {
        enObj = undefined;
        break;
      }
    }

    if (typeof enObj === 'string') {
      return enObj;
    }

    // 3. Fallback to provided default text or key path
    return defaultText || keyPath;
  };

  const currentLanguageOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageOption,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
