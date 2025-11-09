
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import NutritionPlan from './NutritionPlan';
import EventPlanner from './EventPlanner';
import AiAssistant from './AiAssistant';
import HydrationTracker from './HydrationTracker';
import { ChartIcon, CalendarIcon, BotIcon } from './Icons';

type Tab = 'plan' | 'events' | 'assistant';

const AnimatedText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
    return (
        <span className="inline-block">
            {text.split('').map((char, index) => (
                <span
                    key={`${char}-${index}`}
                    className="animate-fade-in-up inline-block"
                    style={{ animationDelay: `${delay + index * 30}ms`, animationFillMode: 'backwards' }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

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

        const duration = 1200; 
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
                        <stop offset="0%" stopColor="#FDE047" /> 
                        <stop offset="100%" stopColor="#A3E635" />
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
                    style={{ transition: 'stroke-dashoffset 0.5s linear' }}
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
  const [animations, setAnimations] = useState({
      header: false,
      score: false,
      hydration: false,
      tabs: false
  });

  useEffect(() => {
    const timers = [
        setTimeout(() => setAnimations(prev => ({...prev, header: true})), 100),
        setTimeout(() => setAnimations(prev => ({...prev, score: true})), 400),
        setTimeout(() => setAnimations(prev => ({...prev, hydration: true})), 700),
        setTimeout(() => setAnimations(prev => ({...prev, tabs: true})), 900)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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
  
  const welcomeText = `${t('welcome')}, `;

  return (
    <div className="max-w-7xl mx-auto">
       <div className={`flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8 bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-700 ease-out ${animations.header ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-content-100 mb-2">
                    <AnimatedText text={welcomeText} />
                    <span className="text-brand-primary inline-block">
                        <AnimatedText text={userProfile.name + '!'} delay={welcomeText.length * 30} />
                    </span>
                </h2>
                <p className="text-content-200 opacity-0 animate-fade-in-up" style={{animationDelay: '700ms'}}>
                    {t('yourProfile')}: {userProfile.age} y/o, {userProfile.weight}kg, {userProfile.sport}
                </p>
            </div>
            <div className={`flex flex-col items-center flex-shrink-0 transition-all duration-500 ease-out ${animations.score ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 <div className="shadow-[0_0_25px_rgba(163,230,53,0.3)] rounded-full">
                    <CircularProgress score={88} />
                 </div>
                 <p className="font-semibold text-lg mt-4 text-content-100 opacity-0 animate-fade-in-up" style={{animationDelay: '900ms'}}>Daily Energy Score</p>
            </div>
        </div>
        
      <div className={`transition-all duration-700 ease-out ${animations.hydration ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <HydrationTracker />
      </div>

      <div className="border-b border-base-300 mb-6 mt-8">
        <div className="flex -mb-px">
          {tabs.map((tab, index) => (
            <div key={tab.id} className={`opacity-0 ${animations.tabs ? 'animate-fade-in-up' : ''}`} style={{animationDelay: `${1000 + index * 150}ms`}}>
                <button
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center font-medium py-3 px-4 sm:px-6 border-b-2 transition-all duration-300 ease-in-out relative ${
                    activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-content-200 hover:text-content-100'
                }`}
                >
                {tab.icon}
                {tab.label}
                 {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>}
                </button>
            </div>
          ))}
        </div>
      </div>

      <div key={activeTab} className="opacity-0 animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
        {activeTab === 'plan' && <NutritionPlan />}
        {activeTab === 'events' && <EventPlanner />}
        {activeTab === 'assistant' && <AiAssistant />}
      </div>
    </div>
  );
};

export default Dashboard;