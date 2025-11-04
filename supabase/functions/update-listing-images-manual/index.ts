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

    const { external_listing_id, images } = await req.json();

    if (!external_listing_id || !images || !Array.isArray(images)) {
      throw new Error('external_listing_id and images array are required');
    }

    console.log(`Updating images for ${external_listing_id}:`, images);

    const { data, error } = await supabase
      .from('listings')
      .update({ images })
      .eq('external_listing_id', external_listing_id)
      .select();

    if (error) throw error;

    console.log('Updated listing:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        listing: data,
        images_count: images.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
