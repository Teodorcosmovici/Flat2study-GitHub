import { useLanguage } from '@/contexts/LanguageContext';

// Helper hook to get localized text from multilingual fields
export const useListingText = () => {
  const { language } = useLanguage();
  
  const getLocalizedText = (multilingualField: any, fallback: string = '') => {
    if (!multilingualField || typeof multilingualField !== 'object') {
      return fallback;
    }
    const langValue = multilingualField[language]?.trim();
    const enValue = multilingualField['en']?.trim();
    return langValue || enValue || fallback;
  };

  return { getLocalizedText };
};