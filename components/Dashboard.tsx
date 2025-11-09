
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import NutritionPlan from './NutritionPlan';
import EventPlanner from './EventPlanner';
import AiAssistant from './AiAssistant';
import HydrationTracker from './HydrationTracker';
import { ChartIcon, CalendarIcon, BotIcon } from './Icons';

type Tab = 'plan' | 'events' | 'assistant';

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const size = 160;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const offset = circumference - (displayScore / 100) * circumference;
        const circle = document.querySelector('.progress-ring-circle');
        if (circle) {
            (circle as SVGCircleElement).style.strokeDashoffset = offset.toString();
        }
    }, [displayScore, circumference]);
    
    useEffect(() => {
        if (score === 0) {
            setDisplayScore(0);
            return;
        }

        let start = 0;
        const end = score;
        if (start === end) return;

        const duration = 1000; // 1 second animation
        const incrementTime = (duration / end);
        
        const timer = setInterval(() => {
            start += 1;
            setDisplayScore(start);
            if (start >= end) {
                clearInterval(timer);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [score]);


    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A3E635" />
                        <stop offset="100%" stopColor="#4ADE80" /> 
                    </linearGradient>
                </defs>
                <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#21262D" strokeWidth={strokeWidth} />
                <circle
                    className="progress-ring-circle"
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{ transition: 'stroke-dashoffset 0.35s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-4xl font-extrabold text-content-100 tabular-nums">{displayScore}</span>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { userProfile, addNotification, notifications } = useAppContext();
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  useEffect(() => {
      // Add welcome notifications only if there are none.
      if (notifications.length === 0 && userProfile) {
          addNotification(`Welcome to OptiFuel, ${userProfile.name}! Your journey to peak performance starts now.`);
          setTimeout(() => {
              addNotification("Your personalized nutrition plan is ready. Check it out!");
          }, 2000); // delay second notification
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]); // Run only when userProfile is available

  const tabs = [
    { id: 'plan', label: t('nutritionPlan'), icon: <ChartIcon className="w-5 h-5 mr-2" /> },
    { id: 'events', label: t('eventPlanner'), icon: <CalendarIcon className="w-5 h-5 mr-2" /> },
    { id: 'assistant', label: t('aiAssistant'), icon: <BotIcon className="w-5 h-5 mr-2" /> },
  ];

  if (!userProfile) return null;

  return (
    <div className="max-w-7xl mx-auto">
       <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8 bg-base-200 p-6 rounded-xl shadow-lg">
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-content-100 mb-2">
                    {t('welcome')}, <span className="text-brand-primary">{userProfile.name}!</span>
                </h2>
                <p className="text-content-200">{t('yourProfile')}: {userProfile.age} y/o, {userProfile.weight}kg, {userProfile.sport}</p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
                 <CircularProgress score={88} />
                 <p className="font-semibold text-lg mt-2 text-content-100">Daily Energy Score</p>
            </div>
        </div>
        
      <HydrationTracker />


      <div className="border-b border-base-300 mb-6 mt-8">
        <div className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center font-medium py-3 px-4 sm:px-6 border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-content-200 hover:text-content-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
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