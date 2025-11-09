
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserProfile } from '../types';

type Language = 'en' | 'sw';

interface AppContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    userProfile,
    setUserProfile,
    language,
    setLanguage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
   