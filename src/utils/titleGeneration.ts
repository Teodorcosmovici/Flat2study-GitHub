import { useLanguage } from '@/contexts/LanguageContext';

interface TitleGenerationParams {
  type: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  address?: string;
  totalBedrooms?: number | string;
  totalBathrooms?: number | string;
}

export const generateListingTitle = (
  params: TitleGenerationParams,
  t?: (key: string) => string
): string => {
  const { type, bedrooms, bathrooms, address, totalBedrooms, totalBathrooms } = params;
  
  // Fallback translation function if t is not provided
  const translate = t || ((key: string) => {
    const translations: Record<string, string> = {
      'createListing.studio': 'Studio',
      'createListing.roomShared': 'Room in shared apartment',
      'createListing.bedspaceShared': 'Bedspace in shared apartment',
      'createListing.entireProperty': 'Apartment'
    };
    return translations[key] || key;
  });

  let baseTitle = '';

  switch (type) {
    case 'entire_property':
    case 'apartment':
      baseTitle = 'Apartment';
      break;
      
    case 'studio':
      baseTitle = 'Studio';
      break;
      
    case 'room_shared':
    case 'room':
      baseTitle = 'Room';
      break;
      
    case 'bedspace_shared':
    case 'bedspace':
      baseTitle = 'Bedspace';
      break;
      
    default:
      baseTitle = 'Property';
  }

  // Add address if provided
  if (address && address.trim()) {
    return `${baseTitle} in ${address.trim()}`;
  }

  return baseTitle;
};

export const useListingTitleGenerator = () => {
  const { t } = useLanguage();
  
  return (params: TitleGenerationParams) => generateListingTitle(params, t);
};