import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { LogoIcon } from './Icons';

const LoadingIndicator: React.FC = () => {
    const { t } = useLocalization();
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        t('loading1'),
        t('loading2'),
        t('loading3'),
        t('loading4'),
        t('loading5'),
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2000); 

        return () => clearInterval(interval);
    }, [loadingMessages.length]);

    return (
        <div className="flex flex-col items-center justify-center h-64 bg-base-200 rounded-lg p-4 text-center">
            <div className="relative w-20 h-20 mb-4">
                <LogoIcon className="w-20 h-20 text-brand-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                </div>
            </div>
            <p className="mt-2 text-lg text-content-100 font-semibold transition-opacity duration-500">
                {loadingMessages[loadingMessageIndex]}
            </p>
        </div>
    );
};

export default LoadingIndicator;
