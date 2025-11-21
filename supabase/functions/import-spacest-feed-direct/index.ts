import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Comprehensive multilingual classification
function classifyListing(category: string, bedrooms: number, price: number): Classification {
  const lowerCategory = (category || '').toLowerCase().trim();
  
  // Single room keywords (English, Italian, Spanish, French, Portuguese, German)
  const roomKeywords = [
    'room', 'single room', 'private room', 'bedroom', 'double room',
    'stanza', 'camera', 'camera singola', 'camera doppia', 'posto letto',
    'habitación', 'habitacion', 'cuarto',
    'chambre', 'chambre privée', 'chambre simple',
    'quarto', 'quarto individual',
    'zimmer', 'einzelzimmer'
  ];
  
  // Studio/efficiency keywords (all languages)
  const studioKeywords = [
    'studio', 'studio apartment', 'efficiency', 'bachelor', 'bedsit',
    'monolocale', 'miniappartamento',
    'estudio',
    'studio meublé',
    'kitchenette',
    'apartamento tipo estudio'
  ];
  
  // Multi-bedroom apartment keywords (all languages)
  const apartmentKeywords = [
    'apartment', 'flat', 'condo', 'unit',
    'appartamento', 'bilocale', 'trilocale', 'quadrilocale', 'attico',
    'apartamento', 'piso', 'departamento',
    'appartement',
    'wohnung'
  ];
  
  // Shared/co-living keywords (treat as single room)
  const sharedKeywords = [
    'shared', 'coliving', 'co-living', 'flatshare', 'houseshare',
    'condiviso', 'condivisa',
    'compartido', 'compartida',
    'partagé', 'colocation'
  ];
  
  // Check for single/shared rooms first
  if (
    bedrooms === 1 || 
    roomKeywords.some(kw => lowerCategory.includes(kw)) ||
    sharedKeywords.some(kw => lowerCategory.includes(kw))
  ) {
    return { 
      type: 'single_room', 
      mappedCategory: 'stanza', 
      reasoning: `Single room detected (${bedrooms} bedrooms, category: "${category}")` 
    };
  }
  
  // Check for studios (but only if explicitly mentioned or price suggests it's a small unit)
  if (studioKeywords.some(kw => lowerCategory.includes(kw)) || 
      (bedrooms === 0 && price > 0 && price <= 1500)) {
    return { 
      type: 'studio', 
      mappedCategory: 'monolocale', 
      reasoning: `Studio detected (${bedrooms} bedrooms, category: "${category}", price: ${price})` 
    };
  }
  
  // For apartments with 0 bedrooms but high price, infer it's a multi-bedroom with missing data
  if (apartmentKeywords.some(kw => lowerCategory.includes(kw))) {
    if (bedrooms === 0 && price > 1500) {
      // Infer bedroom count from price: roughly 800-1000€ per bedroom in Milan
      const inferredBedrooms = Math.max(2, Math.round(price / 900));
      const mappedCategory = inferredBedrooms === 2 ? 'bilocale' : 
                             inferredBedrooms === 3 ? 'trilocale' : 'appartamento';
      return {
        type: 'multi_bedroom_apartment',
        mappedCategory,
        reasoning: `Apartment with missing bedroom data, inferred ${inferredBedrooms} bedrooms from ${price}€ price`
      };
    }
    
    if (bedrooms >= 2) {
      const mappedCategory = bedrooms === 2 ? 'bilocale' : 
                             bedrooms === 3 ? 'trilocale' : 'appartamento';
      return { 
        type: 'multi_bedroom_apartment', 
        mappedCategory, 
        reasoning: `${bedrooms}-bedroom apartment detected (category: "${category}")` 
      };
    }
  }
  
  // Default based on bedrooms if we have that info
  if (bedrooms >= 2) {
    const mappedCategory = bedrooms === 2 ? 'bilocale' : 'appartamento';
    return { 
      type: 'multi_bedroom_apartment', 
      mappedCategory, 
      reasoning: `Default to apartment based on ${bedrooms} bedrooms` 
    };
  }
  
  return { 
    type: 'unknown', 
    mappedCategory: '', 
    reasoning: `Could not classify (bedrooms: ${bedrooms}, category: "${category}", price: ${price})` 
  };
}

// Simple price validation: 300-1200€ for all properties
function shouldImportListing(listing: SpacestListing): boolean {
  const price = listing.price || 0;
  return price >= 300 && price <= 1200;
}

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

    // Milan area bounds
    const MILAN_BOUNDS = {
      minLat: 45.26,
      maxLat: 45.66,
      minLng: 9.00,
      maxLng: 9.38,
    };

    // Track valid listing codes from the feed
    const validListingCodes = new Set<string>();
    
    // Classification cache to minimize AI calls
    const classificationCache = new Map<string, Classification>();
    let skippedDetails: string[] = [];

    for (const listing of listings) {
      try {
        // Validate with simple price check
        const isValid = shouldImportListing(listing);
        if (!isValid) {
          if (skippedDetails.length < 10) {
            skippedDetails.push(`${listing.code}: Price ${listing.price}€ outside 300-1200€ range`);
          }
          skipped++;
          continue;
        }
        
        // Classify listing for category mapping only
        const cacheKey = `${listing.category}-${listing.bedrooms || 0}-${listing.price || 0}`;
        let classification = classificationCache.get(cacheKey);
        
        if (!classification) {
          classification = classifyListing(
            listing.category || '',
            listing.bedrooms || 0,
            listing.price || 0
          );
          classificationCache.set(cacheKey, classification);
          console.log(`Classified "${cacheKey}" as ${classification.type} (${classification.mappedCategory}): ${classification.reasoning}`);
        }

        // REJECT invalid coordinates (changed from allowing null/0)
        if (
          !listing.lat || !listing.lng ||
          listing.lat === 0 || listing.lng === 0 ||
          listing.lat < MILAN_BOUNDS.minLat ||
          listing.lat > MILAN_BOUNDS.maxLat ||
          listing.lng < MILAN_BOUNDS.minLng ||
          listing.lng > MILAN_BOUNDS.maxLng
        ) {
          if (skippedDetails.length < 10) {
            skippedDetails.push(`${listing.code}: Invalid/non-Milan coordinates`);
          }
          skipped++;
          continue;
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
    
    // Log summary
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
