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
      const bedroomCount = bedrooms ? Number(bedrooms) : 1;
      const bathroomCount = bathrooms ? Number(bathrooms) : 1;
      baseTitle = `Apartment - ${bedroomCount} bedroom${bedroomCount > 1 ? 's' : ''}, ${bathroomCount} bathroom${bathroomCount > 1 ? 's' : ''}`;
      break;
      
    case 'studio':
      const studioBathrooms = bathrooms ? Number(bathrooms) : 1;
      baseTitle = `Studio - ${studioBathrooms} bathroom${studioBathrooms > 1 ? 's' : ''}`;
      break;
      
    case 'room_shared':
    case 'room':
      if (totalBedrooms && totalBathrooms) {
        baseTitle = `Room - in ${totalBedrooms} bedroom, ${totalBathrooms} bathroom apartment`;
      } else {
        baseTitle = `Room - ${translate('createListing.roomShared')}`;
      }
      break;
      
    case 'bedspace_shared':
    case 'bedspace':
      if (totalBedrooms && totalBathrooms) {
        baseTitle = `Bedspace - in ${totalBedrooms} bedroom, ${totalBathrooms} bathroom apartment`;
      } else {
        baseTitle = `Bedspace - ${translate('createListing.bedspaceShared')}`;
      }
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