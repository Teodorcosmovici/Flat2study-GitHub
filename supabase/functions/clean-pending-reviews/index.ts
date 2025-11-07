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

    // Milan area bounds
    const MILAN_BOUNDS = {
      minLat: 45.26,
      maxLat: 45.66,
      minLng: 9.00,
      maxLng: 9.38,
    };

    console.log('Rejecting pending reviews that do not meet requirements...');

    // Get all pending reviews
    const { data: pendingListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, city, address_line, lat, lng, rent_monthly_eur')
      .eq('review_status', 'pending_review');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    if (!pendingListings || pendingListings.length === 0) {
      console.log('No pending reviews to process');
      return new Response(
        JSON.stringify({
          success: true,
          rejected: 0,
          rejectedListings: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter listings that should be rejected
    const listingsToReject = pendingListings.filter(listing => {
      // Check if in Milan (coordinates OR text)
      const inMilanBounds = listing.lat >= MILAN_BOUNDS.minLat &&
                           listing.lat <= MILAN_BOUNDS.maxLat &&
                           listing.lng >= MILAN_BOUNDS.minLng &&
                           listing.lng <= MILAN_BOUNDS.maxLng;
      
      const hasMilanText = (listing.city?.toLowerCase().includes('milan') || 
                           listing.city?.toLowerCase().includes('milano') ||
                           listing.address_line?.toLowerCase().includes('milan') ||
                           listing.address_line?.toLowerCase().includes('milano'));
      
      const isInMilan = inMilanBounds || hasMilanText;

      // Check price range (300-1000 EUR for students)
      const priceInRange = listing.rent_monthly_eur >= 300 && listing.rent_monthly_eur <= 1000;

      // Reject if NOT in Milan OR price out of range
      return !isInMilan || !priceInRange;
    });

    if (listingsToReject.length === 0) {
      console.log('No listings to reject - all meet requirements');
      return new Response(
        JSON.stringify({
          success: true,
          rejected: 0,
          rejectedListings: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reject filtered listings
    const idsToReject = listingsToReject.map(l => l.id);
    
    const { data: rejectedListings, error: rejectError } = await supabase
      .from('listings')
      .update({
        review_status: 'rejected',
        review_notes: 'Automatically rejected - does not meet Milan location or student price range (€300-€1000) requirements',
        reviewed_at: new Date().toISOString(),
        status: 'DRAFT'
      })
      .in('id', idsToReject)
      .select('id, title, city, lat, lng, rent_monthly_eur');

    if (rejectError) {
      console.error('Reject error:', rejectError);
      throw rejectError;
    }

    console.log(`Rejected ${rejectedListings?.length || 0} listings not meeting requirements`);

    return new Response(
      JSON.stringify({
        success: true,
        rejected: rejectedListings?.length || 0,
        rejectedListings: rejectedListings,
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
