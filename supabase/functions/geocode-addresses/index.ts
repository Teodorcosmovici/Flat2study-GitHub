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

    const { listingId } = await req.json()

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'Listing ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, address_line, city, country')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construct the full address for geocoding
    const fullAddress = `${listing.address_line}, ${listing.city}, ${listing.country}`
    
    console.log(`Geocoding address: ${fullAddress}`)

    // Use OpenStreetMap Nominatim for geocoding (free service)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1`
    
    const geocodeResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Flat2Study-App/1.0' // Nominatim requires a User-Agent
      }
    })

    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding failed: ${geocodeResponse.statusText}`)
    }

    const geocodeResults: GeocodeResult[] = await geocodeResponse.json()

    if (geocodeResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Address not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = geocodeResults[0]
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    console.log(`Found coordinates: ${lat}, ${lng} for address: ${fullAddress}`)

    // Update the listing with accurate coordinates
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        lat: lat,
        lng: lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        lat,
        lng,
        address: fullAddress,
        geocoded_address: result.display_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in geocode-addresses function:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})