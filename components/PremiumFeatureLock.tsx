
import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { LockIcon } from './Icons';

const PremiumFeatureLock: React.FC = () => {
    const { t } = useLocalization();

    return (
        <div className="absolute inset-0 bg-base-200 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
            <LockIcon className="w-12 h-12 text-brand-primary mb-4" />
            <h4 className="text-xl font-bold text-content-100">{t('premiumFeature')}</h4>
            <p className="text-content-200 mt-1">{t('upgradePrompt')}</p>
            <button className="mt-4 bg-brand-primary text-white py-2 px-6 rounded-full hover:bg-brand-secondary transition-colors font-semibold">
                Upgrade Now
            </button>
        </div>
    );
};

export default PremiumFeatureLock;
    