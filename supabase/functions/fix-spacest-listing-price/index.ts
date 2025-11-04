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

    // Split €85 utilities across 4 utility types
    const utilityPerType = Math.round(85 / 4);

    const { data, error } = await supabase
      .from('listings')
      .update({
        rent_monthly_eur: 1900,
        deposit_eur: 3800,
        electricity_cost_eur: utilityPerType,
        gas_cost_eur: utilityPerType,
        water_cost_eur: utilityPerType,
        internet_cost_eur: utilityPerType,
        electricity_included: false,
        gas_included: false,
        water_included: false,
        internet_included: false,
      })
      .eq('external_listing_id', 'spacest-180298')
      .select();

    if (error) throw error;

    console.log('Updated listing:', data);

    return new Response(
      JSON.stringify({ success: true, listing: data }),
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
