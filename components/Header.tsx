
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import { UserIcon, BellIcon, ChevronDownIcon, LogoIcon, MailOpenIcon } from './Icons';
import { Notification } from '../types';

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};


const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppContext();
    const { t } = useLocalization();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onClose]);

    return (
        <div ref={panelRef} className="absolute top-full right-0 mt-2 w-80 bg-base-200 rounded-lg shadow-2xl border border-base-300 z-50 flex flex-col max-h-[80vh]">
            <div className="p-3 border-b border-base-300 flex justify-between items-center">
                <h4 className="font-semibold text-content-100">{t('notifications')}</h4>
                <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-sm text-brand-primary hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={notifications.every(n => n.read)}
                >
                    <MailOpenIcon className="w-4 h-4" />
                    {t('markAllAsRead')}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map((n: Notification) => (
                        <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-3 border-b border-base-300 cursor-pointer flex items-start gap-3 ${n.read ? 'opacity-60' : 'bg-brand-primary/10'}`}
                        >
                           {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>}
                            <div className={`flex-grow ${n.read ? 'pl-5' : ''}`}>
                               <p className="text-sm text-content-100">{n.message}</p>
                               <p className="text-xs text-content-200 mt-1">{timeSince(n.timestamp)} ago</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="p-8 text-center text-content-200 text-sm">{t('noNotifications')}</p>
                )}
            </div>
        </div>
    );
};

const Header: React.FC = () => {
  const { userProfile, language, setLanguage, notifications } = useAppContext();
  const { t } = useLocalization();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-base-200 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <LogoIcon className="w-8 h-8 text-brand-primary" />
           <h1 className="text-xl md:text-2xl font-bold text-content-100 tracking-tight">OptiFuel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
              className="bg-base-300 text-content-100 rounded-md py-1.5 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer text-sm"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-content-200"/>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsPanelOpen(prev => !prev)}
              className="text-content-200 hover:text-content-100 transition-colors"
            >
              <BellIcon className="w-6 h-6"/>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {isPanelOpen && <NotificationPanel onClose={() => setIsPanelOpen(false)} />}
          </div>
          
          {userProfile && (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-base-300">
              <UserIcon className="w-6 h-6 text-content-200"/>
              <div className="hidden md:block">
                  <p className="text-sm font-semibold text-content-100">{userProfile.name}</p>
                  <p className="text-xs text-brand-primary font-medium">{userProfile.subscription} {t('subscription')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;