import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface MultilingualListing {
  id: string;
  title: string;
  type: string;
  description: string;
  address_line: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rent_monthly_eur: number;
  deposit_eur: number;
  bills_included: boolean;
  furnished: boolean;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  size_sqm: number;
  amenities: any[];
  availability_date: string;
  images: string[];
  video_url: string;
  status: string;
  created_at: string;
  published_at: string;
  agency_name: string;
}

export const useMultilingualListings = (limit: number = 1000) => {
  const [listings, setListings] = useState<MultilingualListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_listings_with_agency_multilingual', {
            p_limit: limit,
            p_offset: 0,
            p_language: language
          });

        if (error) {
          console.error('Error fetching multilingual listings:', error);
          setError(error.message);
          return;
        }

        if (data) {
          setListings(data.map((listing: any) => {
            const localizedTitle = listing.title_multilingual?.[language]?.trim() || listing.title_multilingual?.['en']?.trim() || listing.title || 'Untitled Property';
            return {
            id: listing.id,
            title: localizedTitle,
            type: listing.type || 'room',
            description: listing.description || '',
            address_line: listing.address_line || '',
            city: listing.city || '',
            country: listing.country || '',
            lat: listing.lat || 0,
            lng: listing.lng || 0,
            rent_monthly_eur: listing.rent_monthly_eur || 0,
            deposit_eur: listing.deposit_eur || 0,
            bills_included: listing.bills_included || false,
            furnished: listing.furnished || false,
            bedrooms: listing.bedrooms || 0,
            bathrooms: listing.bathrooms || 0,
            floor: listing.floor || '',
            size_sqm: listing.size_sqm || 0,
            amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
            availability_date: listing.availability_date || '',
            images: Array.isArray(listing.images) ? listing.images : [],
            video_url: listing.video_url || '',
            status: listing.status || 'PUBLISHED',
            created_at: listing.created_at || '',
            published_at: listing.published_at || '',
            agency_name: listing.agency_name || 'Agency'
          };
          }));
        }
      } catch (err) {
        console.error('Error fetching multilingual listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [limit, language]);

  return { listings, loading, error };
};