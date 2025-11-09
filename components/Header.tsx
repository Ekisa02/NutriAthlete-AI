
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
// Fix: Import `ChartIcon` which was used in the component but not imported.
import { UserIcon, BellIcon, ChevronDownIcon, ChartIcon } from './Icons';

const Header: React.FC = () => {
  const { userProfile, language, setLanguage } = useAppContext();
  const { t } = useLocalization();

  return (
    <header className="bg-base-200 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <ChartIcon className="w-8 h-8 text-brand-primary" />
           <h1 className="text-xl md:text-2xl font-bold text-content-100 tracking-tight">{t('appName')}</h1>
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
          
          <button className="relative text-content-200 hover:text-content-100 transition-colors">
            <BellIcon className="w-6 h-6"/>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </button>
          
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