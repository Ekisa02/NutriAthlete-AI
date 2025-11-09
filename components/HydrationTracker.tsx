import React, { useState, useEffect } from 'react';
import { WaterDropIcon, PlusIcon, RotateCwIcon } from './Icons';

const ConfettiPiece: React.FC<{ id: number }> = ({ id }) => {
    const colors = ['#A3E635', '#84CC16', '#4ADE80', '#34D399'];
    const style = {
        left: `${Math.random() * 100}%`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        animationName: `confetti-fall-${id % 2}`,
        animationDuration: `${Math.random() * 2 + 3}s`,
        animationDelay: `${Math.random() * 2}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
    };
    return <div className="absolute top-[-10px] w-2 h-2 rounded-full" style={style} />;
};


const HydrationTracker: React.FC = () => {
    const DAILY_GOAL = 3000; // 3 Liters
    const [intake, setIntake] = useState(0);
    const progress = Math.min((intake / DAILY_GOAL) * 100, 100);
    const goalReached = intake >= DAILY_GOAL;
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (goalReached) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
            return () => clearTimeout(timer);
        }
    }, [goalReached]);
    
    const addWater = (amount: number) => {
        setIntake(prev => Math.min(prev + amount, DAILY_GOAL + 500)); // Allow slight overage
    };

    const resetIntake = () => {
        setIntake(0);
    };

    const intakeOptions = [250, 500, 750];

    return (
        <div className="bg-base-200 rounded-xl shadow-lg p-6 relative overflow-hidden">
             {showConfetti && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                    {[...Array(50)].map((_, i) => <ConfettiPiece key={i} id={i} />)}
                </div>
            )}
            <style>
                {`
                @keyframes confetti-fall-0 {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
                }
                @keyframes confetti-fall-1 {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(200px) rotate(-360deg); opacity: 0; }
                }
                `}
            </style>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-content-100 flex items-center">
                        <WaterDropIcon className="w-6 h-6 mr-2 text-blue-400" />
                        Hydration Tracker
                    </h3>
                    <p className="text-content-200 text-sm">Stay hydrated for peak performance.</p>
                </div>
                <button onClick={resetIntake} className="text-content-200 hover:text-brand-primary transition-colors p-1 rounded-full bg-base-300/50 hover:bg-base-300">
                    <RotateCwIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="relative h-16 bg-base-100 rounded-lg overflow-hidden border border-base-300/50 mb-4">
                <div 
                    className="absolute bottom-0 left-0 w-full h-full bg-blue-500 transition-all duration-500 ease-out" 
                    style={{ 
                        transform: `translateY(${(100 - progress)}%)`,
                        background: 'linear-gradient(to top, #3b82f6, #60a5fa)'
                    }}
                >
                    <div className="wave"></div>
                    <div className="wave wave-2"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    {goalReached ? (
                         <span className="text-xl font-bold text-white drop-shadow-md animate-pulse">Goal Reached! 🎉</span>
                    ) : (
                        <span className="text-xl font-bold text-white drop-shadow-md">{intake}ml / {DAILY_GOAL}ml</span>
                    )}
                </div>
            </div>
             <style>{`
                .wave {
                    background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3e%3cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%232563EB'/%3e%3c/svg%3e");
                    position: absolute;
                    width: 200%;
                    height: 100%;
                    background-repeat: repeat no-repeat;
                    background-position: 0 bottom;
                    transform-origin: center bottom;
                    animation: wave-animation 3s linear infinite;
                    opacity: 0.8;
                }
                .wave-2 {
                    animation-duration: 5s;
                    opacity: 0.5;
                }
                @keyframes wave-animation {
                    0% { transform: translateX(0) translateZ(0) scaleY(1); }
                    50% { transform: translateX(-25%) translateZ(0) scaleY(0.9); }
                    100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
                }
            `}</style>

            <div className="grid grid-cols-3 gap-3">
                {intakeOptions.map(amount => (
                    <button 
                        key={amount}
                        onClick={() => addWater(amount)}
                        className="flex items-center justify-center gap-2 bg-base-300/50 text-content-100 py-3 rounded-md hover:bg-base-300 font-semibold transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {amount} ml
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HydrationTracker;
