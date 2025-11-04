import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

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

    const listingUrl = 'https://spacest.com/it/rent-listing/180298';
    console.log('Fetching images from:', listingUrl);

    // Fetch the listing page
    const response = await fetch(listingUrl);
    const html = await response.text();
    
    console.log('HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 500));
    
    // Extract all roomless image URLs using multiple patterns
    const imageSet = new Set<string>();
    
    // Pattern 1: Direct URL in src or href
    const urlPattern = /https:\/\/roomless-listing-images\.s3\.us-east-2\.amazonaws\.com\/[^"'\s)>]+\.(jpeg|jpg|png)/gi;
    const urlMatches = html.match(urlPattern);
    if (urlMatches) {
      urlMatches.forEach(url => imageSet.add(url));
    }
    
    // Pattern 2: Parse with DOM
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (doc) {
      const imgElements = doc.querySelectorAll('img[src*="roomless-listing-images"]');
      for (const img of imgElements) {
        const src = img.getAttribute('src');
        if (src) imageSet.add(src);
      }
    }
    
    const uniqueImages = Array.from(imageSet);
    
    console.log(`Found ${uniqueImages.length} unique images`);
    
    if (uniqueImages.length === 0) {
      throw new Error('No images found in the HTML. HTML length: ' + html.length);
    }
    
    console.log(`Found ${uniqueImages.length} unique images:`, uniqueImages);

    // Update the listing
    const externalListingId = 'spacest-180298';

    const { data, error } = await supabase
      .from('listings')
      .update({ images: uniqueImages })
      .eq('external_listing_id', externalListingId)
      .select();

    if (error) throw error;

    console.log('Updated listing with images:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        listing: data,
        images_count: uniqueImages.length,
        images: uniqueImages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to extract and update images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
