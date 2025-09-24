import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for database updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all published listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, address_line, city, country, lat, lng')
      .eq('status', 'PUBLISHED')

    if (listingsError) {
      throw listingsError
    }

    console.log(`Found ${listings.length} listings to geocode`)

    const results = []

    for (const listing of listings) {
      try {
        // Construct the full address for geocoding
        const fullAddress = `${listing.address_line}, ${listing.city}, ${listing.country}`
        
        console.log(`Geocoding: ${fullAddress}`)

        // Use OpenStreetMap Nominatim for geocoding (free service)
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1`
        
        const geocodeResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'Flat2Study-App/1.0' // Nominatim requires a User-Agent
          }
        })

        if (!geocodeResponse.ok) {
          console.error(`Geocoding failed for ${fullAddress}: ${geocodeResponse.statusText}`)
          results.push({
            listing_id: listing.id,
            address: fullAddress,
            success: false,
            error: `Geocoding failed: ${geocodeResponse.statusText}`
          })
          continue
        }

        const geocodeResults: GeocodeResult[] = await geocodeResponse.json()

        if (geocodeResults.length === 0) {
          console.error(`No results found for ${fullAddress}`)
          results.push({
            listing_id: listing.id,
            address: fullAddress,
            success: false,
            error: 'Address not found'
          })
          continue
        }

        const result = geocodeResults[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        console.log(`Found coordinates: ${lat}, ${lng} for ${fullAddress}`)

        // Update the listing with accurate coordinates
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            lat: lat,
            lng: lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.id)

        if (updateError) {
          console.error(`Failed to update listing ${listing.id}:`, updateError)
          results.push({
            listing_id: listing.id,
            address: fullAddress,
            success: false,
            error: `Database update failed: ${updateError.message}`
          })
        } else {
          results.push({
            listing_id: listing.id,
            address: fullAddress,
            success: true,
            old_coordinates: { lat: listing.lat, lng: listing.lng },
            new_coordinates: { lat, lng },
            geocoded_address: result.display_name
          })
        }

        // Add a small delay to be respectful to the Nominatim service
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing listing ${listing.id}:`, error)
        results.push({
          listing_id: listing.id,
          address: `${listing.address_line}, ${listing.city}, ${listing.country}`,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        total_listings: listings.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in geocode-all-listings function:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})