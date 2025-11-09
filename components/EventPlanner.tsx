import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import { getEventRecommendations } from '../services/geminiService';
import PremiumFeatureLock from './PremiumFeatureLock';
import { EventRecommendationResponse } from '../types';
import { MapPinIcon } from './Icons';

const EventPlanner: React.FC = () => {
  const { userProfile } = useAppContext();
  const { t } = useLocalization();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [recommendations, setRecommendations] = useState<EventRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isPremium = userProfile?.subscription === 'Premium';

  useEffect(() => {
    setLocationError(t('gettingLocation'));
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
            setLocationError(null);
        },
        (error) => {
            console.error("Geolocation error:", error);
            setLocationError(t('locationPermission'));
        }
    );
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !eventName || !eventDate) return;

    setLoading(true);
    setRecommendations(null);
    try {
      const result = await getEventRecommendations(userProfile, eventName, eventDate, location);
      setRecommendations(result);
    } catch (error: any) {
      console.error('Failed to get event recommendations:', error);
       const errorMessage = error.toString().includes("RESOURCE_EXHAUSTED")
        ? t('rateLimitError')
        : 'Sorry, something went wrong. Please try again.';
      setRecommendations({text: errorMessage, groundingChunks: []});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-lg p-6 relative">
      {!isPremium && <PremiumFeatureLock />}
      <div className={`${!isPremium ? 'blur-sm pointer-events-none' : ''}`}>
        <h3 className="text-2xl font-bold text-content-100 mb-4">{t('eventPlanner')}</h3>
        {locationError && <p className="text-xs text-center bg-yellow-900/50 text-yellow-300 p-2 rounded-md mb-4">{locationError}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-content-200">{t('eventName')}</label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Nairobi Marathon"
              required
            />
          </div>
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-content-200">{t('eventDate')}</label>
            <input
              type="date"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors font-semibold disabled:bg-base-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : t('getRecommendations')}
          </button>
        </form>

        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
          </div>
        )}

        {recommendations && (
          <div className="mt-6 bg-base-100 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-brand-primary mb-2">{t('recoveryTitle')}</h4>
            <div className="prose prose-invert max-w-none text-content-200" dangerouslySetInnerHTML={{ __html: recommendations.text.replace(/\n/g, '<br />') }} />
            
            {recommendations.groundingChunks.length > 0 && (
                <div className="mt-6">
                    <h5 className="font-bold text-content-100 mb-2">{t('relevantLocations')}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recommendations.groundingChunks.map((chunk, index) => chunk.maps && (
                            <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center bg-base-200 p-3 rounded-lg hover:bg-base-300 transition-colors">
                                <MapPinIcon className="w-5 h-5 mr-3 text-brand-primary flex-shrink-0" />
                                <span className="text-sm text-content-200">{chunk.maps.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPlanner;