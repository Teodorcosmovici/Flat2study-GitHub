import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingUpdate {
  id: string;
  title: string;
  address_line: string;
  city: string;
  postcode: string | null;
  lat: number;
  lng: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get listings without postcodes in Milan
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, address_line, city, postcode, lat, lng')
      .eq('city', 'Milan')
      .or('postcode.is.null,postcode.eq.')
      .eq('status', 'PUBLISHED')
      .limit(50);

    if (fetchError) {
      console.error('Error fetching listings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${listings?.length || 0} listings without postcodes`);

    const results = [];
    let updated = 0;
    let failed = 0;

    for (const listing of listings || []) {
      try {
        // Use reverse geocoding to get postcode from coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${listing.lat},${listing.lng}&key=${googleMapsApiKey}`;
        
        console.log(`Looking up postcode for: ${listing.title} at ${listing.lat},${listing.lng}`);
        
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
          // Extract postcode from address components
          let postcode = null;
          let fullAddress = geocodeData.results[0].formatted_address;
          
          for (const component of geocodeData.results[0].address_components) {
            if (component.types.includes('postal_code')) {
              postcode = component.long_name;
              break;
            }
          }

          if (postcode) {
            // Update the listing with the postcode
            const { error: updateError } = await supabase
              .from('listings')
              .update({ 
                postcode: postcode,
                address_line: listing.address_line || fullAddress
              })
              .eq('id', listing.id);

            if (updateError) {
              console.error(`Error updating listing ${listing.id}:`, updateError);
              failed++;
              results.push({
                id: listing.id,
                title: listing.title,
                success: false,
                error: updateError.message
              });
            } else {
              console.log(`✓ Updated ${listing.title} with postcode: ${postcode}`);
              updated++;
              results.push({
                id: listing.id,
                title: listing.title,
                success: true,
                postcode: postcode,
                address: fullAddress
              });
            }
          } else {
            console.log(`✗ No postcode found for ${listing.title}`);
            failed++;
            results.push({
              id: listing.id,
              title: listing.title,
              success: false,
              error: 'No postcode in geocode results'
            });
          }
        } else {
          console.log(`✗ Geocoding failed for ${listing.title}: ${geocodeData.status}`);
          failed++;
          results.push({
            id: listing.id,
            title: listing.title,
            success: false,
            error: `Geocoding failed: ${geocodeData.status}`
          });
        }

        // Add a small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing listing ${listing.id}:`, error);
        failed++;
        results.push({
          id: listing.id,
          title: listing.title,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: listings?.length || 0,
        updated,
        failed,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});