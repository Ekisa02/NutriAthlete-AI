
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserProfile, Notification } from '../types';

type Language = 'en' | 'sw';

interface AppContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  notifications: Notification[];
  addNotification: (message: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string) => {
      const newNotification: Notification = {
        id: new Date().toISOString() + Math.random(),
        message,
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20 notifications
  };

  const markNotificationAsRead = (id: string) => {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
  };

  const markAllNotificationsAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };


  const value = {
    userProfile,
    setUserProfile,
    language,
    setLanguage,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
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