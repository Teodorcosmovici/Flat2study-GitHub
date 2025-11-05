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

    console.log('Fetching Spacest listings that exceed price criteria...');

    // Query listings that don't meet the criteria
    const { data: invalidListings, error: queryError } = await supabase
      .from('listings')
      .select('id, title, type, bedrooms, rent_monthly_eur, external_listing_id')
      .eq('external_source', 'spacest')
      .neq('status', 'ARCHIVED')
      .or(
        'and(type.eq.room,rent_monthly_eur.gte.800),' +
        'and(type.eq.studio,rent_monthly_eur.gte.1100),' +
        'and(type.in.(entire_property,apartment),bedrooms.eq.2,rent_monthly_eur.gte.1800),' +
        'and(type.in.(entire_property,apartment),bedrooms.eq.3,rent_monthly_eur.gte.2500),' +
        'and(type.in.(entire_property,apartment),bedrooms.gte.4)'
      );

    if (queryError) {
      throw queryError;
    }

    console.log(`Found ${invalidListings?.length || 0} invalid listings`);

    if (!invalidListings || invalidListings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deleted: 0,
          message: 'No invalid listings found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the listings to be deleted
    console.log('Listings to delete:', invalidListings.map(l => ({
      id: l.external_listing_id,
      type: l.type,
      bedrooms: l.bedrooms,
      price: l.rent_monthly_eur
    })));

    // Delete the invalid listings
    const listingIds = invalidListings.map(l => l.id);
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .in('id', listingIds);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: invalidListings.length,
        listings: invalidListings.map(l => ({
          external_id: l.external_listing_id,
          title: l.title,
          type: l.type,
          bedrooms: l.bedrooms,
          price: l.rent_monthly_eur
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        deleted: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
