
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../constants';

type TranslationKey = keyof (typeof translations)['en'];

export const useLocalization = () => {
  const { language } = useAppContext();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  };

  return { t, language };
};
   