import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../constants';

type TranslationKey = keyof (typeof translations)['en'];

export const useLocalization = () => {
  const { language } = useAppContext();

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  }, [language]);

  return { t, language };
};
