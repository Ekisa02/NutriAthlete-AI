import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { generateNutritionPlan, getMealDetails, generateSpeech } from '../services/geminiService';
import { NutritionPlan as NutritionPlanType, Meal } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { DownloadIcon, VolumeUpIcon, CloseIcon } from './Icons';

declare const jspdf: any;
declare const html2canvas: any;

const NutritionPlan: React.FC = () => {
  const { userProfile } = useAppContext();
  const { t } = useLocalization();
  const [plan, setPlan] = useState<NutritionPlanType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(0);
  const reportRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalContent, setModalContent] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const fetchPlan = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateNutritionPlan(userProfile);
      setPlan(result);
    } catch (err: any) {
      console.error(err);
      // Since we are loading from a file, rate limit errors are not expected here.
      // Kept a generic error message.
      setError(t('planError'));
    } finally {
      setLoading(false);
    }
  }, [userProfile, t]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleDownload = () => {
    if (reportRef.current) {
      html2canvas(reportRef.current, { backgroundColor: '#1F2937' }).then((canvas: any) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${userProfile?.name}_NutritionPlan.pdf`);
      });
    }
  };

  const handleMealClick = async (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalContent('');
    try {
        const details = await getMealDetails(meal.name, meal.description);
        setModalContent(details);
    } catch (e: any) {
        if (e.toString().includes("RESOURCE_EXHAUSTED")) {
            setModalContent(t('rateLimitError'));
        } else {
            setModalContent("Could not load meal details. Please try again.");
        }
    } finally {
        setIsModalLoading(false);
    }
  };

  const handleListenToTip = async () => {
    const tip = plan?.[activeDay]?.nutritionistTip;
    if (!tip || isSpeaking || !audioContextRef.current) return;

    setIsSpeaking(true);
    try {
        if(audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        const audioBuffer = await generateSpeech(tip, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
    } catch (e: any) {
        console.error("TTS failed:", e);
        if (e.toString().includes("RESOURCE_EXHAUSTED")) {
            alert(t('rateLimitError'));
        }
        setIsSpeaking(false);
    }
  };
  
  const currentDayPlan = plan?.[activeDay];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-base-200 rounded-lg">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
        <p className="mt-4 text-lg text-content-100 font-semibold">{t('generatingPlan')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>;
  }

  if (!plan) return null;

  return (
    <>
      <div className="bg-base-200 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-content-100">{t('nutritionPlan')}</h3>
          <button
            onClick={handleDownload}
            className="flex items-center bg-brand-primary text-white py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors text-sm font-semibold"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            {t('downloadReport')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 border-b border-base-300 pb-4">
            {plan.map((dayPlan, index) => (
                <button
                    key={dayPlan.day}
                    onClick={() => setActiveDay(index)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        activeDay === index ? 'bg-brand-primary text-white' : 'bg-base-300 text-content-200 hover:bg-base-100'
                    }`}
                >
                    {dayPlan.day}
                </button>
            ))}
        </div>

        {currentDayPlan && (
          <div ref={reportRef} className="p-4 bg-base-100 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-200 p-4 rounded-lg col-span-1 md:col-span-2">
                  <h4 className="font-bold text-lg text-brand-primary mb-2">{t('dailySummary')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div><p className="text-sm text-content-200">{t('calories')}</p><p className="font-bold text-xl">{currentDayPlan.dailySummary?.calories ?? 'N/A'} kcal</p></div>
                      <div><p className="text-sm text-content-200">{t('protein')}</p><p className="font-bold text-xl">{currentDayPlan.dailySummary?.protein ?? 'N/A'} g</p></div>
                      <div><p className="text-sm text-content-200">{t('carbs')}</p><p className="font-bold text-xl">{currentDayPlan.dailySummary?.carbs ?? 'N/A'} g</p></div>
                      <div><p className="text-sm text-content-200">{t('fats')}</p><p className="font-bold text-xl">{currentDayPlan.dailySummary?.fats ?? 'N/A'} g</p></div>
                  </div>
              </div>

              {[
                  { title: t('breakfast'), meal: currentDayPlan.meals?.breakfast },
                  { title: t('midMorningSnack'), meal: currentDayPlan.meals?.midMorningSnack },
                  { title: t('lunch'), meal: currentDayPlan.meals?.lunch },
                  { title: t('afternoonSnack'), meal: currentDayPlan.meals?.afternoonSnack },
                  { title: t('dinner'), meal: currentDayPlan.meals?.dinner },
              ].map(({title, meal}) => (
                   meal ? (
                      <div key={title} className="bg-base-200 p-4 rounded-lg group transition-all duration-300 hover:shadow-lg hover:bg-base-300 cursor-pointer" onClick={() => handleMealClick(meal)}>
                          <h5 className="font-bold text-md text-content-100 mb-2">{title}: <span className="text-brand-primary">{meal.name ?? 'N/A'}</span></h5>
                          <p className="text-sm text-content-200 mb-3">{meal.description ?? 'No description available.'}</p>
                          <div className="flex justify-between items-center">
                              <div className="flex space-x-4 text-xs">
                                  <span>P: {meal.macros?.protein ?? 'N/A'}g</span>
                                  <span>C: {meal.macros?.carbs ?? 'N/A'}g</span>
                                  <span>F: {meal.macros?.fats ?? 'N/A'}g</span>
                              </div>
                              <div className="text-xs text-brand-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                {t('readMore')} &rarr;
                              </div>
                          </div>
                      </div>
                   ) : null
              ))}

              <div className="bg-base-200 p-4 rounded-lg col-span-1 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-brand-primary mb-2">{t('nutritionistTip')}</h4>
                      <p className="text-content-200 italic">"{currentDayPlan.nutritionistTip ?? 'No tip for today.'}"</p>
                    </div>
                    <button onClick={handleListenToTip} disabled={isSpeaking} className="flex items-center text-sm bg-brand-primary/20 text-brand-primary py-1 px-3 rounded-full hover:bg-brand-primary/40 transition-colors disabled:opacity-50 disabled:cursor-wait">
                      <VolumeUpIcon className={`w-4 h-4 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`}/>
                      {isSpeaking ? '...' : t('listenToTip')}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
              <div className="bg-base-200 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-200">
                      <h3 className="text-lg font-bold text-brand-primary">{t('mealDetails')}: {selectedMeal?.name}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-content-200 hover:text-white">
                          <CloseIcon className="w-6 h-6"/>
                      </button>
                  </div>
                  <div className="p-6">
                      {isModalLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-brand-primary"></div>
                            <p className="ml-3 text-content-200">{t('gettingDetails')}</p>
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-content-200" dangerouslySetInnerHTML={{ __html: modalContent.replace(/\n/g, '<br />') }} />
                      )}
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default NutritionPlan;
