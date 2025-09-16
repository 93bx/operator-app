import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('ar');
  const { i18n } = useTranslation();

  useEffect(() => {
    // Get saved language from SecureStore or default to Arabic
    const initLanguage = async () => {
      try {
        const savedLanguage = await SecureStore.getItemAsync('language') || 'ar';
        setLanguageState(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      } catch (error) {
        console.error('Error loading language:', error);
        // Fallback to device locale
        const deviceLanguage = Localization.locale.startsWith('ar') ? 'ar' : 'en';
        setLanguageState(deviceLanguage);
        await i18n.changeLanguage(deviceLanguage);
      }
    };

    initLanguage();
  }, [i18n]);

  const setLanguage = async (lang: string) => {
    try {
      setLanguageState(lang);
      await i18n.changeLanguage(lang);
      await SecureStore.setItemAsync('language', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
