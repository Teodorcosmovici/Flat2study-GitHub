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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      throw new Error('Only admins can delete imported listings');
    }

    console.log('Admin user verified, proceeding with deletion');

    // First, get count of listings to be deleted
    const { count: totalCount } = await supabaseClient
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('external_source', 'spacest');

    console.log(`Found ${totalCount} Spacest listings to delete`);

    // Delete all listings imported from Spacest
    const { data: deletedListings, error: deleteError } = await supabaseClient
      .from('listings')
      .delete()
      .eq('external_source', 'spacest')
      .select('id, title, external_listing_id');

    if (deleteError) {
      console.error('Error deleting listings:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${deletedListings?.length || 0} Spacest listings`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedListings?.length || 0} imported Spacest listings`,
        deletedCount: deletedListings?.length || 0,
        deletedListings: deletedListings?.map(l => ({
          id: l.id,
          title: l.title,
          external_id: l.external_listing_id
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in delete-spacest-listings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
