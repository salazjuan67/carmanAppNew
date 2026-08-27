import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '../config/translations';

const LANGUAGE_STORAGE_KEY = 'user-language';
const LANGUAGE_USER_SELECTED_KEY = 'user-language-selected';

interface LanguageContextType {
  language: Language;
  changeLanguage: (newLanguage: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const [savedLanguage, userSelected] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
        AsyncStorage.getItem(LANGUAGE_USER_SELECTED_KEY),
      ]);

      // Español por defecto; inglés solo si el usuario lo eligió explícitamente en el selector
      if (userSelected === 'true' && savedLanguage === 'en') {
        setLanguage('en');
        return;
      }

      setLanguage('es');
      if (savedLanguage !== 'es') {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');
      }
    } catch (error) {
      console.error('Error loading language:', error);
      setLanguage('es');
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.multiSet([
        [LANGUAGE_STORAGE_KEY, newLanguage],
        [LANGUAGE_USER_SELECTED_KEY, 'true'],
      ]);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
