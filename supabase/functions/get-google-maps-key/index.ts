import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('get-google-maps-key function called');
    console.log('Available environment variables:', Object.keys(Deno.env.toObject()));
    
    const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    console.log('API key exists:', !!googleMapsKey);
    console.log('API key length:', googleMapsKey ? googleMapsKey.length : 0);
    console.log('API key starts with:', googleMapsKey ? googleMapsKey.substring(0, 10) + '...' : 'N/A');
    
    if (!googleMapsKey || googleMapsKey.trim() === '') {
      console.error('Google Maps API key not found in environment or is empty');
      console.error('Full environment check:', {
        hasKey: !!googleMapsKey,
        keyLength: googleMapsKey ? googleMapsKey.length : 0,
        envVarCount: Object.keys(Deno.env.toObject()).length
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          debug: {
            hasKey: !!googleMapsKey,
            keyLength: googleMapsKey ? googleMapsKey.length : 0,
            envVarCount: Object.keys(Deno.env.toObject()).length,
            availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => !key.includes('SECRET'))
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Returning API key successfully');
    return new Response(
      JSON.stringify({ apiKey: googleMapsKey }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in get-google-maps-key function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Failed to get Google Maps API key', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})