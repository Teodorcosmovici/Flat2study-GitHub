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

    // Delete listings with price outside 300-1000 EUR range
    const { data: deletedPrice, error: priceError } = await supabase
      .from('listings')
      .delete()
      .eq('external_source', 'spacest')
      .or('rent_monthly_eur.lt.300,rent_monthly_eur.gt.1000')
      .select('id');

    if (priceError) throw priceError;

    // Delete listings outside Milan bounds
    const MILAN_BOUNDS = {
      minLat: 45.26,
      maxLat: 45.66,
      minLng: 9.00,
      maxLng: 9.38,
    };

    const { data: allSpacestListings } = await supabase
      .from('listings')
      .select('id, lat, lng')
      .eq('external_source', 'spacest');

    let deletedLocation = 0;
    if (allSpacestListings) {
      for (const listing of allSpacestListings) {
        if (
          listing.lat < MILAN_BOUNDS.minLat ||
          listing.lat > MILAN_BOUNDS.maxLat ||
          listing.lng < MILAN_BOUNDS.minLng ||
          listing.lng > MILAN_BOUNDS.maxLng
        ) {
          await supabase
            .from('listings')
            .delete()
            .eq('id', listing.id);
          deletedLocation++;
        }
      }
    }

    const totalDeleted = (deletedPrice?.length || 0) + deletedLocation;

    console.log(`Cleanup complete. Deleted ${totalDeleted} invalid listings.`);
    console.log(`- Deleted ${deletedPrice?.length || 0} due to price`);
    console.log(`- Deleted ${deletedLocation} due to location`);

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        deletedByPrice: deletedPrice?.length || 0,
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
