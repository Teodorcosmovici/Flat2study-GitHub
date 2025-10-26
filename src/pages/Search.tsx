import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { FeaturedListingCard } from '@/components/listings/FeaturedListingCard';
import SearchFilters from '@/components/search/SearchFilters';
import MobileCompactControls from '@/components/search/MobileCompactControls';
import SimpleMapView from '@/components/map/SimpleMapView';
import { Listing, SearchFilters as SearchFiltersType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAllListings } from '@/utils/geocoding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Grid, Map, MapPin, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'grid' | 'map';

export default function Search() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const [visibleListings, setVisibleListings] = useState<Listing[]>([]);

  const formatPrice = (price: number) => {
    return `€${price.toLocaleString()}`;
  };

  // Set appropriate default view mode based on device
  useEffect(() => {
    if (isMobile) {
      setViewMode('grid');
    } else {
      setViewMode('map');
    }
  }, [isMobile]);

  // Fetch listings from database
  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Use multilingual function to get localized fields
        const { data, error } = await supabase.rpc('get_listings_with_agency_multilingual', {
          p_limit: 100,
          p_offset: 0,
          p_language: language
        });

        if (error) {
          console.error('Error fetching listings:', error);
          return;
        }

        // Transform the data to match our Listing type
        const transformedListings: Listing[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          description: item.description,
          addressLine: item.address_line,
          city: item.city,
          country: item.country,
          lat: item.lat,
          lng: item.lng,
          rentMonthlyEur: item.rent_monthly_eur,
          depositEur: item.deposit_eur,
          billsIncluded: item.bills_included,
          furnished: item.furnished,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          floor: item.floor,
          sizeSqm: item.size_sqm,
          amenities: item.amenities || [],
          availabilityDate: item.availability_date,
          images: item.images || [],
          videoUrl: item.video_url,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          status: item.status,
          landlord: {
            id: item.id, // Using listing id as landlord id for now
            name: (item.agency_name && item.agency_name.trim()) ? item.agency_name : 'Property Manager',
            phone: '', // Contact info no longer exposed for security
            email: '' // Contact info no longer exposed for security
          }
        }));

        setAllListings(transformedListings);
        
        // Auto-geocode listings if not done yet
        if (!geocodingComplete && transformedListings.length > 0) {
          handleGeocodeAll();
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [language]);

  // Filter listings based on search criteria
  useEffect(() => {
    let filtered = [...allListings];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.addressLine.toLowerCase().includes(query) ||
        listing.city.toLowerCase().includes(query) ||
        listing.amenities.some(amenity => amenity.toLowerCase().includes(query))
      );
    }

    // Price range
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(listing => listing.rentMonthlyEur >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(listing => listing.rentMonthlyEur <= filters.priceMax!);
    }

    // Property type
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(listing => filters.type!.includes(listing.type));
    }

    // Bedrooms
    if (filters.bedrooms !== undefined) {
      if (filters.bedrooms === 3) {
        filtered = filtered.filter(listing => listing.bedrooms >= 3);
      } else {
        filtered = filtered.filter(listing => listing.bedrooms === filters.bedrooms);
      }
    }

    // Furnished
    if (filters.furnished) {
      filtered = filtered.filter(listing => listing.furnished);
    }

    // Amenities
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(listing =>
        filters.amenities!.every(amenity => listing.amenities.includes(amenity))
      );
    }

    // Availability date
    if (filters.availabilityDate) {
      filtered = filtered.filter(listing => 
        new Date(listing.availabilityDate) <= new Date(filters.availabilityDate!)
      );
    }

    // Sort results
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.rentMonthlyEur - b.rentMonthlyEur);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.rentMonthlyEur - a.rentMonthlyEur);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'distance':
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setListings(filtered);
    // Initialize visible listings for map view
    if (viewMode === 'map') {
      setVisibleListings(filtered);
    }
  }, [searchQuery, filters, sortBy, allListings, viewMode]);

  const handleListingClick = (listingId: string) => {
    navigate(`/listing/${listingId}`);
  };

  const handleGeocodeAll = async () => {
    try {
      console.log('Auto-geocoding listings...');
      const result = await geocodeAllListings();
      console.log('Geocoding results:', result);
      setGeocodingComplete(true);
      
      // Refresh listings after geocoding
      setTimeout(() => {
        fetchListings();
      }, 1000);
      
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_listings_with_agency_multilingual', {
        p_limit: 100,
        p_offset: 0,
        p_language: language
      });

      if (error) {
        console.error('Error fetching listings:', error);
        return;
      }

      const transformedListings: Listing[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        addressLine: item.address_line,
        city: item.city,
        country: item.country,
        lat: item.lat,
        lng: item.lng,
        rentMonthlyEur: item.rent_monthly_eur,
        depositEur: item.deposit_eur,
        billsIncluded: item.bills_included,
        furnished: item.furnished,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        floor: item.floor,
        sizeSqm: item.size_sqm,
        amenities: item.amenities || [],
        availabilityDate: item.availability_date,
        images: item.images || [],
        videoUrl: item.video_url,
        createdAt: item.created_at,
        publishedAt: item.published_at,
        status: item.status,
        landlord: {
          id: item.id,
          name: (item.agency_name && item.agency_name.trim()) ? item.agency_name : 'Property Manager',
          phone: '',
          email: ''
        }
      }));

      setAllListings(transformedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleMapBoundsChange = (bounds: { north: number; south: number; east: number; west: number }) => {
    const visible = listings.filter(listing => 
      listing.lat >= bounds.south && 
      listing.lat <= bounds.north && 
      listing.lng >= bounds.west && 
      listing.lng <= bounds.east
    );
    setVisibleListings(visible);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Search Section */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        {/* Return Home Button */}
        <div className="container pt-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="container pb-2">
          {isMobile ? (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              
              {/* Sort Controls */}
              <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t('search.sortBy')}</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[70] bg-popover border shadow-lg">
                    <SelectItem value="relevance">{t('search.relevance')}</SelectItem>
                    <SelectItem value="price-low">{t('search.priceLowHigh')}</SelectItem>
                    <SelectItem value="price-high">{t('search.priceHighLow')}</SelectItem>
                    <SelectItem value="newest">{t('search.newest')}</SelectItem>
                    <SelectItem value="distance">{t('search.distance')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none border-r"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-l-none"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Compact Controls vs Desktop Filters */}
        {isMobile ? (
          <MobileCompactControls
            filters={filters}
            onFiltersChange={setFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <div className="border-b">
            <SearchFilters 
              filters={filters}
              onFiltersChange={setFilters}
              className="max-w-none"
            />
          </div>
        )}
      </div>

      {/* Main Content - Full width layout */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">{t('search.loading')}</span>
        </div>
      ) : viewMode === 'map' ? (
        /* Map View - Use full height for mobile */
        isMobile ? (
          <div className="h-[calc(100vh-64px-120px)] w-full">
            <SimpleMapView 
              listings={listings}
              onListingClick={handleListingClick}
              hoveredListingId={hoveredListingId}
              onListingHover={setHoveredListingId}
              onBoundsChange={handleMapBoundsChange}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="fixed top-[180px] left-0 right-0 bottom-0 flex gap-4 p-4">
            {/* Scrollable listings container - 50% width */}
            <div className="w-1/2 overflow-y-auto overflow-x-hidden">
              <div className="grid grid-cols-2 gap-4 pr-2">
                {visibleListings.map((listing) => (
                  <div 
                    key={listing.id}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                  >
                    <FeaturedListingCard
                      listing={{
                        id: listing.id,
                        title: listing.title,
                        images: listing.images,
                        rent_monthly_eur: listing.rentMonthlyEur,
                        address_line: listing.addressLine,
                        city: listing.city
                      }}
                      formatPrice={formatPrice}
                      viewDetailsText={t('home.viewDetails')}
                    />
                  </div>
                ))}
                
                {visibleListings.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">{t('search.noPropertiesView')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('search.moveMap')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Map - Right Side - 50% */}
            <div className="w-1/2 flex-shrink-0">
              <SimpleMapView 
                listings={listings}
                onListingClick={handleListingClick}
                hoveredListingId={hoveredListingId}
                onListingHover={setHoveredListingId}
                onBoundsChange={handleMapBoundsChange}
                className="h-full w-full rounded-lg"
              />
            </div>
          </div>
        )
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {listings.map((listing) => (
              <FeaturedListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  images: listing.images,
                  rent_monthly_eur: listing.rentMonthlyEur,
                  address_line: listing.addressLine,
                  city: listing.city
                }}
                formatPrice={formatPrice}
                viewDetailsText={t('home.viewDetails')}
              />
            ))}
          
            {listings.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">{t('search.noResults')}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({})}
                  className="mt-4"
                >
                  {t('search.clearFilters')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
