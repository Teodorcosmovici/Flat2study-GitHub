import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting to restore vaguely rejected listings...');

    // Update all listings with vague rejection notes back to pending review
    const { data, error } = await supabase
      .from('listings')
      .update({
        review_status: 'pending_review',
        review_notes: null,
        reviewed_at: null,
        reviewed_by: null
      })
      .eq('review_status', 'rejected')
      .eq('review_notes', 'Automatically rejected by admin')
      .select('id');

    if (error) {
      console.error('Error restoring listings:', error);
      throw error;
    }

    const restoredCount = data?.length || 0;
    console.log(`Restored ${restoredCount} listings to pending review`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        restored: restoredCount,
        message: `Restored ${restoredCount} vaguely-rejected listings to pending review`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
