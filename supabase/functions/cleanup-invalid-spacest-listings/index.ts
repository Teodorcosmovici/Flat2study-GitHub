import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of invalid Spacest listings...');

    // Milan area bounds
    const MILAN_BOUNDS = {
      minLat: 45.26,
      maxLat: 45.66,
      minLng: 9.00,
      maxLng: 9.38,
    };

    // Fetch all Spacest listings
    const { data: allSpacestListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, rent_monthly_eur, lat, lng')
      .eq('external_source', 'spacest');

    if (fetchError) throw fetchError;

    let deletedByPrice = 0;
    let deletedByLocation = 0;

    if (allSpacestListings) {
      for (const listing of allSpacestListings) {
        let shouldDelete = false;
        let reason = '';

        // Check price range (300-1000 EUR)
        if (!listing.rent_monthly_eur || listing.rent_monthly_eur < 300 || listing.rent_monthly_eur > 1000) {
          shouldDelete = true;
          reason = 'price';
          deletedByPrice++;
        }
        // Check Milan location bounds
        else if (
          listing.lat < MILAN_BOUNDS.minLat ||
          listing.lat > MILAN_BOUNDS.maxLat ||
          listing.lng < MILAN_BOUNDS.minLng ||
          listing.lng > MILAN_BOUNDS.maxLng
        ) {
          shouldDelete = true;
          reason = 'location';
          deletedByLocation++;
        }

        if (shouldDelete) {
          await supabase
            .from('listings')
            .delete()
            .eq('id', listing.id);
          console.log(`Deleted listing ${listing.id} (reason: ${reason})`);
        }
      }
    }

    const totalDeleted = deletedByPrice + deletedByLocation;

    console.log(`Cleanup complete. Deleted ${totalDeleted} invalid listings.`);
    console.log(`- Deleted ${deletedByPrice} due to price (outside 300-1000 EUR range)`);
    console.log(`- Deleted ${deletedByLocation} due to location (outside Milan area)`);

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        deletedByPrice,
        deletedByLocation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
