
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import NutritionPlan from './NutritionPlan';
import EventPlanner from './EventPlanner';
import AiAssistant from './AiAssistant';
import { ChartIcon, CalendarIcon, BotIcon } from './Icons';

type Tab = 'plan' | 'events' | 'assistant';

const Dashboard: React.FC = () => {
  const { userProfile } = useAppContext();
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const tabs = [
    { id: 'plan', label: t('nutritionPlan'), icon: <ChartIcon className="w-5 h-5 mr-2" /> },
    { id: 'events', label: t('eventPlanner'), icon: <CalendarIcon className="w-5 h-5 mr-2" /> },
    { id: 'assistant', label: t('aiAssistant'), icon: <BotIcon className="w-5 h-5 mr-2" /> },
  ];

  if (!userProfile) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-content-100 mb-2">
        {t('welcome')}, <span className="text-brand-primary">{userProfile.name}!</span>
      </h2>
      <p className="text-content-200 mb-8">{t('yourProfile')}: {userProfile.age} y/o, {userProfile.weight}kg, {userProfile.sport}</p>

      <div className="flex border-b border-base-300 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center font-medium py-3 px-4 sm:px-6 -mb-px transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'border-b-2 border-transparent text-content-200 hover:text-content-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="transition-opacity duration-500">
        {activeTab === 'plan' && <NutritionPlan />}
        {activeTab === 'events' && <EventPlanner />}
        {activeTab === 'assistant' && <AiAssistant />}
      </div>
    </div>
  );
};

export default Dashboard;
   