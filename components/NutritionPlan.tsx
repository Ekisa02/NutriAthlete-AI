

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { generateNutritionPlan, generateSpeech, getDeliveryOptionsForMeal, initiateMpesaPayment } from '../services/geminiService';
import { NutritionPlan as NutritionPlanType, Meal, MealDeliveryOption } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { DownloadIcon, VolumeUpIcon, CloseIcon, SunIcon, CoffeeIcon, FlameIcon, MoonIcon, ShoppingBagIcon, StoreIcon, ClockIcon, StarIcon, ChevronLeftIcon, CheckCircleIcon, FileTextIcon, PhoneIcon, ScaleIcon, CheckIcon } from './Icons';
import LoadingIndicator from './LoadingIndicator';

declare const jspdf: any;
declare const html2canvas: any;

interface DeliveryModalState {
    isOpen: boolean;
    meal: Meal | null;
    step: 'loading' | 'list' | 'compare' | 'confirm' | 'payment' | 'processingPayment' | 'success';
    options: MealDeliveryOption[];
    selectedOption: MealDeliveryOption | null;
    phoneNumber: string;
    paymentError: string | null;
    isCompareMode: boolean;
    comparisonItems: MealDeliveryOption[];
}

const AllergyWarning: React.FC = () => {
    const { userProfile } = useAppContext();
    const { t } = useLocalization();
    const [isVisible, setIsVisible] = useState(true);

    const allergies = [
        ...(userProfile?.dietaryRestrictions.allergies || []),
        userProfile?.dietaryRestrictions.otherAllergy
    ].filter(Boolean);

    if (allergies.length === 0 || !isVisible) {
        return null;
    }
    
    const allergyList = allergies.join(', ');
    const warningText = t('allergyWarningText').replace('{allergies}', allergyList);

    return (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">{t('allergyWarningTitle')}! </strong>
            <span className="block sm:inline">{warningText}</span>
            <button onClick={() => setIsVisible(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
               <CloseIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

const NutritionPlan: React.FC = () => {
  const { userProfile } = useAppContext();
  const { t } = useLocalization();
  const [plan, setPlan] = useState<NutritionPlanType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(0);
  const reportRef = useRef<HTMLDivElement>(null);

  // Meal Details Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalContent, setModalContent] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // Delivery Modal State
  const [deliveryModalState, setDeliveryModalState] = useState<DeliveryModalState>({
      isOpen: false,
      meal: null,
      step: 'loading',
      options: [],
      selectedOption: null,
      phoneNumber: '',
      paymentError: null,
      isCompareMode: false,
      comparisonItems: [],
  });

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const mealIcons: { [key: string]: React.ReactElement } = {
    [t('breakfast')]: <SunIcon className="w-8 h-8 text-yellow-400" />,
    [t('midMorningSnack')]: <CoffeeIcon className="w-8 h-8 text-orange-400" />,
    [t('lunch')]: <FlameIcon className="w-8 h-8 text-red-500" />,
    [t('afternoonSnack')]: <CoffeeIcon className="w-8 h-8 text-orange-400" />,
    [t('dinner')]: <MoonIcon className="w-8 h-8 text-indigo-400" />,
  };


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
      html2canvas(reportRef.current, { backgroundColor: '#0D1117' }).then((canvas: any) => {
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

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
    setIsModalLoading(false); // No loading needed as data is local

    let content = `<p class="mb-4 text-content-200">${meal.description}</p>`;

    if (meal.ingredients && meal.ingredients.length > 0) {
        content += `<h4 class="font-bold text-md text-content-100 mb-2">${t('ingredients')}</h4><ul class="list-disc list-inside space-y-1 text-content-200">` 
            + meal.ingredients.map(i => `<li>${i}</li>`).join('') 
            + '</ul>';
    }

    if (meal.preparation && meal.preparation.length > 0) {
        content += `<h4 class="font-bold text-md text-content-100 mt-4 mb-2">${t('preparation')}</h4><ol class="list-decimal list-inside space-y-1 text-content-200">` 
            + meal.preparation.map(p => `<li>${p}</li>`).join('') 
            + '</ol>';
    }

    if (!meal.ingredients && !meal.preparation) {
        content = `<p>Details for this meal are not available.</p>`;
    }
    
    setModalContent(content);
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

  const handleOrderDeliveryClick = async (e: React.MouseEvent, meal: Meal) => {
    e.stopPropagation();
    if (!userProfile) return;
    setDeliveryModalState({ isOpen: true, meal, step: 'loading', options: [], selectedOption: null, phoneNumber: '', paymentError: null, isCompareMode: false, comparisonItems: [] });
    
    try {
      const options = await getDeliveryOptionsForMeal(meal.name, userProfile.geographicalArea);
      setDeliveryModalState(prev => ({ ...prev, options, step: 'list' }));
    } catch (err) {
      console.error("Failed to fetch delivery options:", err);
      setDeliveryModalState(prev => ({ ...prev, step: 'list', options: [] })); // Show empty list on error
    }
  };
  
  const closeDeliveryModal = () => {
      setDeliveryModalState({ isOpen: false, meal: null, step: 'loading', options: [], selectedOption: null, phoneNumber: '', paymentError: null, isCompareMode: false, comparisonItems: [] });
  };

  const handleSelectOption = (option: MealDeliveryOption) => {
      setDeliveryModalState(prev => ({ ...prev, selectedOption: option, step: 'confirm' }));
  };

  const handleProceedToPayment = () => {
      setDeliveryModalState(prev => ({ ...prev, step: 'payment' }));
  };
  
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { phoneNumber, selectedOption } = deliveryModalState;
    if (!selectedOption) return;

    // Basic validation
    if (!/^254\d{9}$/.test(phoneNumber)) {
        setDeliveryModalState(prev => ({ ...prev, paymentError: t('invalidPhoneNumber')}));
        return;
    }

    setDeliveryModalState(prev => ({ ...prev, step: 'processingPayment', paymentError: null }));

    try {
        const result = await initiateMpesaPayment(phoneNumber, selectedOption.price);
        if (result.success) {
            setDeliveryModalState(prev => ({ ...prev, step: 'success' }));
            setTimeout(() => {
                closeDeliveryModal();
            }, 3000);
        } else {
            setDeliveryModalState(prev => ({ ...prev, step: 'payment', paymentError: t('paymentFailed') }));
        }
    } catch (error) {
        console.error("Payment failed:", error);
        setDeliveryModalState(prev => ({ ...prev, step: 'payment', paymentError: t('paymentFailed') }));
    }
  };


  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => <StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />)}
            {halfStar && <StarIcon key="half" className="w-4 h-4 text-yellow-400 fill-current" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />}
            {[...Array(emptyStars)].map((_, i) => <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-500" />)}
        </div>
    );
  };

  const handleToggleComparisonItem = (option: MealDeliveryOption) => {
        setDeliveryModalState(prev => {
            const isSelected = prev.comparisonItems.some(item => item.mealName === option.mealName && item.partnerName === option.partnerName);
            if (isSelected) {
                return {
                    ...prev,
                    comparisonItems: prev.comparisonItems.filter(item => !(item.mealName === option.mealName && item.partnerName === option.partnerName))
                };
            } else {
                return {
                    ...prev,
                    comparisonItems: [...prev.comparisonItems, option]
                };
            }
        });
    };

    let comparisonMetrics = {
        bestPrice: Infinity,
        fastestTime: Infinity,
        highestRating: -Infinity,
    };

    if (deliveryModalState.step === 'compare' && deliveryModalState.comparisonItems.length > 0) {
        comparisonMetrics.bestPrice = Math.min(...deliveryModalState.comparisonItems.map(i => i.price));
        comparisonMetrics.fastestTime = Math.min(...deliveryModalState.comparisonItems.map(i => parseInt(i.deliveryTime.split('-')[0])));
        comparisonMetrics.highestRating = Math.max(...deliveryModalState.comparisonItems.map(i => i.rating));
    }
  
  const currentDayPlan = plan?.[activeDay];

  if (loading) {
    return <LoadingIndicator />;
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

        <AllergyWarning />

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
                      <div key={title} className="bg-base-200 p-4 rounded-lg group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                              {mealIcons[title]}
                          </div>
                          <div className="flex-grow">
                              <h5 className="font-bold text-md text-content-100 mb-1">{title}: <span className="text-brand-primary">{meal.name ?? 'N/A'}</span></h5>
                              <p className="text-sm text-content-200 mb-3">{meal.description ?? 'No description available.'}</p>
                              <div className="flex justify-between items-center">
                                  <div className="flex space-x-4 text-xs">
                                      <span>P: {meal.macros?.protein ?? 'N/A'}g</span>
                                      <span>C: {meal.macros?.carbs ?? 'N/A'}g</span>
                                      <span>F: {meal.macros?.fats ?? 'N/A'}g</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <button
                                        onClick={(e) => handleOrderDeliveryClick(e, meal)}
                                        title={t('orderDelivery')}
                                        className="p-2 rounded-full bg-base-100 hover:bg-brand-primary/20 text-brand-primary transition-colors"
                                    >
                                        <ShoppingBagIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleMealClick(meal)} className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold hover:underline">
                                        <div className="p-1.5 rounded-full bg-base-100">
                                            <FileTextIcon className="w-4 h-4" />
                                        </div>
                                        {t('readMore')} &rarr;
                                    </button>
                                  </div>
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
                        <div className="max-w-none" dangerouslySetInnerHTML={{ __html: modalContent }} />
                      )}
                  </div>
              </div>
          </div>
      )}
      {deliveryModalState.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeDeliveryModal}>
            <div className="bg-base-200 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                       {(deliveryModalState.step === 'confirm' || deliveryModalState.step === 'payment' || deliveryModalState.step === 'compare') && (
                           <button onClick={() => setDeliveryModalState(prev => ({...prev, step: 'list', paymentError: null}))} className="mr-2 text-content-200 hover:text-white"><ChevronLeftIcon className="w-6 h-6"/></button>
                       )}
                       <h3 className="text-lg font-bold text-brand-primary">
                          {deliveryModalState.step === 'list' && `${t('compareAndOrder')}`}
                          {deliveryModalState.step === 'compare' && `${t('comparisonTitle')}`}
                          {deliveryModalState.step === 'confirm' && `${t('confirmOrderTitle')}`}
                          {deliveryModalState.step === 'payment' && `${t('initiatePayment')}`}
                          {deliveryModalState.step === 'processingPayment' && `${t('processingPayment')}`}
                          {deliveryModalState.step === 'success' && `${t('orderPlaced')}`}
                       </h3>
                    </div>
                    <button onClick={closeDeliveryModal} className="text-content-200 hover:text-white">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {deliveryModalState.step === 'loading' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                            <p className="mt-4 text-content-200">{t('gettingDetails')}...</p>
                        </div>
                    )}
                    {deliveryModalState.step === 'list' && (
                        <>
                           <div className="flex justify-between items-center p-4">
                               <p className="text-sm text-content-200">{t('deliveryOptionsFor')} <strong>{deliveryModalState.meal?.name}</strong>:</p>
                               <button onClick={() => setDeliveryModalState(prev => ({...prev, isCompareMode: !prev.isCompareMode, comparisonItems: []}))} className="flex items-center text-sm text-brand-primary font-semibold py-1 px-2 rounded-md hover:bg-brand-primary/10 transition-colors">
                                   <ScaleIcon className="w-4 h-4 mr-2"/>
                                   {deliveryModalState.isCompareMode ? t('exitCompareMode') : t('enableCompareMode')}
                               </button>
                           </div>
                           {deliveryModalState.options.length > 0 ? (
                               <div className="space-y-3 p-4 pt-0">
                                   {deliveryModalState.options.map(option => {
                                       const isSelectedForCompare = deliveryModalState.comparisonItems.some(item => item.mealName === option.mealName && item.partnerName === option.partnerName);
                                       return (
                                       <div key={option.partnerName + option.mealName} className="bg-base-100 p-3 rounded-lg flex items-center gap-4">
                                            {deliveryModalState.isCompareMode && (
                                                <div 
                                                    onClick={() => handleToggleComparisonItem(option)}
                                                    className={`w-6 h-6 border-2 flex-shrink-0 ${isSelectedForCompare ? 'bg-brand-primary border-brand-primary' : 'border-base-300'} rounded-md flex items-center justify-center cursor-pointer transition-colors`}
                                                >
                                                    {isSelectedForCompare && <CheckIcon className="w-4 h-4 text-white" />}
                                                </div>
                                            )}
                                           <div className="flex-grow">
                                               <div className="flex justify-between items-center mb-2">
                                                   <h4 className="font-bold text-content-100">{option.mealName}</h4>
                                                   <span className="text-sm font-semibold text-brand-primary">{option.currency} {option.price.toFixed(2)}</span>
                                               </div>
                                                <p className="text-xs text-content-200 mb-3">via {option.partnerName}</p>
                                               <div className="flex items-center justify-between text-xs text-content-200 border-t border-base-300 pt-2">
                                                   <div className="flex items-center gap-1"><ClockIcon className="w-4 h-4"/><span>{option.deliveryTime}</span></div>
                                                   <div className="flex items-center gap-1">{renderStarRating(option.rating)}<span>({option.rating})</span></div>
                                                   {!deliveryModalState.isCompareMode &&
                                                      <button onClick={() => handleSelectOption(option)} className="bg-brand-primary text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-brand-secondary transition-colors">{t('orderNow')}</button>
                                                   }
                                               </div>
                                               {option.specialOffer && <p className="text-xs text-green-400 mt-2 font-semibold">{option.specialOffer}</p>}
                                           </div>
                                       </div>
                                   )})}
                               </div>
                           ) : (
                               <p className="text-center text-content-200 py-12">{t('noDeliveryOptions')}</p>
                           )}
                           {deliveryModalState.isCompareMode && (
                                <div className="p-4 sticky bottom-0 bg-base-200 border-t border-base-300">
                                    <button
                                        onClick={() => setDeliveryModalState(prev => ({...prev, step: 'compare'}))}
                                        disabled={deliveryModalState.comparisonItems.length < 2}
                                        className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold transition-colors disabled:bg-base-300 disabled:text-content-200 disabled:cursor-not-allowed"
                                    >
                                        {t('compareSelected')} ({deliveryModalState.comparisonItems.length})
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {deliveryModalState.step === 'compare' && (
                        <div className="p-4 overflow-x-auto">
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${deliveryModalState.comparisonItems.length}, minmax(180px, 1fr))`}}>
                                {deliveryModalState.comparisonItems.map(item => {
                                    const isBestPrice = item.price === comparisonMetrics.bestPrice;
                                    const isFastest = parseInt(item.deliveryTime.split('-')[0]) === comparisonMetrics.fastestTime;
                                    const isHighestRating = item.rating === comparisonMetrics.highestRating;

                                    return (
                                        <div key={item.partnerName + item.mealName} className="bg-base-100 p-3 rounded-lg flex flex-col text-sm">
                                            <h4 className="font-bold text-content-100 text-base">{item.mealName}</h4>
                                            <p className="text-xs text-content-200 mb-4">via {item.partnerName}</p>
                                            <div className="space-y-2 flex-grow mb-4">
                                               <div className={`p-2 rounded-md ${isBestPrice ? 'bg-green-900/50' : 'bg-base-300/30'}`}><span className="font-semibold">{t('price')}:</span> <span className={isBestPrice ? 'text-green-400 font-bold' : ''}>{item.currency} {item.price.toFixed(2)}</span> {isBestPrice && <span className="text-xs text-green-400 ml-1">({t('bestValue')})</span>}</div>
                                               <div className={`p-2 rounded-md ${isFastest ? 'bg-green-900/50' : 'bg-base-300/30'}`}><span className="font-semibold">{t('deliveryTime')}:</span> <span className={isFastest ? 'text-green-400 font-bold' : ''}>{item.deliveryTime}</span></div>
                                               <div className={`p-2 rounded-md ${isHighestRating ? 'bg-green-900/50' : 'bg-base-300/30'}`}><span className="font-semibold">{t('rating')}:</span> <span className={isHighestRating ? 'text-green-400 font-bold' : ''}>{item.rating} / 5.0</span></div>
                                            </div>
                                            <button onClick={() => handleSelectOption(item)} className="mt-auto bg-brand-primary text-white text-sm font-bold py-2 px-3 rounded-md hover:bg-brand-secondary transition-colors w-full">{t('orderNow')}</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {deliveryModalState.step === 'confirm' && deliveryModalState.selectedOption && (
                        <div className="p-6 text-center">
                            <h4 className="text-xl font-semibold text-content-100 mb-2">{deliveryModalState.selectedOption.mealName}</h4>
                            <p className="text-content-200 mb-4">{t('from')} <span className="font-bold">{deliveryModalState.selectedOption.partnerName}</span></p>
                             <div className="bg-base-100 p-4 rounded-lg mb-6">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-content-200">{t('price')}</span>
                                    <span className="font-bold text-brand-primary">{deliveryModalState.selectedOption.currency} {deliveryModalState.selectedOption.price.toFixed(2)}</span>
                                </div>
                             </div>
                             <button onClick={handleProceedToPayment} className="w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-secondary transition-colors font-bold">{t('confirmPurchase')}</button>
                        </div>
                    )}
                     {deliveryModalState.step === 'payment' && deliveryModalState.selectedOption && (
                        <form className="p-6" onSubmit={handlePaymentSubmit}>
                            <label htmlFor="phone" className="block text-sm font-medium text-content-200 mb-1">{t('safaricomNumber')}</label>
                             <div className="relative">
                                <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-content-200" />
                                <input
                                    type="tel"
                                    id="phone"
                                    value={deliveryModalState.phoneNumber}
                                    onChange={(e) => setDeliveryModalState(prev => ({ ...prev, phoneNumber: e.target.value, paymentError: null }))}
                                    placeholder={t('safaricomNumberPlaceholder')}
                                    className="w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                />
                            </div>
                            {deliveryModalState.paymentError && <p className="text-red-400 text-xs mt-2">{deliveryModalState.paymentError}</p>}
                            <button type="submit" className="mt-4 w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-secondary transition-colors font-bold">
                                {t('payAmount')} {deliveryModalState.selectedOption.currency} {deliveryModalState.selectedOption.price.toFixed(2)}
                            </button>
                        </form>
                    )}
                    {deliveryModalState.step === 'processingPayment' && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mb-4"></div>
                            <h4 className="text-xl font-bold text-content-100">{t('processingPayment')}</h4>
                            <p className="text-content-200 mt-2 max-w-xs">{t('stkPushSent')}</p>
                        </div>
                    )}
                    {deliveryModalState.step === 'success' && (
                         <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <CheckCircleIcon className="w-20 h-20 text-green-400 mb-4" />
                            <h4 className="text-2xl font-bold text-content-100">{t('orderPlaced')}</h4>
                            <p className="text-content-200 mt-2">{t('orderPlacedMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default NutritionPlan;