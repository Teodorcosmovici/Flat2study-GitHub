import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Listing } from '@/types';
import ListingCard from '@/components/listings/ListingCard';
import Header from '@/components/layout/Header';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavoriteListings();
    }
  }, [user]);

  const fetchFavoriteListings = async () => {
    try {
      setLoading(true);
      
      // First get the favorite listing IDs
      const { data: favoriteIds, error: favError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user?.id);

      if (favError) {
        console.error('Error fetching favorite IDs:', favError);
        return;
      }

      if (!favoriteIds || favoriteIds.length === 0) {
        setFavoriteListings([]);
        return;
      }

      const listingIds = favoriteIds.map(fav => fav.listing_id);

      // Then get the listings with agency details using the existing function
      const { data: listings, error: listingsError } = await supabase.rpc(
        'get_listings_with_agency',
        {
          p_limit: 50,
          p_offset: 0
        }
      );

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
        return;
      }

      // Filter to only include favorited listings and transform the data
      const favoriteListingsData = listings
        ?.filter(listing => listingIds.includes(listing.id))
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          type: listing.type as any, // Type assertion since we know these are valid listing types
          description: listing.description,
          addressLine: listing.address_line,
          city: listing.city,
          country: listing.country,
          lat: listing.lat,
          lng: listing.lng,
          latitude: listing.lat,
          longitude: listing.lng,
          rentMonthlyEur: listing.rent_monthly_eur,
          depositEur: listing.deposit_eur,
          billsIncluded: listing.bills_included,
          furnished: listing.furnished,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          floor: listing.floor,
          sizeSqm: listing.size_sqm,
          amenities: Array.isArray(listing.amenities) ? listing.amenities.map(a => String(a)) : [],
          availabilityDate: listing.availability_date,
          images: Array.isArray(listing.images) ? listing.images.map(i => String(i)) : [],
          videoUrl: listing.video_url,
          status: listing.status as any, // Type assertion for ListingStatus
          createdAt: listing.created_at,
          publishedAt: listing.published_at,
          landlord: {
            id: listing.id, // Using listing id as landlord id since we don't have proper landlord id
            name: listing.agency_name || 'Property Manager',
            phone: '', // Contact info no longer exposed for security
            email: '' // Contact info no longer exposed for security
          }
        })) || [];

      setFavoriteListings(favoriteListingsData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (listingId: string) => {
    setFavoriteListings(prev => prev.filter(listing => listing.id !== listingId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/search">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('favorites.backToSearch')}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Heart className="h-8 w-8 text-favorite" />
                <span>{t('favorites.title')}</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('favorites.savedListings')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('favorites.loadingFavorites')}</p>
            </div>
          </div>
        ) : favoriteListings.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('favorites.noFavoritesYet')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('favorites.noFavoritesDesc')}
            </p>
            <Link to="/search">
              <Button>
                {t('favorites.browseListings')}
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {favoriteListings.length} {favoriteListings.length === 1 ? t('favorites.listingSaved') : t('favorites.listingsSaved')} {t('favorites.saved')}
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favoriteListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}