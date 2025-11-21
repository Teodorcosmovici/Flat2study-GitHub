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

    for (const listing of listings) {
      try {
        // Skip if not eligible for import
        if (!shouldImportListing(listing)) {
          skipped++;
          continue;
        }

        // Skip if outside Milan area
        if (
          listing.lat &&
          listing.lng &&
          (listing.lat < MILAN_BOUNDS.minLat ||
            listing.lat > MILAN_BOUNDS.maxLat ||
            listing.lng < MILAN_BOUNDS.minLng ||
            listing.lng > MILAN_BOUNDS.maxLng)
        ) {
          skipped++;
          continue;
        }

        // Track this listing as valid
        validListingCodes.add(listing.code);

        const mappedListing = mapSpacestListing(listing, agencyId);

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

function shouldImportListing(listing: SpacestListing): boolean {
  // Only import if price is between 300-1000 EUR
  if (!listing.price || listing.price < 300 || listing.price > 1000) return false;
  if (!listing.category) return false;
  
  const validCategories = ['stanza', 'camera', 'appartamento', 'monolocale', 'bilocale'];
  return validCategories.some(cat => 
    listing.category?.toLowerCase().includes(cat)
  );
}

function mapSpacestListing(listing: SpacestListing, agencyId: string): any {
  const city = listing.city || extractCity(listing.address);
  const addressLine = listing.address || '';
  
  return {
    external_listing_id: listing.code,
    external_source: 'spacest',
    agency_id: agencyId,
    title: listing.title || generateTitle(listing),
    type: listing.category || 'room',
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
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    floor: listing.floor || null,
    size_sqm: listing.size || null,
    amenities: listing.amenities || [],
    availability_date: listing.availability_date || null,
    images: listing.images || [],
    status: 'PUBLISHED',
    review_status: 'approved',
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
