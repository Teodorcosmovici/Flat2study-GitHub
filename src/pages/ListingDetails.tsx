import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing, ListingType, ListingStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useListingTracking } from '@/hooks/useListingTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Bed, Bath, Calendar, Euro, Wifi, Car, Users, Phone, Mail, Building, ChevronLeft, ChevronRight, CheckCircle, ChevronDown, ArrowRight, FileText, Shield, Globe, Heart } from 'lucide-react';
import Header from '@/components/layout/Header';
import SimpleMapView from '@/components/map/SimpleMapView';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import TranslateButton from '@/components/listings/TranslateButton';
import { BookingForm } from '@/components/booking/BookingForm';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { UnplacesBookingWidget } from '@/components/booking/UnplacesBookingWidget';
import { AvailabilityOverview } from '@/components/listing/AvailabilityOverview';
import { ServicesAndExpenses } from '@/components/listing/ServicesAndExpenses';
import { HowToBook } from '@/components/listing/HowToBook';
import { PaymentSummaryModal } from '@/components/listing/PaymentSummaryModal';
import { LocationMapDialog } from '@/components/listing/LocationMapDialog';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { generateListingTitle } from '@/utils/titleGeneration';

// Helper function to get text in current language
const getLocalizedText = (multilingualField: any, language: string, fallback: string = '') => {
  if (!multilingualField || typeof multilingualField !== 'object') {
    return fallback;
  }
  // Check if the value exists and is not an empty string
  const langValue = multilingualField[language]?.trim();
  const enValue = multilingualField['en']?.trim();
  return langValue || enValue || fallback;
};

// Amenity translations
const amenityTranslations: Record<string, { en: string; it: string }> = {
  'WiFi': { en: 'WiFi', it: 'WiFi' },
  'Kitchen': { en: 'Kitchen', it: 'Cucina' },
  'Cucina': { en: 'Kitchen', it: 'Cucina' },
  'Washing Machine': { en: 'Washing Machine', it: 'Lavatrice' },
  'Lavatrice': { en: 'Washing Machine', it: 'Lavatrice' },
  'Heating': { en: 'Heating', it: 'Riscaldamento' },
  'Riscaldamento': { en: 'Heating', it: 'Riscaldamento' },
  'Air Conditioning': { en: 'Air Conditioning', it: 'Aria Condizionata' },
  'Aria Condizionata': { en: 'Air Conditioning', it: 'Aria Condizionata' },
  'Balcone': { en: 'Balcony', it: 'Balcone' },
  'Balcony': { en: 'Balcony', it: 'Balcone' },
  'Dishwasher': { en: 'Dishwasher', it: 'Lavastoviglie' },
  'Lavastoviglie': { en: 'Dishwasher', it: 'Lavastoviglie' },
  'TV': { en: 'TV', it: 'TV' },
  'Desk': { en: 'Desk', it: 'Scrivania' },
  'Scrivania': { en: 'Desk', it: 'Scrivania' },
  'Elevator': { en: 'Elevator', it: 'Ascensore' },
  'Ascensore': { en: 'Elevator', it: 'Ascensore' },
  'Dryer': { en: 'Dryer', it: 'Asciugatrice' },
  'Asciugatrice': { en: 'Dryer', it: 'Asciugatrice' },
  'Wardrobe': { en: 'Wardrobe', it: 'Armadio' },
  'Armadio': { en: 'Wardrobe', it: 'Armadio' },
  'Portineria': { en: 'Concierge', it: 'Portineria' },
  'Concierge': { en: 'Concierge', it: 'Portineria' },
  'Parking': { en: 'Parking', it: 'Parcheggio' },
  'Parcheggio': { en: 'Parking', it: 'Parcheggio' },
};

// Function to translate amenity
const translateAmenity = (amenity: string, language: string): string => {
  const translation = amenityTranslations[amenity];
  if (translation) {
    return language === 'it' ? translation.it : translation.en;
  }
  return amenity; // Return original if no translation found
};
export default function ListingDetails() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();

  // Track listing view
  useListingTracking(id);
  const {
    t,
    language
  } = useLanguage();
  const isMobile = useIsMobile();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<{
    checkIn: Date;
    checkOut: Date;
    persons: number;
  } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [isDescriptionTranslated, setIsDescriptionTranslated] = useState(false);
  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id, language]);
  const fetchListing = async () => {
    try {
      // First, get basic listing from direct query since we need all fields
      const {
        data: listingData,
        error: listingError
      } = await supabase.from('listings').select('*, title_multilingual, description_multilingual').eq('id', id).eq('status', 'PUBLISHED').single();
      if (listingError) throw listingError;

      // Get the agency profile information directly
      const {
        data: agencyProfile,
        error: agencyError
      } = await supabase.from('profiles').select('agency_name, phone, email').eq('id', listingData.agency_id).eq('user_type', 'agency').single();
      if (agencyError) {
        console.error('Error fetching agency profile:', agencyError);
      }

      // Transform the data to match the Listing type
      const transformedListing: Listing = {
        id: listingData.id,
        title: getLocalizedText(listingData.title_multilingual, language) || 
               generateListingTitle({
                 type: listingData.type,
                 bedrooms: listingData.bedrooms,
                 bathrooms: listingData.bathrooms,
                 totalBedrooms: listingData.total_bedrooms,
                 totalBathrooms: listingData.total_bathrooms,
                 address: `${listingData.address_line}, ${listingData.city}`
               }),
        type: listingData.type as ListingType,
        description: getLocalizedText(listingData.description_multilingual, language, listingData.description),
        addressLine: listingData.address_line,
        city: listingData.city,
        country: listingData.country,
        lat: listingData.lat,
        lng: listingData.lng,
        rentMonthlyEur: listingData.rent_monthly_eur,
        depositEur: listingData.deposit_eur,
        landlordAdminFee: (listingData as any).landlord_admin_fee ?? 0,
        billsIncluded: listingData.bills_included,
        furnished: listingData.furnished,
        bedrooms: listingData.bedrooms,
        bathrooms: listingData.bathrooms,
        totalBedrooms: listingData.total_bedrooms,
        totalBathrooms: listingData.total_bathrooms,
        housematesGender: listingData.housemates_gender as 'male' | 'female' | 'mixed',
        floor: listingData.floor,
        sizeSqm: listingData.size_sqm,
        amenities: Array.isArray(listingData.amenities) ? listingData.amenities.map(item => String(item)) : [],
        houseRules: Array.isArray(listingData.house_rules) ? listingData.house_rules.map(item => String(item)) : [],
        availabilityDate: listingData.availability_date,
        images: Array.isArray(listingData.images) ? listingData.images.map(item => String(item)) : [],
        videoUrl: listingData.video_url,
        createdAt: listingData.created_at,
        publishedAt: listingData.published_at,
        status: listingData.status as ListingStatus,
        expiresAt: listingData.expires_at,
        minimumStayDays: listingData.minimum_stay_days,
        maximumStayDays: listingData.maximum_stay_days,
        // Utility data
        utilities: {
          electricity: { 
            included: listingData.electricity_included ?? true, 
            cost: listingData.electricity_cost_eur ?? 0 
          },
          gas: { 
            included: listingData.gas_included ?? true, 
            cost: listingData.gas_cost_eur ?? 0 
          },
          water: { 
            included: listingData.water_included ?? true, 
            cost: listingData.water_cost_eur ?? 0 
          },
          internet: { 
            included: listingData.internet_included ?? true, 
            cost: listingData.internet_cost_eur ?? 0 
          }
        },
        landlord: {
          id: listingData.agency_id,
          name: agencyProfile?.agency_name || 'Property Manager',
          phone: agencyProfile?.phone || '',
          email: agencyProfile?.email || ''
        }
      };
      setListing(transformedListing);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast({
        title: t('listing.error'),
        description: t('listing.loadingDetails'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  const getTypeDisplayName = (type: string) => {
    const types: Record<string, string> = {
      room: t('propertyType.room'),
      bedspace: t('propertyType.bedspace'),
      studio: t('propertyType.studio'),
      apartment: t('propertyType.apartment'),
      flat: t('propertyType.flat')
    };
    return types[type] || type;
  };
  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, React.ReactNode> = {
      'WiFi': <Wifi className="h-4 w-4" />,
      'Parking Space': <Car className="h-4 w-4" />,
      'Shared Kitchen': <Users className="h-4 w-4" />
    };
    return icons[amenity];
  };
  if (loading) {
    return <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-pulse text-lg">{t('listing.loadingDetails')}</div>
        </div>
      </div>;
  }
  if (!listing) {
    return <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center pt-20">
          <div className="text-lg text-muted-foreground mb-4">{t('listing.notFound')}</div>
          <Button onClick={() => navigate('/search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('listing.backToSearch')}
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-40 md:pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/search')} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('listing.backToSearch')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <Card>
                <CardContent className="p-0">
                  {listing.images.length > 0 ? isMobile ?
                // Mobile: Simple single image with navigation
                <div className="relative h-64">
                        <ImageLightbox images={listing.images} currentIndex={currentImageIndex} onIndexChange={setCurrentImageIndex} title={listing.title}>
                          <img src={listing.images[currentImageIndex]} alt={listing.title} className="w-full h-full object-cover rounded-lg cursor-pointer" loading="eager" fetchPriority="high" decoding="async" />
                        </ImageLightbox>
                        <Badge className="absolute top-4 left-4 bg-background/90 text-foreground">
                          {getTypeDisplayName(listing.type)}
                        </Badge>
                        
                        {/* Image counter */}
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>

                        {/* Navigation arrows */}
                        {listing.images.length > 1 && <>
                            <button onClick={e => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1);
                    }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all">
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button onClick={e => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1);
                    }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all">
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>}
                      </div> :
                // Desktop: 2/3 - 1/3 layout
                <div className="flex gap-2 h-64 md:h-96">
                        {/* Main image - 2/3 width */}
                        <div className="flex-[2] relative">
                          <ImageLightbox images={listing.images} currentIndex={currentImageIndex} onIndexChange={setCurrentImageIndex} title={listing.title}>
                            <img src={listing.images[currentImageIndex]} alt={listing.title} className="w-full h-full object-cover rounded-l-lg cursor-pointer" loading="eager" fetchPriority="high" decoding="async" />
                          </ImageLightbox>
                          <Badge className="absolute top-4 left-4 bg-background/90 text-foreground">
                            {getTypeDisplayName(listing.type)}
                          </Badge>
                          
                          {/* Image counter */}
                          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                            {currentImageIndex + 1} / {listing.images.length}
                          </div>

                          {/* Navigation arrows on main image */}
                          {listing.images.length > 1 && <>
                              <button onClick={e => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1);
                      }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg transition-all">
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button onClick={e => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1);
                      }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-lg transition-all">
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </>}
                        </div>

                        {/* Image thumbnails - 1/3 width */}
                        {listing.images.length > 1 && <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                            {listing.images.slice(1, 4).map((image, index) => <ImageLightbox key={index + 1} images={listing.images} currentIndex={currentImageIndex} onIndexChange={setCurrentImageIndex} title={listing.title}>
                                <div className="relative flex-1 cursor-pointer overflow-hidden rounded-lg group" onClick={() => setCurrentImageIndex(index + 1)}>
                                  <img src={image} alt={`${listing.title} - Thumbnail ${index + 2}`} className={`w-full h-full object-cover transition-all group-hover:brightness-110 ${currentImageIndex === index + 1 ? 'ring-2 ring-primary' : ''}`} loading="lazy" decoding="async" />
                                  {/* Show +X more overlay on last thumbnail if there are more images */}
                                  {index === 2 && listing.images.length > 4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                                      +{listing.images.length - 4} more
                                    </div>}
                                </div>
                              </ImageLightbox>)}
                          </div>}
                      </div> : <div className="w-full h-64 md:h-96 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-muted-foreground">No images available</div>
                    </div>}
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
                      <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{listing.addressLine}, {listing.city}, {listing.country}</span>
                        </div>
                        <LocationMapDialog listing={listing} />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-3xl font-bold text-price">
                        {formatPrice(listing.rentMonthlyEur)}
                      </div>
                      <div className="text-sm text-muted-foreground">per month</div>
                      <ContactInfo 
                        profileId={listing.landlord.id}
                        name={listing.landlord.name}
                        phone={listing.landlord.phone}
                        email={listing.landlord.email}
                        listingId={listing.id}
                        isOwner={user?.id === listing.landlord.id}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(listing.totalBedrooms || listing.bedrooms > 0) && (
                      <div className="flex items-center space-x-2">
                        <Bed className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {listing.totalBedrooms || listing.bedrooms} {(listing.totalBedrooms || listing.bedrooms) > 1 ? t('listing.bedrooms') : t('listing.bedroom')}
                          {listing.totalBedrooms ? ` ${t('listing.inApartment')}` : ''}
                        </span>
                      </div>
                    )}
                    {(listing.totalBathrooms || listing.bathrooms > 0) && (
                      <div className="flex items-center space-x-2">
                        <Bath className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {listing.totalBathrooms || listing.bathrooms} {(listing.totalBathrooms || listing.bathrooms) > 1 ? t('listing.bathrooms') : t('listing.bathroom')}
                          {listing.totalBathrooms ? ` ${t('listing.inApartment')}` : ''}
                        </span>
                      </div>
                    )}
                    {listing.sizeSqm && (
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span>{listing.sizeSqm} m²</span>
                      </div>
                    )}
                    {listing.housematesGender && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {listing.housematesGender === 'mixed' 
                            ? t('listing.mixedGender')
                            : `${listing.housematesGender.charAt(0).toUpperCase() + listing.housematesGender.slice(1)} ${t('listing.only')}`
                          }
                        </span>
                      </div>
                    )}
                  </div>


                  {/* Availability */}
                  {listing.availabilityDate && <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>{t('listing.availableFrom')} {formatDate(listing.availabilityDate)}</span>
                    </div>}

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-2">
                    {listing.furnished && <Badge variant="secondary">{t('listing.furnished')}</Badge>}
                    {listing.billsIncluded && <Badge variant="secondary">{t('listing.billsIncluded')}</Badge>}
                    {listing.floor && <Badge variant="secondary">{t('listing.floor')} {listing.floor}</Badge>}
                  </div>

                  {/* Full Amenities */}
                  {listing.amenities.filter((a: string) => typeof a === 'string' && a.toLowerCase() !== 'pet friendly').length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.amenities
                          .filter((amenity: string) => typeof amenity === 'string' && amenity.toLowerCase() !== 'pet friendly')
                          .map((amenity: string) => (
                            <Badge key={amenity} variant="outline" className="flex items-center space-x-1">
                              {getAmenityIcon(amenity)}
                              <span>{translateAmenity(amenity, language)}</span>
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              {listing.description && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{t('listing.description')}</span>
                      <TranslateButton text={listing.description} onTranslated={translatedText => {
                    setTranslatedDescription(translatedText);
                    setIsDescriptionTranslated(!isDescriptionTranslated);
                  }} isTranslated={isDescriptionTranslated} originalText={listing.description} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {isDescriptionTranslated && translatedDescription ? translatedDescription : listing.description}
                    </p>
                  </CardContent>
                </Card>}

              {/* Availability Overview */}
              <AvailabilityOverview availabilityDate={listing.availabilityDate} minimumStayDays={listing.minimumStayDays} maximumStayDays={listing.maximumStayDays} rentMonthlyEur={listing.rentMonthlyEur} />

              {/* Services and Expenses */}
              <ServicesAndExpenses 
                rentMonthlyEur={listing.rentMonthlyEur} 
                depositEur={listing.depositEur}
                utilities={listing.utilities || {
                  electricity: { included: listing.billsIncluded, cost: 50 },
                  gas: { included: listing.billsIncluded, cost: 40 },
                  water: { included: listing.billsIncluded, cost: 30 },
                  internet: { included: true, cost: 0 }
                }}
              />

              {/* Required Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('listing.requiredDocuments')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{t('listing.validId')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 md:h-4 md:w-4 text-green-600" />
                      <span className="text-sm">
                        {t('listing.studentCertificate')}
                        <span className="text-muted-foreground italic ml-1">{t('listing.optionalHigherChance')}</span>
                      </span>
                    </div>
                    
                    {/* House Rules */}
                    {Array.isArray(listing.houseRules) && listing.houseRules.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">{t('listing.houseRules')}</h4>
                        <div className="space-y-2">
                          {listing.houseRules.map((rule: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contract */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cancellation Policy */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-2">{t('listing.cancellationPolicy')}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('listing.refundPolicy')}
                        </p>
                      </div>
                    </div>

                    {/* Fortnightly Contract */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-2">{t('listing.fortnightlyContract')}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('listing.fortnightlyDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How to Book */}
              <HowToBook />

              {/* Why rent with Flat2stdy */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('listing.whyRentWithFlat2stdy')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Safe arrival */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-2">{t('listing.safeArrival')}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('listing.safeArrivalDescription')}
                        </p>
                      </div>
                    </div>

                    {/* Stress-free housing */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-2">{t('listing.stressFreeHousing')}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('listing.stressFreeDescription')}
                        </p>
                      </div>
                    </div>

                    {/* Full support */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-2">{t('listing.fullSupport')}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('listing.fullSupportDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="lg:sticky lg:top-24">
                 <UnplacesBookingWidget listing={listing} onDatesChange={data => {
                setSelectedDates(data);
              }} onBookingRequest={data => {
                toast({
                  title: t('listing.bookingRequestSent'),
                  description: t('listing.landlordResponse')
                });
              }} />
              </div>

              
              {/* Payment Summary Box - Only show when dates are selected */}
              {selectedDates && <div className="lg:sticky lg:top-[400px] lg:z-20">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      {t('listing.paymentApprovalNote')}
                    </div>
                    <div className="text-sm font-medium mb-3">{t('listing.paymentPlatformNote')}</div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>
                          First rental payment
                          {selectedDates && selectedDates.checkIn.getDate() > 15 && ' (half month)'}
                        </span>
                        <span>
                          {formatPrice(selectedDates && selectedDates.checkIn.getDate() > 15 ? Math.round(listing.rentMonthlyEur / 2) : listing.rentMonthlyEur)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>One-time service fee</span>
                        <span>{formatPrice(Math.round(listing.rentMonthlyEur * 0.4))}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>
                          {formatPrice((selectedDates && selectedDates.checkIn.getDate() > 15 ? Math.round(listing.rentMonthlyEur / 2) : listing.rentMonthlyEur) + Math.round(listing.rentMonthlyEur * 0.4))}
                        </span>
                      </div>
                    </div>
                    
                    <PaymentSummaryModal 
                      rentMonthlyEur={listing.rentMonthlyEur} 
                      depositEur={listing.depositEur} 
                      landlordAdminFee={listing.landlordAdminFee}
                      utilities={listing.utilities}
                      selectedDates={selectedDates}
                    >
                      <Button variant="link" className="p-0 h-auto text-xs mt-2">
                        Review price details →
                      </Button>
                    </PaymentSummaryModal>
                  </CardContent>
                </Card>
              </div>}
            </div>
          </div>
        </div>
      </main>
    </div>;
}