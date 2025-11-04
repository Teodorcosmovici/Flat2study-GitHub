import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingData {
  external_listing_id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  images: string[];
  type: string;
  furnished: boolean;
  bills_included: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing_url } = await req.json();

    if (!listing_url || typeof listing_url !== 'string') {
      throw new Error('listing_url is required');
    }

    console.log('Fetching Spacest listing from URL:', listing_url);

    // Extract listing ID from URL
    const listingId = extractListingId(listing_url);
    console.log('Extracted listing ID:', listingId);

    // Fetch the page
    const pageResponse = await fetch(listing_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch listing page: ${pageResponse.statusText}`);
    }

    const html = await pageResponse.text();
    console.log('Page fetched, parsing HTML...');

    // Parse the listing data
    const listingData = parseListingPage(html, listingId);
    console.log('Parsed listing data:', JSON.stringify(listingData, null, 2));

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create Spacest agency profile
    let agencyId: string;

    const { data: spacestProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('agency_name', 'Spacest')
      .eq('user_type', 'agency')
      .single();

    if (spacestProfile) {
      agencyId = spacestProfile.id;
    } else {
      const { data: anyAgency } = await supabase
        .from('profiles')
        .select('id, agency_name')
        .in('user_type', ['agency', 'private'])
        .limit(1)
        .single();

      if (!anyAgency) {
        throw new Error('No agency profile found. Please create an agency account first.');
      }

      agencyId = anyAgency.id;
      console.log(`Using agency profile: ${anyAgency.agency_name} (ID: ${agencyId})`);
    }

    // Map to database schema
    const mappedListing = {
      external_listing_id: listingData.external_listing_id,
      external_source: 'spacest',
      agency_id: agencyId,
      title: listingData.title,
      title_multilingual: {
        en: listingData.title,
        it: listingData.title,
      },
      type: listingData.type,
      description: listingData.description,
      description_multilingual: {
        en: listingData.description,
        it: listingData.description,
      },
      address_line: listingData.address,
      city: listingData.city,
      country: listingData.country,
      lat: listingData.lat,
      lng: listingData.lng,
      rent_monthly_eur: listingData.price,
      deposit_eur: listingData.price * 2,
      bills_included: listingData.bills_included,
      furnished: listingData.furnished,
      bedrooms: listingData.bedrooms,
      bathrooms: listingData.bathrooms,
      size_sqm: listingData.size_sqm,
      amenities: [],
      availability_date: new Date().toISOString().split('T')[0],
      images: listingData.images,
      status: 'DRAFT',
      review_status: 'pending_review',
      minimum_stay_days: 30,
      maximum_stay_days: 365,
      last_synced_at: new Date().toISOString(),
    };

    // Check if listing already exists
    const { data: existing } = await supabase
      .from('listings')
      .select('id')
      .eq('external_listing_id', listingData.external_listing_id)
      .eq('external_source', 'spacest')
      .single();

    let result;
    if (existing) {
      // Update existing listing
      const { data, error } = await supabase
        .from('listings')
        .update(mappedListing)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = { action: 'updated', listing: data };
      console.log('Listing updated:', existing.id);
    } else {
      // Insert new listing
      const { data, error } = await supabase
        .from('listings')
        .insert(mappedListing)
        .select()
        .single();

      if (error) throw error;
      result = { action: 'created', listing: data };
      console.log('Listing created:', data.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractListingId(url: string): string {
  // Extract ID from URL like https://spacest.com/it/rent-listing/180298
  const match = url.match(/rent-listing\/(\d+)/);
  if (!match) {
    throw new Error('Could not extract listing ID from URL');
  }
  return match[1];
}

function parseListingPage(html: string, listingId: string): ListingData {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  if (!doc) {
    throw new Error('Failed to parse HTML');
  }

  // Try to find JSON-LD structured data first
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let structuredData: any = null;

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      if (data['@type'] === 'Apartment' || data['@type'] === 'SingleFamilyResidence') {
        structuredData = data;
        break;
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e);
    }
  }

  // Extract data from structured data or fall back to meta tags
  let title = '';
  let description = '';
  let price = 0;
  let address = '';
  let city = 'Milan';
  let country = 'Italy';
  let lat = 45.4642;
  let lng = 9.1900;
  let bedrooms = 1;
  let bathrooms = 1;
  let size_sqm: number | null = null;
  let images: string[] = [];

  if (structuredData) {
    console.log('Using structured data');
    title = structuredData.name || '';
    description = structuredData.description || '';
    
    if (structuredData.offers?.price) {
      price = parseInt(structuredData.offers.price);
    }
    
    if (structuredData.address) {
      address = structuredData.address.streetAddress || '';
      city = structuredData.address.addressLocality || city;
      country = structuredData.address.addressCountry || country;
    }
    
    if (structuredData.geo) {
      lat = parseFloat(structuredData.geo.latitude) || lat;
      lng = parseFloat(structuredData.geo.longitude) || lng;
    }
    
    if (structuredData.numberOfRooms) {
      bedrooms = parseInt(structuredData.numberOfRooms) || 1;
    }
    
    if (structuredData.floorSize) {
      const match = structuredData.floorSize.match(/(\d+)/);
      if (match) {
        size_sqm = parseInt(match[1]);
      }
    }
    
    if (structuredData.image) {
      images = Array.isArray(structuredData.image) ? structuredData.image : [structuredData.image];
    }
  } else {
    console.log('Falling back to meta tags and selectors');
    
    // Extract from meta tags
    title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
            doc.querySelector('title')?.textContent || 
            'Spacest Property';
    
    description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                  doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                  '';
    
    // Try to extract price from page content
    const priceText = doc.querySelector('[class*="price"]')?.textContent || '';
    const priceMatch = priceText.match(/€?\s*(\d+[\d.,]*)/);
    if (priceMatch) {
      price = parseInt(priceMatch[1].replace(/[.,]/g, ''));
    }
    
    // Extract images
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage) {
      images.push(ogImage);
    }
    
    // Try to find gallery images
    const imgElements = doc.querySelectorAll('img[src*="spacest"], img[src*="cloudinary"]');
    for (const img of imgElements) {
      const src = img.getAttribute('src');
      if (src && !images.includes(src)) {
        images.push(src);
      }
    }
  }

  // Determine type based on bedrooms
  let type = 'room';
  if (bedrooms === 0 || bedrooms === 1) {
    type = 'studio';
  } else if (bedrooms >= 2) {
    type = 'apartment';
  }

  return {
    external_listing_id: `spacest-${listingId}`,
    title: title.trim() || `Property ${listingId}`,
    description: description.trim() || 'Spacest property listing',
    price: price || 800,
    address: address.trim() || 'Milan',
    city,
    country,
    lat,
    lng,
    bedrooms: Math.max(1, bedrooms),
    bathrooms: Math.max(1, bathrooms),
    size_sqm,
    images: images.slice(0, 10), // Limit to 10 images
    type,
    furnished: true,
    bills_included: false,
  };
}
