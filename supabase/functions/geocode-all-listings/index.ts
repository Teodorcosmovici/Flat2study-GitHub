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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Only geocode listings with default coordinates (Piazza del Duomo)
    const DEFAULT_LAT = 45.4641943
    const DEFAULT_LNG = 9.1896346
    
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, address_line, city, country, postcode, lat, lng')
      .eq('status', 'PUBLISHED')
      .eq('lat', DEFAULT_LAT)
      .eq('lng', DEFAULT_LNG)
      .limit(50) // Process max 50 at a time to avoid timeout

    if (listingsError) {
      throw listingsError
    }

    console.log(`Found ${listings.length} listings needing geocoding`)

    const results = []

    for (const listing of listings) {
      try {
        // Log the listing we're processing
        console.log(`📋 Processing: ${listing.title} | address_line: ${listing.address_line}`)
        
        let addressToGeocode = ''
        
        // Try to extract address from title first
        if (listing.title) {
          const patterns = [
            // Match "in Via/Viale/etc Name Number"
            /(?:in|at)\s+((?:via|viale|corso|piazza|largo|alzaia)\s+[a-zA-ZÀ-ÿ'\s.,-]+?\s+\d+)/i,
            // Match just "Via/Viale/etc Name Number"
            /((?:via|viale|corso|piazza|largo|alzaia)\s+[a-zA-ZÀ-ÿ'\s.,-]+?\s+\d+)/i,
          ]
          
          for (const pattern of patterns) {
            const match = listing.title.match(pattern)
            if (match && match[1]) {
              addressToGeocode = match[1].trim()
              console.log(`📍 Extracted from title: "${addressToGeocode}"`)
              break
            }
          }
        }
        
        // If no address from title, use address_line
        if (!addressToGeocode && listing.address_line) {
          addressToGeocode = listing.address_line.trim()
          console.log(`📍 Using address_line: "${addressToGeocode}"`)
        }
        
        // If still no address, skip
        if (!addressToGeocode) {
          console.error(`❌ No address found for listing: ${listing.title}`)
          results.push({
            listing_id: listing.id,
            title: listing.title,
            success: false,
            error: 'No address available'
          })
          continue
        }
        
        // Build full geocoding query using available fields, avoid duplicates
        const normalizeCity = (raw?: string) => {
          if (!raw) return 'Milano'
          const c = raw.trim()
          return /^milan$/i.test(c) ? 'Milano' : c
        }
        const normalizeCountry = (raw?: string) => {
          if (!raw) return 'Italy'
          const r = raw.trim()
          if (/^it$/i.test(r)) return 'Italy'
          if (/^italia$/i.test(r)) return 'Italy'
          return r
        }
        const includesIgnoreCase = (str: string, sub: string) => (str || '').toLowerCase().includes((sub || '').toLowerCase())

        const city = normalizeCity(listing.city)
        const country = normalizeCountry(listing.country)
        const postcode = listing.postcode ? String(listing.postcode).trim() : ''

        const parts: string[] = []
        if (addressToGeocode) parts.push(addressToGeocode)
        if (postcode && !includesIgnoreCase(addressToGeocode, postcode)) parts.push(postcode)
        if (city && !includesIgnoreCase(addressToGeocode, city)) parts.push(city)
        if (country && !includesIgnoreCase(addressToGeocode, country) && !includesIgnoreCase(city, country)) parts.push(country)

        const geocodeQuery = parts.join(', ')
        console.log(`🔍 Geocoding: ${geocodeQuery}`)

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geocodeQuery)}&limit=1&addressdetails=1`
        
        const geocodeResponse = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'Flat2Study-App/1.0' }
        })

        if (!geocodeResponse.ok) {
          console.error(`❌ Geocoding failed: ${geocodeResponse.statusText}`)
          results.push({
            listing_id: listing.id,
            title: listing.title,
            success: false,
            error: `Geocoding failed: ${geocodeResponse.statusText}`
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        let geocodeResults: GeocodeResult[] = await geocodeResponse.json()

        if (geocodeResults.length === 0) {
          // Fallback: try replacing Milan -> Milano and/or removing postcode
          let fallbackQuery = geocodeQuery
          if (/\bmilan\b/i.test(fallbackQuery) && !/\bmilano\b/i.test(fallbackQuery)) {
            fallbackQuery = fallbackQuery.replace(/\bmilan\b/ig, 'Milano')
          }
          if (postcode) {
            const pc = postcode.replace(/[-\s]/g, '')
            const pcRegex = new RegExp(`,?\\s*${pc}`, 'i')
            fallbackQuery = fallbackQuery.replace(pcRegex, '')
          }
          console.log(`🔁 Fallback geocoding: ${fallbackQuery}`)
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1&addressdetails=1`
          const fallbackResp = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Flat2Study-App/1.0' } })
          if (fallbackResp.ok) {
            geocodeResults = await fallbackResp.json()
          }
        }

        if (geocodeResults.length === 0) {
          console.error(`❌ No results for: ${geocodeQuery}`)
          results.push({
            listing_id: listing.id,
            title: listing.title,
            address_tried: geocodeQuery,
            success: false,
            error: 'Address not found'
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        const result = geocodeResults[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        console.log(`✅ Found: ${lat}, ${lng}`)

        // Update listing
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            lat,
            lng,
            address_line: listing.address_line || addressToGeocode,
            updated_at: new Date().toISOString()
          })
          .eq('id', listing.id)

        if (updateError) {
          console.error(`❌ Update failed:`, updateError)
          results.push({
            listing_id: listing.id,
            title: listing.title,
            success: false,
            error: `Update failed: ${updateError.message}`
          })
        } else {
          results.push({
            listing_id: listing.id,
            title: listing.title,
            success: true,
            old_coordinates: { lat: listing.lat, lng: listing.lng },
            new_coordinates: { lat, lng },
            geocoded_address: result.display_name
          })
        }

        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Error processing listing:`, error)
        results.push({
          listing_id: listing.id,
          title: listing.title,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Successfully geocoded ${successCount}/${results.length} listings`)

    return new Response(
      JSON.stringify({ 
        success: true,
        total_listings: listings.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})