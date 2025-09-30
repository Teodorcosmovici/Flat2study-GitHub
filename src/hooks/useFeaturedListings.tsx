import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';


interface FeaturedListing {
  id: string;
  title: string;
  address_line: string;
  city: string;
  rent_monthly_eur: number;
  images: string[];
  agency_name: string;
}

export const useFeaturedListings = (limit: number = 6) => {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_listings_with_agency_multilingual', {
            p_limit: limit,
            p_offset: 0,
            p_language: language
          });

        if (error) {
          console.error('Error fetching featured listings:', error);
          setError(error.message);
          return;
        }

        if (data) {
          setListings(data.map((listing: any) => {
            const localizedTitle = listing.title_multilingual?.[language] || listing.title_multilingual?.['en'] || listing.title || 'Property';
            return {
            id: listing.id,
            title: localizedTitle,
            address_line: listing.address_line || '',
            city: listing.city || '',
            rent_monthly_eur: listing.rent_monthly_eur || 0,
            images: Array.isArray(listing.images) ? listing.images : [],
            agency_name: listing.agency_name || 'Agency'
          };
          }));
        }
      } catch (err) {
        console.error('Error fetching featured listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, [limit, language]);

  return { listings, loading, error };
};