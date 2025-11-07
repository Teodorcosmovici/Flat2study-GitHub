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

    console.log('Rejecting pending reviews outside Milan area...');

    // Reject listings outside Milan
    const { data: rejectedListings, error: rejectError } = await supabase
      .from('listings')
      .update({
        review_status: 'rejected',
        review_notes: 'Automatically rejected - outside Milan area',
        reviewed_at: new Date().toISOString(),
        status: 'DRAFT'
      })
      .eq('review_status', 'pending_review')
      .or(
        `lat.lt.${MILAN_BOUNDS.minLat},` +
        `lat.gt.${MILAN_BOUNDS.maxLat},` +
        `lng.lt.${MILAN_BOUNDS.minLng},` +
        `lng.gt.${MILAN_BOUNDS.maxLng}`
      )
      .select('id, title, city, lat, lng');

    if (rejectError) {
      console.error('Reject error:', rejectError);
      throw rejectError;
    }

    console.log(`Rejected ${rejectedListings?.length || 0} listings outside Milan`);

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
