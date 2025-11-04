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

    const { listing_url } = await req.json();

    if (!listing_url) {
      throw new Error('listing_url is required');
    }

    console.log('Fetching images from:', listing_url);

    // Fetch the listing page
    const response = await fetch(listing_url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const imageSet = new Set<string>();

    // 1. Try to get structured data
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.image) {
          const imgArray = Array.isArray(data.image) ? data.image : [data.image];
          imgArray.forEach(img => imageSet.add(img));
        }
      } catch (e) {
        console.log('Failed to parse JSON-LD:', e);
      }
    }

    // 2. Meta tags
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage) imageSet.add(ogImage);

    // 3. Look for all property images
    const imageSelectors = [
      'img[src*="roomless"]',
      'img[src*="spacest"]',
      'img[src*="cloudinary"]',
      '[class*="gallery"] img',
      '[class*="carousel"] img',
      '[class*="slider"] img',
      '[class*="photo"] img',
      '[class*="image"] img',
      '[data-testid*="image"] img',
      'picture source',
      'picture img',
      'main img'
    ];

    for (const selector of imageSelectors) {
      const elements = doc.querySelectorAll(selector);
      for (const el of elements) {
        const src = el.getAttribute('src') || el.getAttribute('srcset')?.split(' ')[0] || el.getAttribute('data-src');
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
          const fullUrl = src.startsWith('//') ? `https:${src}` : src;
          // Filter out tiny images, icons, logos
          if (!fullUrl.match(/logo|icon|avatar|favicon|flag|error404/i) && !fullUrl.includes('20x20')) {
            imageSet.add(fullUrl);
          }
        }
      }
    }

    const images = Array.from(imageSet).slice(0, 20); // Max 20 images

    console.log(`Found ${images.length} images:`, images);

    if (images.length === 0) {
      throw new Error('No images found on the page');
    }

    // Extract listing ID from URL
    const listingIdMatch = listing_url.match(/\d+$/);
    if (!listingIdMatch) {
      throw new Error('Could not extract listing ID from URL');
    }

    const externalListingId = `spacest-${listingIdMatch[0]}`;

    // Update the listing with new images
    const { data, error } = await supabase
      .from('listings')
      .update({ images })
      .eq('external_listing_id', externalListingId)
      .select();

    if (error) throw error;

    console.log('Updated listing images:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        listing: data,
        images_found: images.length,
        images 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to update images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
