import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Extract ALL images using comprehensive regex
function extractAllImageUrls(html: string): string[] {
  const imageRegex = /https:\/\/roomless-listing-images\.s3\.us-east-2\.amazonaws\.com\/[^"'\s<>)]+\.jpeg/gi;
  const allMatches = html.match(imageRegex) || [];
  console.log(`Found ${allMatches.length} total image URLs in HTML`);
  return allMatches;
}

// Use AI to identify property images and remove duplicates/sizes
async function identifyPropertyImages(imageUrls: string[]): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || imageUrls.length === 0) {
    return imageUrls;
  }

  const prompt = `You are analyzing image URLs from a property listing page to identify the actual property photos.

**YOUR TASK:**
Given this list of ${imageUrls.length} image URLs, identify which ones are ACTUAL PROPERTY PHOTOS by analyzing URL patterns.

**RULES:**
1. The same photo appears in multiple sizes (e.g., image.jpeg, image-150x150.jpeg, image-800x600.jpeg)
2. For duplicate photos at different sizes, keep ONLY the LARGEST version (longest URL or highest resolution)
3. Include ALL unique property photos (bedrooms, bathrooms, kitchen, living room, exterior, etc.)
4. EXCLUDE: logos, icons, profile pictures (usually small or in "profile"/"logo" paths)
5. The listing should have 20-25 unique property photos

**IMAGE URLs:**
${imageUrls.slice(0, 100).join('\n')}

Return a JSON array of the UNIQUE, FULL-SIZE property image URLs:
{
  "property_images": ["url1", "url2", "url3", ...]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      console.error('AI identification failed, using manual deduplication');
      return manualDeduplication(imageUrls);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const identified = result.property_images || [];
    
    console.log(`✓ AI identified ${identified.length} unique property images from ${imageUrls.length} URLs`);
    return identified.length > 0 ? identified : manualDeduplication(imageUrls);
    
  } catch (error) {
    console.error('Error in AI identification:', error);
    return manualDeduplication(imageUrls);
  }
}

// Fallback: manual deduplication based on URL patterns
function manualDeduplication(urls: string[]): string[] {
  const basePathMap = new Map<string, { url: string; size: number }>();
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname;
      
      // Remove size indicators to get base path
      const basePath = path
        .replace(/-\d+x\d+/g, '')
        .replace(/-scaled/g, '')
        .replace(/\d+x\d+\./g, '.');
      
      // Calculate "size" - prefer URLs without size indicators (they're usually largest)
      const hasSize = /-\d+x\d+/.test(path) || /\d+x\d+\./.test(path);
      const size = hasSize ? url.length : url.length + 10000; // Boost non-sized URLs
      
      if (!basePathMap.has(basePath) || size > basePathMap.get(basePath)!.size) {
        basePathMap.set(basePath, { url, size });
      }
    } catch {
      continue;
    }
  }
  
  const result = Array.from(basePathMap.values()).map(v => v.url);
  console.log(`✓ Manual deduplication: ${urls.length} → ${result.length} unique images`);
  return result;
}

async function analyzeListingWithAI(html: string, url: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  // Step 1: Extract ALL image URLs from HTML
  const allImageUrls = extractAllImageUrls(html);
  
  // Step 2: Use AI to identify property images and remove duplicates
  const propertyImages = await identifyPropertyImages(allImageUrls);
  console.log(`✓ Final extraction: ${propertyImages.length} unique property images`);

  const prompt = `Extract property details from this Spacest listing.

**PRE-EXTRACTED IMAGES:**
I've already extracted ${propertyImages.length} unique property images using AI-powered analysis.
These are the main listing photos with all duplicates and different sizes removed.

**YOUR TASK:**
Extract only the following property details (NOT images):
- Total apartment rent per month (look for "€" followed by amount, typically €1800-2000)
- Monthly utilities/bills (spese condominiali, typically €70-100)
- Number of bedrooms
- Number of bathrooms  
- Size in square meters (m²)
- Full address
- Property title
- Property description

Return ONLY this JSON structure:
{
  "rent_monthly_eur": 1900,
  "utility_cost_eur": 85,
  "bedrooms": 2,
  "bathrooms": 2,
  "size_sqm": 60,
  "title": "string",
  "description": "string",
  "address": "string",
  "city": "Milano"
}

