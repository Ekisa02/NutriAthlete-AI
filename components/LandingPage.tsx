import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { ChartIcon, BrainCircuitIcon, LeafIcon } from './Icons';

interface LandingPageProps {
  onGetStarted: () => void;
}

const PhoneMockup: React.FC = () => {
  return (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
        <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-base-100">
            {/* Mockup screen content */}
            <div className="p-4 text-white">
                <p className="text-lg font-bold text-content-100">Good morning, Peter!</p>
                <div className="mt-8 flex flex-col items-center">
                    <div className="relative w-40 h-40">
                         <svg width="160" height="160" viewBox="0 0 160 160">
                             <defs>
                                <linearGradient id="mockupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#A3E635" />
                                    <stop offset="100%" stopColor="#4ADE80" /> 
                                </linearGradient>
                            </defs>
                            <circle cx="80" cy="80" r="72" fill="transparent" stroke="#21262D" strokeWidth="12" />
                            <circle
                                cx="80" cy="80" r="72"
                                fill="transparent"
                                stroke="url(#mockupGradient)"
                                strokeWidth="12"
                                strokeDasharray="452.39"
                                strokeDashoffset="54.28" // Represents 88%
                                strokeLinecap="round"
                                transform="rotate(-90 80 80)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-4xl font-extrabold text-content-100">88</span>
                        </div>
                    </div>
                    <p className="font-semibold text-lg mt-2 text-content-100">Daily Energy Score</p>
                    <div className="w-full h-2 bg-base-200 rounded-full mt-6"><div className="w-4/5 h-2 bg-yellow-400 rounded-full"></div></div>
                    <p className="text-xs text-content-200 mt-1 self-start">Energy</p>
                    <div className="w-full h-2 bg-base-200 rounded-full mt-2"><div className="w-3/4 h-2 bg-blue-400 rounded-full"></div></div>
                    <p className="text-xs text-content-200 mt-1 self-start">Recovery</p>
                </div>
            </div>
        </div>
    </div>
  );
};


const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const { t } = useLocalization();

    const features = [
        {
            icon: <BrainCircuitIcon className="w-10 h-10 text-brand-primary" />,
            title: "AI-Personalized Plans",
            description: "Get meal plans tailored to your biometrics, training load, and recovery data."
        },
        {
            icon: <LeafIcon className="w-10 h-10 text-brand-primary" />,
            title: "Locally-Sourced Nutrition",
            description: "Embrace sustainable nutrition with plans that prioritize local Kenyan foods."
        },
        {
            icon: <ChartIcon className="w-10 h-10 text-brand-primary" />,
            title: "Performance Tracking",
            description: "Monitor your Daily Energy Score and optimize your performance over time."
        }
    ];

  return (
    <div className="text-center">
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl md:text-6xl font-extrabold text-content-100 tracking-tight leading-tight">
                Fuel Your Victory.
                <br />
                <span className="text-brand-primary">Personalized Nutrition, Powered by AI.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-content-200">
                OptiFuel delivers hyper-personalized meal plans using locally-sourced ingredients to optimize your performance, accelerate recovery, and unlock your true potential.
            </p>
            <button
                onClick={onGetStarted}
                className="mt-10 bg-brand-primary text-base-100 text-lg font-bold py-3 px-8 rounded-full hover:bg-brand-secondary transition-transform transform hover:scale-105 shadow-lg"
            >
                {t('getStarted')}
            </button>
        </div>

        <div className="relative -mt-10">
            <PhoneMockup />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 py-24">
            <div className="grid md:grid-cols-3 gap-12">
                {features.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <div className="bg-base-200 rounded-full p-4 mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-content-100 mb-2">{feature.title}</h3>
                        <p className="text-content-200">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default LandingPage;
