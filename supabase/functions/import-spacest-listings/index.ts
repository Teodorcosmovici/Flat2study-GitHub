import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPACEST_FEED_URL = 'https://spacest-student-app.s3.eu-west-3.amazonaws.com/json_feed.json';

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

    console.log('Fetching Spacest feed...');
    const feedResponse = await fetch(SPACEST_FEED_URL);
    
    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch Spacest feed: ${feedResponse.statusText}`);
    }

    const feedData = await feedResponse.json();
    const listings: SpacestListing[] = feedData.listings || [];
    
    console.log(`Found ${listings.length} listings in feed`);

    // Get or create Spacest agency profile
    const { data: spacestProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('agency_name', 'Spacest')
      .eq('user_type', 'agency')
      .single();

    let agencyId: string;

    if (profileError || !spacestProfile) {
      console.log('Creating Spacest agency profile...');
      
      // Create a system user first (using service role)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'spacest-import@system.internal',
        email_confirm: true,
        user_metadata: {
          user_type: 'agency',
          agency_name: 'Spacest',
          full_name: 'Spacest',
        }
      });

      if (authError) {
        throw new Error(`Failed to create Spacest user: ${authError.message}`);
      }

      // Get the profile that was auto-created
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (newProfileError) {
        throw new Error(`Failed to get Spacest profile: ${newProfileError.message}`);
      }

      agencyId = newProfile.id;
    } else {
      agencyId = spacestProfile.id;
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
        // Filter by city (Milan only)
        if (!listing.city || !listing.city.toLowerCase().includes('milan') && !listing.city.toLowerCase().includes('milano')) {
          result.skipped++;
          continue;
        }

        // Apply price filters based on category and bedrooms
        const shouldImport = shouldImportListing(listing);
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
  // Determine our listing type
  let type = 'room';
  const bedrooms = listing.bedrooms || 0;
  
  if (listing.category === 'apartment') {
    if (bedrooms === 0 || bedrooms === 1) {
      type = 'studio';
    } else {
      type = 'entire_property';
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
    city: listing.city || 'Milan',
    country: listing.country || 'Italy',
    lat: listing.latitude || 45.4642, // Default Milan coordinates
    lng: listing.longitude || 9.1900,
    rent_monthly_eur: listing.price,
    deposit_eur: listing.price * 2, // Default 2 months deposit
    bills_included: listing.bills_included ?? false,
    furnished: listing.furnished ?? true,
    bedrooms: bedrooms,
    bathrooms: listing.bathrooms || 1,
    size_sqm: listing.size_sqm || null,
    amenities: [],
    availability_date: listing.first_availability ? new Date(listing.first_availability).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    images: listing.images || [],
    status: 'PUBLISHED',
    review_status: 'approved',
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