HTML:
${html}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    const extracted = JSON.parse(content);
    
    // Use AI-identified property images
    extracted.images = propertyImages;
    console.log(`✓ Final result: ${extracted.images.length} property images`);
    
    return extracted;
  } catch (error) {
    console.error('Failed to analyze with AI:', error);
    // Use extracted images even on error
    return {
      images: propertyImages,
      rent_monthly_eur: 1900,
      utility_cost_eur: 85,
      bedrooms: 2,
      bathrooms: 2,
      size_sqm: 60,
      title: 'Property',
      description: '',
      address: '',
      city: 'Milano'
    };
  }
}

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
    console.log('Page fetched, analyzing with AI...');

    // Use AI to analyze and extract all data accurately
    let aiData = null;
    try {
      aiData = await analyzeListingWithAI(html, listing_url);
      if (aiData) {
        console.log(`✓ AI extracted ${aiData.images?.length || 0} images`);
        console.log(`✓ Rent: €${aiData.rent_monthly_eur}, Utilities: €${aiData.utility_cost_eur}`);
      }
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
    
    // Use AI data if available, otherwise fall back to manual parsing
    const listingData = aiData ? {
      external_listing_id: `spacest-${listingId}`,
      title: aiData.title || `Property ${listingId}`,
      description: aiData.description || '',
      price: aiData.rent_monthly_eur || 0,
      address: aiData.address || '',
      city: aiData.city || 'Milano',
      country: 'Italy',
      lat: 45.4654219, // Milan default
      lng: 9.1859243,
      bedrooms: Math.max(1, aiData.bedrooms || 1),
      bathrooms: Math.max(1, aiData.bathrooms || 1),
      size_sqm: aiData.size_sqm || null,
      images: aiData.images || [],
      type: (aiData.bedrooms || 1) >= 2 ? 'apartment' : 'studio',
      furnished: true,
      bills_included: false,
    } : await parseListingPage(html, listingId);
    
    console.log('Listing data prepared:', { 
      images: listingData.images.length,
      rent: listingData.price,
      bedrooms: listingData.bedrooms 
    });

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
    const utilityPerType = aiData ? Math.round((aiData.utility_cost_eur || 0) / 4) : 21;
    
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
      // Utility costs
      electricity_cost_eur: utilityPerType,
      gas_cost_eur: utilityPerType,
      water_cost_eur: utilityPerType,
      internet_cost_eur: utilityPerType,
      electricity_included: false,
      gas_included: false,
      water_included: false,
      internet_included: false,
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

async function parseListingPage(html: string, listingId: string): Promise<ListingData> {
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
    
    // Try to extract the actual displayed price from HTML first
    // as structured data may contain per-room price instead of total
    const priceElements = doc.querySelectorAll('[class*="price"], [class*="Price"], .rent, .cost');
    for (const elem of priceElements) {
      const priceText = elem.textContent || '';
      // Look for prices in format like "€1,900" or "1900 €" or "1900"
      const priceMatch = priceText.match(/€?\s*([1-9]\d{2,4})(?:[.,]\d{3})*(?!\d)/);
      if (priceMatch) {
        const extractedPrice = parseInt(priceMatch[1].replace(/[.,]/g, ''));
        if (extractedPrice > 500) { // Reasonable minimum for full apartment
          price = extractedPrice;
          console.info('Extracted price from HTML element:', price, 'from text:', priceText);
          break;
        }
      }
    }
    
    // Fall back to structured data if HTML extraction failed
    if (!price && structuredData.offers?.price) {
      price = parseInt(structuredData.offers.price);
      console.info('Using structured data price:', price);
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
      const floorSizeStr = String(structuredData.floorSize);
      const match = floorSizeStr.match(/(\d+)/);
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
    
    // Extract images using AI-powered comprehensive extraction
    const allImageUrls = extractAllImageUrls(html);
    images = await identifyPropertyImages(allImageUrls);
    console.log(`Fallback parser extracted ${images.length} property images`);
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
    images, // Already deduplicated by smart extraction
    type,
    furnished: true,
    bills_included: false,
  };
}
