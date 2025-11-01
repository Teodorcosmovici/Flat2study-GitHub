import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPACEST_FEED_URL = 'https://roomless-file.s3.us-east-2.amazonaws.com/feed-partner/example_feed.json';

interface SpacestListing {
  listing_code: string;
  category: 'room' | 'apartment';
  price: number;
  bedrooms?: number;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  images?: string[];
  first_availability?: string;
  minimum_stay?: number;
  maximum_stay?: number;
  occupation_periods?: Array<{ start_date: string; end_date: string }>;
  latitude?: number;
  longitude?: number;
  size_sqm?: number;
  bathrooms?: number;
  furnished?: boolean;
  bills_included?: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Allow overriding the feed URL via request body
    let feedUrl = SPACEST_FEED_URL;
    try {
      const payload = await req.json();
      if (payload && typeof payload.feed_url === 'string' && payload.feed_url.trim().length > 0) {
        feedUrl = payload.feed_url.trim();
      }
    } catch (_) {
      // no body provided
    }

    console.log('Fetching Spacest feed...');
    const feedResponse = await fetch(feedUrl);
    
    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch Spacest feed: ${feedResponse.statusText}`);
    }

    const feedData = await feedResponse.json();
    
    // Log the feed structure to debug
    console.log('Feed data structure:', JSON.stringify(feedData).substring(0, 500));
    
    // The feed might be an array directly, or nested in a property
    let listings: SpacestListing[] = [];
    if (Array.isArray(feedData)) {
      listings = feedData;
    } else if (feedData.listings && Array.isArray(feedData.listings)) {
      listings = feedData.listings;
    } else if (feedData.data && Array.isArray(feedData.data)) {
      listings = feedData.data;
    }
    
    console.log(`Found ${listings.length} listings in feed`);

    // Get or create Spacest agency profile
    let agencyId: string;

    // First, try to find existing Spacest profile
    const { data: spacestProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('agency_name', 'Spacest')
      .eq('user_type', 'agency')
      .single();

    if (spacestProfile) {
      agencyId = spacestProfile.id;
      console.log(`Using existing Spacest agency profile ID: ${agencyId}`);
    } else {
      // If no Spacest profile exists, use the first available agency profile
      // This allows admins to assign imports to an existing agency
      const { data: anyAgency, error: anyAgencyError } = await supabase
        .from('profiles')
        .select('id, agency_name')
        .in('user_type', ['agency', 'private'])
        .limit(1)
        .single();

      if (anyAgencyError || !anyAgency) {
        throw new Error('No agency profile found. Please create an agency account first before importing listings.');
      }

      agencyId = anyAgency.id;
      console.log(`Using agency profile: ${anyAgency.agency_name} (ID: ${agencyId})`);
    }

    console.log(`Using agency profile ID: ${agencyId}`);

    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Filter and process listings
    for (const listing of listings) {
      try {
        // Normalize core fields
        const city = extractCity(listing);
        const bedrooms = extractBedrooms(listing);

        // Filter by city (Milan only) with robust matching
        if (!containsMilan(city) && !containsMilan(listing.address) && !containsMilan(listing.title)) {
          result.skipped++;
          continue;
        }

        // Apply price filters based on category and bedrooms
        const shouldImport = shouldImportListing({ ...listing, bedrooms });
        if (!shouldImport) {
          result.skipped++;
          continue;
        }

        // Map Spacest listing to our schema
        const mappedListing = mapSpacestListing(listing, agencyId);

        // Check if listing already exists
        const { data: existing } = await supabase
          .from('listings')
          .select('id')
          .eq('external_listing_id', listing.listing_code)
          .eq('external_source', 'spacest')
          .single();

        if (existing) {
          // Update existing listing
          const { error: updateError } = await supabase
            .from('listings')
            .update({
              ...mappedListing,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            result.errors.push(`Update error for ${listing.listing_code}: ${updateError.message}`);
          } else {
            result.updated++;
            
            // Update availability periods if provided
            if (listing.occupation_periods && listing.occupation_periods.length > 0) {
              await updateAvailabilityPeriods(supabase, existing.id, listing.occupation_periods);
            }
          }
        } else {
          // Insert new listing
          const { data: newListing, error: insertError } = await supabase
            .from('listings')
            .insert({
              ...mappedListing,
              last_synced_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (insertError) {
            result.errors.push(`Insert error for ${listing.listing_code}: ${insertError.message}`);
          } else {
            result.imported++;
            
            // Insert availability periods if provided
            if (newListing && listing.occupation_periods && listing.occupation_periods.length > 0) {
              await updateAvailabilityPeriods(supabase, newListing.id, listing.occupation_periods);
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${listing.listing_code}: ${error.message}`);
      }
    }

    console.log('Import completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [error.message]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function shouldImportListing(listing: SpacestListing): boolean {
  const price = listing.price;
  const bedrooms = listing.bedrooms || 0;
  
  // Determine listing type based on category and bedrooms
  if (listing.category === 'room') {
    return price < 800;
  }
  
  if (listing.category === 'apartment') {
    // If bedrooms not specified, assume studio
    if (bedrooms === 0 || bedrooms === 1) {
      return price < 1100; // Studio
    } else if (bedrooms === 2) {
      return price < 1800;
    } else if (bedrooms === 3) {
      return price < 2500;
    }
  }
  
  return false;
}

function mapSpacestListing(listing: SpacestListing, agencyId: string): any {
  // Extract bedrooms from feed
  const rawBedrooms = extractBedrooms(listing);
  
  // Determine our listing type and correct bedroom count
  let type = 'room';
  let bedrooms = 1; // Default minimum
  
  if (listing.category === 'room') {
    type = 'room';
    bedrooms = 1; // A room is always 1 bedroom
  } else if (listing.category === 'apartment') {
    if (rawBedrooms === 0 || rawBedrooms === 1) {
      type = 'studio';
      bedrooms = 1; // Studios count as 1 bedroom
    } else {
      type = 'entire_property';
      bedrooms = Math.max(1, rawBedrooms); // Ensure at least 1
    }
  }

  // Generate title if not provided
  const title = listing.title || generateTitle(type, listing.address, bedrooms);

  return {
    external_listing_id: listing.listing_code,
    external_source: 'spacest',
    agency_id: agencyId,
    title,
    title_multilingual: {
      en: title,
      it: title
    },
    type,
    description: listing.description || '',
    description_multilingual: {
      en: listing.description || '',
      it: listing.description || ''
    },
    address_line: listing.address || '',
    city: extractCity(listing) || 'Milan',
    country: listing.country || 'Italy',
    lat: (listing as any).latitude ?? (listing as any).lat ?? 45.4642, // Default Milan coordinates
    lng: (listing as any).longitude ?? (listing as any).lng ?? 9.1900,
    rent_monthly_eur: listing.price,
    deposit_eur: listing.price * 2, // Default 2 months deposit
    bills_included: listing.bills_included ?? false,
    furnished: listing.furnished ?? true,
    bedrooms: bedrooms,
    bathrooms: listing.bathrooms || 1,
    size_sqm: listing.size_sqm || null,
    amenities: [],
    availability_date: listing.first_availability ? new Date(listing.first_availability).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    images: extractImages(listing),
    status: 'DRAFT',
    review_status: 'pending_review',
    minimum_stay_days: listing.minimum_stay ? listing.minimum_stay * 30 : 30,
    maximum_stay_days: listing.maximum_stay ? listing.maximum_stay * 30 : 365,
  };
}

function generateTitle(type: string, address: string | undefined, bedrooms: number): string {
  let baseTitle = '';
  
  switch (type) {
    case 'studio':
      baseTitle = 'Studio';
      break;
    case 'room':
      baseTitle = 'Room';
      break;
    case 'entire_property':
      baseTitle = bedrooms > 0 ? `${bedrooms}-Bedroom Apartment` : 'Apartment';
      break;
    default:
      baseTitle = 'Property';
  }
  
  if (address) {
    return `${baseTitle} in ${address}`;
  }
  
  return `${baseTitle} in Milan`;
}

async function updateAvailabilityPeriods(
  supabase: any,
  listingId: string,
  occupationPeriods: Array<{ start_date: string; end_date: string }>
) {
  try {
    // Delete existing availability for this listing
    await supabase
      .from('listing_availability')
      .delete()
      .eq('listing_id', listingId);

    // Generate dates for the next 365 days (all available by default)
    const availabilityRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if this date falls within any occupation period
      const isOccupied = occupationPeriods.some(period => {
        const start = new Date(period.start_date);
        const end = new Date(period.end_date);
        return date >= start && date <= end;
      });
      
      availabilityRecords.push({
        listing_id: listingId,
        date: dateStr,
        is_available: !isOccupied
      });
    }

    // Insert new availability records in batches
    const batchSize = 100;
    for (let i = 0; i < availabilityRecords.length; i += batchSize) {
      const batch = availabilityRecords.slice(i, i + batchSize);
      await supabase
        .from('listing_availability')
        .insert(batch);
    }

    console.log(`Updated availability for listing ${listingId}`);
  } catch (error) {
    console.error(`Error updating availability for ${listingId}:`, error);
  }
}

function extractCity(listing: any): string {
  const city = listing?.city || listing?.city_name || listing?.location?.city || listing?.address_city || '';
  return typeof city === 'string' ? city : '';
}

function containsMilan(value?: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const v = value.toLowerCase();
  return v.includes('milan') || v.includes('milano');
}

function extractBedrooms(listing: any): number {
  const val = listing?.bedrooms ?? listing?.rooms ?? listing?.n_rooms ?? listing?.num_rooms ?? listing?.bedroom_count ?? listing?.rooms_count;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 1; // Minimum 1 bedroom to satisfy DB constraint
}

function extractImages(listing: any): string[] {
  const imgs = listing?.images || listing?.photos || listing?.pictures || [];
  if (Array.isArray(imgs)) {
    return imgs
      .map((it: any) => typeof it === 'string' ? it : (it?.url || it?.src))
      .filter((u: any) => typeof u === 'string' && u.length > 0);
  }
  return [];
}

