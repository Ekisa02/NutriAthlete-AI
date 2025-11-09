import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { getEventRecommendations } from '../services/geminiService';
import { EventRecommendations, EventRecommendationCategory } from '../types';
import { ChevronRightIcon } from './Icons';

const AccordionItem: React.FC<{ category: EventRecommendationCategory; isOpen: boolean; onClick: () => void }> = ({ category, isOpen, onClick }) => {
    return (
        <div className="border-b border-base-300">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-4 px-2"
            >
                <h4 className="text-lg font-semibold text-content-100">{category.category}</h4>
                <ChevronRightIcon className={`w-6 h-6 text-content-200 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
            >
                <div className="p-4 bg-base-100 rounded-b-lg space-y-4">
                    {category.recommendations.map((item, index) => (
                         <div key={index}>
                            <h5 className="font-bold text-brand-primary">{item.title}</h5>
                            <p className="text-content-200 text-sm">{item.advice}</p>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EventPlanner: React.FC = () => {
    const { t } = useLocalization();
    const [recommendations, setRecommendations] = useState<EventRecommendations | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const result = await getEventRecommendations();
                setRecommendations(result);
                // Automatically open the first category
                if (result && result.length > 0) {
                    setOpenCategory(result[0].category);
                }
            } catch (err) {
                console.error("Failed to load recommendations:", err);
                setError("Could not load event recommendations. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const handleToggle = (categoryName: string) => {
        setOpenCategory(prev => (prev === categoryName ? null : categoryName));
    };

    return (
        <div className="bg-base-200 rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-content-100 mb-4">{t('eventPlanner')}</h3>
            <p className="text-content-200 mb-6">Expert nutrition advice to prepare for your next big endurance event, like a marathon.</p>
            
            {loading && (
                <div className="flex items-center justify-center h-40">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                </div>
            )}

            {error && (
                 <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>
            )}

            {recommendations && (
                <div className="space-y-2">
                    {recommendations.map((category) => (
                        <AccordionItem
                            key={category.category}
                            category={category}
                            isOpen={openCategory === category.category}
                            onClick={() => handleToggle(category.category)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventPlanner;