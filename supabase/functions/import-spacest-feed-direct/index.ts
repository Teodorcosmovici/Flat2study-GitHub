import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= IMPORT CRITERIA (DEFINED ONCE) =============
const IMPORT_CRITERIA = {
  // Price validation: all properties must be within this range
  PRICE_MIN: 300,
  PRICE_MAX: 1200,
  
  // Milan area geographic bounds
  MILAN_BOUNDS: {
    minLat: 45.26,
    maxLat: 45.66,
    minLng: 9.00,
    maxLng: 9.38,
  },
  
  // Keywords for classification (multilingual)
  KEYWORDS: {
    single_room: [
      'room', 'single room', 'private room', 'bedroom', 'double room',
      'stanza', 'camera', 'camera singola', 'camera doppia', 'posto letto',
      'habitación', 'habitacion', 'cuarto',
      'chambre', 'chambre privée', 'chambre simple',
      'quarto', 'quarto individual',
      'zimmer', 'einzelzimmer',
      'shared', 'coliving', 'co-living', 'flatshare', 'houseshare',
      'condiviso', 'condivisa', 'compartido', 'compartida',
      'partagé', 'colocation'
    ],
    studio: [
      'studio', 'studio apartment', 'efficiency', 'bachelor', 'bedsit',
      'monolocale', 'miniappartamento', 'estudio', 'studio meublé',
      'kitchenette', 'apartamento tipo estudio'
    ],
    apartment: [
      'apartment', 'flat', 'condo', 'unit',
      'appartamento', 'bilocale', 'trilocale', 'quadrilocale', 'attico',
      'apartamento', 'piso', 'departamento',
      'appartement', 'wohnung'
    ]
  }
};

// ============= TYPE DEFINITIONS =============
interface SpacestListing {
  code: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  price?: number;
  deposit?: number;
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  size?: number;
  furnished?: boolean;
  bills_included?: boolean;
  images?: string[];
  amenities?: string[];
  availability_date?: string;
  occupation_periods?: Array<{ from: string; to: string }>;
}

interface Classification {
  type: 'single_room' | 'studio' | 'multi_bedroom_apartment' | 'unknown';
  mappedCategory: string;
  reasoning?: string;
}

// ============= VALIDATION =============
function shouldImportListing(listing: SpacestListing): boolean {
  const price = listing.price || 0;
  const { lat, lng } = listing;
  const { PRICE_MIN, PRICE_MAX, MILAN_BOUNDS } = IMPORT_CRITERIA;
  
  // Price must be within range
  if (price < PRICE_MIN || price > PRICE_MAX) {
    return false;
  }
  
  // Coordinates must be valid and within Milan bounds
  if (
    !lat || !lng ||
    lat === 0 || lng === 0 ||
    lat < MILAN_BOUNDS.minLat || lat > MILAN_BOUNDS.maxLat ||
    lng < MILAN_BOUNDS.minLng || lng > MILAN_BOUNDS.maxLng
  ) {
    return false;
  }
  
  return true;
}

// ============= CLASSIFICATION =============
function classifyListing(category: string, bedrooms: number): Classification {
  const lowerCategory = (category || '').toLowerCase().trim();
  const { KEYWORDS } = IMPORT_CRITERIA;
  
  // Check for single/shared rooms
  if (
    bedrooms === 1 || 
    KEYWORDS.single_room.some(kw => lowerCategory.includes(kw))
  ) {
    return { 
      type: 'single_room', 
      mappedCategory: 'stanza', 
      reasoning: `Single room (${bedrooms} bed, "${category}")` 
    };
  }
  
  // Check for studios
  if (
    KEYWORDS.studio.some(kw => lowerCategory.includes(kw)) || 
    bedrooms === 0
  ) {
    return { 
      type: 'studio', 
      mappedCategory: 'monolocale', 
      reasoning: `Studio (${bedrooms} bed, "${category}")` 
    };
  }
  
  // Check for apartments
  if (KEYWORDS.apartment.some(kw => lowerCategory.includes(kw))) {
    if (bedrooms >= 2) {
      const mappedCategory = bedrooms === 2 ? 'bilocale' : 
                             bedrooms === 3 ? 'trilocale' : 'appartamento';
      return { 
        type: 'multi_bedroom_apartment', 
        mappedCategory, 
        reasoning: `${bedrooms}-bed apartment ("${category}")` 
      };
    }
  }
  
  // Default based on bedrooms
  if (bedrooms >= 2) {
    const mappedCategory = bedrooms === 2 ? 'bilocale' : 'appartamento';
    return { 
      type: 'multi_bedroom_apartment', 
      mappedCategory, 
      reasoning: `Default apartment (${bedrooms} bed)` 
    };
  }
  
  return { 
    type: 'unknown', 
    mappedCategory: '', 
    reasoning: `Unclassified (${bedrooms} bed, "${category}")` 
  };
}

