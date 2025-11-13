import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, checkin, checkout } = await req.json();

    console.log('Testing Spacest API with:', { listingId, checkin, checkout });

    // Call Spacest API
    const response = await fetch('https://apigateway.roomlessrent.com/rent-svc/rent/calculate-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'flat2study',
      },
      body: JSON.stringify({
        listingId: listingId || 202523,
        checkin: checkin || '2025-11-11',
        checkout: checkout || '2025-12-11',
        'X-Source': 'flat2study',
      }),
    });

    const responseText = await response.text();
    console.log('Spacest API response status:', response.status);
    console.log('Spacest API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error testing Spacest API:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
