import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEED_URL = 'https://roomless-file.s3.us-east-2.amazonaws.com/feed-partner/flat_2_study.json';

interface Flat2StudyListing {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  images?: string[];
  [key: string]: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching Flat2Study feed...');
    
    // Fetch the feed
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const listings: Flat2StudyListing[] = await response.json();
    console.log(`Found ${listings.length} listings in feed`);

    // Get or create Flat2Study agency profile
    const { data: existingAgency } = await supabase
      .from('profiles')
      .select('id')
      .eq('agency_name', 'Flat2Study')
      .eq('user_type', 'agency')
      .single();

    let agencyId: string;
    
    if (existingAgency) {
      agencyId = existingAgency.id;
    } else {
      // Create agency profile
      const { data: newAgency, error: agencyError } = await supabase
        .from('profiles')
        .insert({
          agency_name: 'Flat2Study',
          user_type: 'agency',
          email: 'import@flat2study.com',
          phone: '+39000000000',
          full_name: 'Flat2Study Import',
        })
        .select('id')
        .single();

      if (agencyError) throw agencyError;
      agencyId = newAgency.id;
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process listings in batches
    const batchSize = 100;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      
      for (const listing of batch) {
        try {
          // Map the listing data
          const mappedListing = mapFlat2StudyListing(listing, agencyId);
          
          if (!mappedListing) {
            skipped++;
            continue;
          }

          // Check if listing exists
          const { data: existing } = await supabase
            .from('listings')
            .select('id')
            .eq('external_listing_id', mappedListing.external_listing_id)
            .eq('external_source', 'flat2study')
            .single();

          if (existing) {
            // Update existing
            const { error } = await supabase
              .from('listings')
              .update(mappedListing)
              .eq('id', existing.id);

            if (error) {
              errors.push(`Update error for ${mappedListing.external_listing_id}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            // Insert new - ALWAYS set to pending review
            const { error } = await supabase
              .from('listings')
              .insert({
                ...mappedListing,
                status: 'DRAFT',
                review_status: 'pending_review'
              });

            if (error) {
              errors.push(`Insert error for ${mappedListing.external_listing_id}: ${error.message}`);
            } else {
              imported++;
            }
          }
        } catch (error) {
          errors.push(`Error processing listing: ${error.message}`);
          skipped++;
        }
      }

      console.log(`Processed batch ${i / batchSize + 1}: imported=${imported}, updated=${updated}, skipped=${skipped}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        skipped,
        total: listings.length,
        errors: errors.slice(0, 10), // Return first 10 errors
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

function mapFlat2StudyListing(listing: Flat2StudyListing, agencyId: string): any | null {
  // Extract required fields
  const externalId = listing.id || listing.title || `f2s-${Date.now()}-${Math.random()}`;
  
  // Validate minimum requirements
  if (!listing.latitude || !listing.longitude) {
    console.log(`Skipping listing ${externalId}: missing coordinates`);
    return null;
  }

  if (!listing.price || listing.price <= 0) {
    console.log(`Skipping listing ${externalId}: invalid price`);
    return null;
  }

  return {
    external_listing_id: externalId,
    external_source: 'flat2study',
    agency_id: agencyId,
    title: listing.title || 'Property',
    description: listing.description || '',
    type: determinePropertyType(listing),
    rent_monthly_eur: Math.round(listing.price),
    deposit_eur: Math.round((listing.price || 0) * 2),
    lat: listing.latitude,
    lng: listing.longitude,
    city: listing.city || 'Milano',
    country: listing.country || 'Italy',
    address_line: listing.address || '',
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    size_sqm: listing.size || null,
    images: Array.isArray(listing.images) ? listing.images : [],
    furnished: true,
    bills_included: false,
    availability_date: new Date().toISOString().split('T')[0],
    last_synced_at: new Date().toISOString(),
  };
}

function determinePropertyType(listing: Flat2StudyListing): string {
  const bedrooms = listing.bedrooms || 0;
  
  if (bedrooms === 0 || bedrooms === 1) {
    return 'studio';
  } else if (bedrooms === 2) {
    return 'multi_bedroom_apartment';
  } else {
    return 'multi_bedroom_apartment';
  }
}