// ============= MAIN HANDLER =============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the requesting user
    const authHeader = req.headers.get('Authorization');
    let requestingUserId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      requestingUserId = user?.id || null;
    }

    const { listings } = await req.json();

    if (!listings || !Array.isArray(listings)) {
      throw new Error('listings array is required');
    }

    console.log(`Processing ${listings.length} listings from feed`);

    // Get or create Spacest agency profile
    const spacestEmail = 'spacest-listings@flat2study.com';
    
    const { data: existingAgency } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', spacestEmail)
      .eq('user_type', 'agency')
      .maybeSingle();

    let agencyId: string;
    
    if (existingAgency) {
      agencyId = existingAgency.id;
      console.log('Using existing Spacest agency:', agencyId);
    } else {
      console.log('No existing Spacest profile found');
      
      // Fallback: Use the requesting admin user's profile as temporary owner
      if (requestingUserId) {
        console.log('Using requesting user as fallback owner:', requestingUserId);
        
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', requestingUserId)
          .single();
        
        if (adminProfile) {
          agencyId = adminProfile.id;
          console.log('Using admin profile as agency:', agencyId);
        } else {
          throw new Error('Could not find profile for requesting user');
        }
      } else {
        throw new Error('No authentication provided and no Spacest profile exists. Please create a Spacest agency profile manually first.');
      }
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Track valid listing codes from the feed
    const validListingCodes = new Set<string>();
    
    // Classification cache to minimize repeated classifications
    const classificationCache = new Map<string, Classification>();
    const skippedDetails: string[] = [];

    for (const listing of listings) {
      try {
        // Validate listing against import criteria
        if (!shouldImportListing(listing)) {
          if (skippedDetails.length < 10) {
            const reason = (listing.price || 0) < IMPORT_CRITERIA.PRICE_MIN || (listing.price || 0) > IMPORT_CRITERIA.PRICE_MAX
              ? `Price ${listing.price}€ outside ${IMPORT_CRITERIA.PRICE_MIN}-${IMPORT_CRITERIA.PRICE_MAX}€ range`
              : 'Invalid/non-Milan coordinates';
            skippedDetails.push(`${listing.code}: ${reason}`);
          }
          skipped++;
          continue;
        }
        
        // Classify listing using cache
        const cacheKey = `${listing.category}-${listing.bedrooms || 0}`;
        let classification = classificationCache.get(cacheKey);
        
        if (!classification) {
          classification = classifyListing(
            listing.category || '',
            listing.bedrooms || 0
          );
          classificationCache.set(cacheKey, classification);
          console.log(`Classified "${cacheKey}" as ${classification.type} (${classification.mappedCategory}): ${classification.reasoning}`);
        }

        // Track this listing as valid
        validListingCodes.add(listing.code);

        const mappedListing = mapSpacestListing(listing, agencyId, classification.mappedCategory);

        // Check if listing exists
        const { data: existingListing } = await supabase
          .from('listings')
          .select('id')
          .eq('external_listing_id', listing.code)
          .single();

        if (existingListing) {
          await supabase
            .from('listings')
            .update(mappedListing)
            .eq('id', existingListing.id);
          updated++;
        } else {
          await supabase.from('listings').insert(mappedListing);
          imported++;
        }
      } catch (error) {
        console.error(`Error processing listing ${listing.code}:`, error);
      }
    }
    
    // Log import summary
    console.log(`Import summary: ${imported} imported, ${updated} updated, ${skipped} skipped, ${classificationCache.size} unique categories classified`);
    if (skippedDetails.length > 0) {
      console.log('Sample skipped listings:', skippedDetails.join('; '));
    }

    // Remove listings that are no longer in the feed
    const { data: existingSpacestListings } = await supabase
      .from('listings')
      .select('id, external_listing_id')
      .eq('external_source', 'spacest')
      .not('external_listing_id', 'is', null);

    let removed = 0;
    if (existingSpacestListings) {
      for (const existing of existingSpacestListings) {
        if (!validListingCodes.has(existing.external_listing_id)) {
          await supabase
            .from('listings')
            .delete()
            .eq('id', existing.id);
          removed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        removed,
        skipped,
        total: listings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function mapSpacestListing(listing: SpacestListing, agencyId: string, mappedCategory: string): any {
  const city = listing.city || extractCity(listing.address);
  const addressLine = listing.address || '';
  
  return {
    external_listing_id: listing.code,
    external_source: 'spacest',
    agency_id: agencyId,
    title: listing.title || generateTitle(listing),
    type: mappedCategory,
    description: listing.description || '',
    address_line: addressLine,
    city: city,
    country: listing.country || 'Italy',
    lat: listing.lat || 0,
    lng: listing.lng || 0,
    rent_monthly_eur: listing.price,
    deposit_eur: listing.deposit || 0,
    bills_included: listing.bills_included || false,
    furnished: listing.furnished !== false,
    bedrooms: listing.bedrooms || (mappedCategory === 'monolocale' ? 0 : 1),
    bathrooms: listing.bathrooms || 1,
    floor: listing.floor || null,
    size_sqm: listing.size || null,
    amenities: listing.amenities || [],
    availability_date: listing.availability_date || null,
    images: listing.images || [],
    status: 'DRAFT',
    review_status: 'pending_review',
    last_synced_at: new Date().toISOString(),
  };
}

function extractCity(address?: string): string {
  if (!address) return 'Milano';
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes('milan') || lowerAddress.includes('milano')) {
    return 'Milano';
  }
  return 'Milano';
}

function generateTitle(listing: SpacestListing): string {
  const type = listing.category || 'Room';
  const city = extractCity(listing.address);
  return `${type} in ${city}`;
}
