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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting deletion of Spacest listings...');

    // Delete all listings where external_source = 'spacest'
    const { data: deletedListings, error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('external_source', 'spacest')
      .select('id');

    if (deleteError) {
      console.error('Error deleting Spacest listings:', deleteError);
      throw deleteError;
    }

    const deletedCount = deletedListings?.length || 0;
    console.log(`Successfully deleted ${deletedCount} Spacest listings`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} Spacest listings`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-spacest-listings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
