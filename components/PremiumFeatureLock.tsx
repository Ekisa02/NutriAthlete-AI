

import React, { useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../contexts/AppContext';
import { initiateMpesaPayment } from '../services/geminiService';
import { LockIcon, CloseIcon, PhoneIcon, SparklesIcon, InfoIcon, ShieldCheckIcon, MpesaIcon } from './Icons';

type PaymentStep = 'closed' | 'input' | 'final_confirmation' | 'simulatedPin' | 'processing' | 'success';

const PremiumFeatureLock: React.FC = () => {
    const { userProfile, setUserProfile } = useAppContext();
    const { t } = useLocalization();
    const [paymentStep, setPaymentStep] = useState<PaymentStep>('closed');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleUpgradeClick = () => {
        setPaymentStep('input');
        setPaymentError(null);
        setPhoneNumber('');
        setPin('');
    };

    const closeModal = () => {
        setPaymentStep('closed');
    };

    const handleInitiatePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^254\d{9}$/.test(phoneNumber)) {
            setPaymentError(t('invalidPhoneNumber'));
            return;
        }
        setPaymentError(null);
        setPaymentStep('final_confirmation');
    };

    const handleConfirmPayment = () => {
        setPaymentStep('simulatedPin');
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const PREMIUM_PRICE = 999;
        setPaymentStep('processing');

        try {
            const result = await initiateMpesaPayment(phoneNumber, PREMIUM_PRICE);
            if (result.success) {
                setPaymentStep('success');
                setTimeout(() => {
                    if (userProfile) {
                        setUserProfile({ ...userProfile, subscription: 'Premium' });
                    }
                    closeModal();
                }, 3000);
            } else {
                setPaymentStep('input');
                setPaymentError(t('paymentFailed'));
            }
        } catch (error) {
            console.error("Payment failed:", error);
            setPaymentStep('input');
            setPaymentError(t('paymentFailed'));
        }
    };

    return (
        <>
            <div className="absolute inset-0 bg-base-200 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                <LockIcon className="w-12 h-12 text-brand-primary mb-4" />
                <h4 className="text-xl font-bold text-content-100">{t('premiumFeature')}</h4>
                <p className="text-content-200 mt-1">{t('upgradePrompt')}</p>
                <button 
                    onClick={handleUpgradeClick}
                    className="mt-4 bg-brand-primary text-white py-2 px-6 rounded-full hover:bg-brand-secondary transition-colors font-semibold">
                    {t('upgradeNow')}
                </button>
            </div>
            
            {paymentStep !== 'closed' && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-base-200 rounded-lg shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        
                        {paymentStep !== 'simulatedPin' && (
                            <div className="p-4 border-b border-base-300 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-brand-primary">
                                    {paymentStep === 'input' && t('upgradeNow')}
                                    {paymentStep === 'final_confirmation' && t('finalConfirmationTitle')}
                                    {paymentStep === 'processing' && t('processingPayment')}
                                    {paymentStep === 'success' && t('upgradeSuccessTitle')}
                                </h3>
                                <button onClick={closeModal} className="text-content-200 hover:text-white">
                                    <CloseIcon className="w-6 h-6"/>
                                </button>
                            </div>
                        )}
                        
                        {paymentStep === 'input' && (
                            <form className="p-6" onSubmit={handleInitiatePayment}>
                                <p className="text-center text-content-200 mb-4">{t('premiumBenefits')}</p>
                                <label htmlFor="phone" className="block text-sm font-medium text-content-200 mb-1">{t('safaricomNumber')}</label>
                                <div className="relative">
                                    <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-content-200" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            setPhoneNumber(e.target.value);
                                            setPaymentError(null);
                                        }}
                                        placeholder={t('safaricomNumberPlaceholder')}
                                        className="w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                    />
                                </div>
                                {paymentError && <p className="text-red-400 text-xs mt-2">{paymentError}</p>}
                                <button type="submit" className="mt-4 w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-secondary transition-colors font-bold">
                                    {t('upgradeAmount')}
                                </button>
                                <div className="flex items-center justify-center gap-2 text-xs text-content-200 mt-4">
                                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                                  <span>{t('sandboxDisclaimer')}</span>
                                </div>
                            </form>
                        )}

                        {paymentStep === 'final_confirmation' && (
                            <div className="p-6 text-center flex flex-col items-center">
                                <InfoIcon className="w-12 h-12 text-blue-400 mb-4" />
                                <h4 className="text-xl font-semibold text-content-100 mb-2">{t('finalConfirmationTitle')}</h4>
                                <p className="text-content-200 mb-6 max-w-sm">
                                    {t('finalConfirmationMessageUpgrade')
                                        .replace('{amount}', 'KES 999')
                                        .replace('{phoneNumber}', phoneNumber)}
                                </p>
                                <div className="flex justify-center gap-4 w-full">
                                    <button onClick={() => setPaymentStep('input')} className="w-full bg-base-300 text-content-100 py-3 rounded-lg hover:bg-gray-500 transition-colors font-bold">{t('cancel')}</button>
                                    <button onClick={handleConfirmPayment} className="w-full bg-brand-primary text-white py-3 rounded-lg hover:bg-brand-secondary transition-colors font-bold">{t('proceed')}</button>
                                </div>
                            </div>
                        )}
                         
                        {paymentStep === 'simulatedPin' && (
                           <form onSubmit={handlePinSubmit} className="bg-white text-black p-4 rounded-lg flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                   <MpesaIcon />
                                   <h3 className="font-bold text-lg">{t('enterMpesaPin')}</h3>
                                </div>
                                <p className="text-sm text-gray-700">{t('toCompletePaymentTo')} <span className="font-bold">OptiFuel</span>.</p>
                                <div className="text-sm">{t('amount')}: <span className="font-bold">KES 999.00</span></div>
                                <div>
                                    <label htmlFor="pin" className="text-sm font-bold">{t('pin')}:</label>
                                    <input
                                        id="pin"
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        maxLength={4}
                                        className="w-full border-b-2 border-gray-300 focus:border-green-500 outline-none text-center tracking-widest"
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={closeModal} className="font-bold text-green-600 uppercase">{t('cancel')}</button>
                                    <button type="submit" disabled={pin.length < 4} className="font-bold text-green-600 uppercase disabled:text-gray-400">{t('ok')}</button>
                                </div>
                           </form>
                        )}
                        
                        {paymentStep === 'processing' && (
                            <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mb-4"></div>
                                <h4 className="text-xl font-bold text-content-100">{t('processingPayment')}</h4>
                                <p className="text-content-200 mt-2 max-w-xs">{t('stkPushSent')}</p>
                            </div>
                        )}

                        {paymentStep === 'success' && (
                            <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                                <SparklesIcon className="w-20 h-20 text-yellow-400 mb-4" />
                                <h4 className="text-2xl font-bold text-content-100">{t('upgradeSuccessTitle')}</h4>
                                <p className="text-content-200 mt-2">{t('upgradeSuccessMessage')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default PremiumFeatureLock;