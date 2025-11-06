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

    console.log('Deleting all Spacest listings except the 1900 EUR apartment...');

    // Fetch all Spacest listings
    const { data: allSpacestListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, rent_monthly_eur, title, address_line')
      .eq('external_source', 'spacest');

    if (fetchError) throw fetchError;

    let totalDeleted = 0;

    if (allSpacestListings) {
      for (const listing of allSpacestListings) {
        // Skip the 1900 EUR apartment
        if (listing.rent_monthly_eur === 1900) {
          console.log(`Keeping listing: ${listing.title} (€${listing.rent_monthly_eur})`);
          continue;
        }

        await supabase
          .from('listings')
          .delete()
          .eq('id', listing.id);
        
        totalDeleted++;
        console.log(`Deleted listing ${listing.id}: ${listing.title} (€${listing.rent_monthly_eur})`);
      }
    }

    console.log(`Cleanup complete. Deleted ${totalDeleted} Spacest listings.`);

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
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
