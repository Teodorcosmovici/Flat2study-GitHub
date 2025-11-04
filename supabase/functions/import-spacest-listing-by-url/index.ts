import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

// Extract images ONLY from main listing gallery (not sidebar/related properties)
function extractAllImageUrls(html: string): string[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      console.error('Failed to parse HTML, falling back to regex');
      return extractImageUrlsFallback(html);
    }

    const imageSet = new Set<string>();
    
    // Target ONLY main content/gallery areas, exclude sidebars
    const mainSelectors = [
      'main img[src*="roomless"]',
      '[class*="gallery"] img[src*="roomless"]',
      '[class*="listing-image"] img[src*="roomless"]',
      '[class*="property-image"] img[src*="roomless"]',
      '[id*="gallery"] img[src*="roomless"]',
      '[data-testid*="image"] img[src*="roomless"]',
      '.content img[src*="roomless"]',
    ];
    
    // Exclude sidebar/related/similar property areas
    const excludeSelectors = [
      '[class*="sidebar"]',
      '[class*="related"]',
      '[class*="similar"]',
      '[class*="recommended"]',
      'aside',
    ];
    
    for (const selector of mainSelectors) {
      const images = doc.querySelectorAll(selector);
      
      for (const img of images) {
        // Check if this image is inside an excluded section
        let isExcluded = false;
        for (const excludeSelector of excludeSelectors) {
          if (img.closest(excludeSelector)) {
            isExcluded = true;
            break;
          }
        }
        
        if (!isExcluded) {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
          if (src.includes('roomless-listing-images.s3.us-east-2.amazonaws.com') && src.endsWith('.jpeg')) {
            imageSet.add(src);
          }
        }
      }
    }
    
    console.log(`✓ Found ${imageSet.size} total images from all selectors`);
    
    // If no images found with DOM parsing, try fallback
    if (imageSet.size === 0) {
      console.log('DOM extraction found 0 images, using fallback regex');
      return extractImageUrlsFallback(html);
    }
    
    const urls = Array.from(imageSet);
    console.log(`✓ DOM extracted ${urls.length} images from main gallery`);
    return urls;
    
  } catch (error) {
    console.error('Error in DOM extraction:', error);
    return extractImageUrlsFallback(html);
  }
}

// Fallback: extract from entire page (less accurate)
function extractImageUrlsFallback(html: string): string[] {
  const imageRegex = /https:\/\/roomless-listing-images\.s3\.us-east-2\.amazonaws\.com\/[^"'\s<>)]+\.jpeg/gi;
  const allMatches = html.match(imageRegex) || [];
  console.log(`⚠️ Fallback regex found ${allMatches.length} images (may include unrelated properties)`);
  return allMatches;
}

// Use AI to identify which images belong to the MAIN property (not related/similar listings)
async function identifyMainPropertyImages(allImageUrls: string[], html: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || allImageUrls.length === 0) {
    console.log('⚠️ Skipping AI image filtering, returning all URLs');
    return allImageUrls;
  }

  // Create a map of shortened URLs for AI analysis (easier for AI to read)
  const urlMap = new Map<string, string>();
  allImageUrls.forEach((url, idx) => {
    const shortId = `IMG_${idx}`;
    urlMap.set(shortId, url);
  });

  const prompt = `You are analyzing a Spacest.com property listing page.

CRITICAL TASK: Identify which images belong to the MAIN property listing being viewed, NOT related/similar properties shown in sidebars or recommendations.

IMAGE LIST (${allImageUrls.length} total):
${Array.from(urlMap.entries()).map(([id, url]) => `${id}: ${url.split('/').pop()}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Look at the HTML structure to understand which images are in the main property gallery vs sidebars
2. Images in the MAIN property gallery are typically:
   - In a carousel/slideshow at the top of the page
   - In the main content area (not sidebar)
   - Part of the detailed property view
3. EXCLUDE images that are:
   - In "Similar Properties" or "Related Listings" sections
   - In sidebars showing other properties
   - Advertisements or promotional content
   
Return ONLY a JSON object with the IDs of images belonging to the MAIN property:
{
  "main_property_images": ["IMG_0", "IMG_5", "IMG_12"]
}

HTML SNIPPET (focusing on structure):
${html.substring(0, 50000)}`;

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
      console.error('AI image filtering failed:', response.status);
      return allImageUrls;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No AI response for image filtering');
      return allImageUrls;
    }

    const result = JSON.parse(content);
    const mainImageIds = result.main_property_images || [];
    
    // Map back to full URLs
    const mainPropertyUrls = mainImageIds
      .map((id: string) => urlMap.get(id))
      .filter((url: string | undefined): url is string => url !== undefined);
    
    console.log(`✓ AI filtered ${allImageUrls.length} → ${mainPropertyUrls.length} main property images`);
    return mainPropertyUrls;
    
  } catch (error) {
    console.error('AI image filtering error:', error);
    return allImageUrls; // Fallback to all images
  }
}

// Strict deterministic deduplication based on URL patterns
function deduplicateImageUrls(imageUrls: string[]): string[] {
  if (imageUrls.length === 0) return [];
  
  // Group images by their base path (without size indicators)
  const groups = new Map<string, string[]>();
  
  for (const url of imageUrls) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Extract base filename by removing ALL size patterns:
      // - Remove -WIDTHxHEIGHT (e.g., -150x150, -800x600)
      // - Remove -scaled
      // - Remove WIDTHxHEIGHT. before extension
      const basePath = path
        .replace(/-\d+x\d+(?=\.jpeg)/gi, '') // Remove -150x150 before .jpeg
        .replace(/-scaled(?=\.jpeg)/gi, '')   // Remove -scaled before .jpeg  
        .replace(/\d+x\d+\.jpeg$/i, '.jpeg'); // Remove 800x600.jpeg -> .jpeg
      
      if (!groups.has(basePath)) {
        groups.set(basePath, []);
      }
      groups.get(basePath)!.push(url);
    } catch {
      continue;
    }
  }
  
  // For each group, keep only the largest version
  const deduplicated: string[] = [];
  let totalDuplicates = 0;
  
  for (const [basePath, urlGroup] of groups.entries()) {
    if (urlGroup.length === 1) {
      deduplicated.push(urlGroup[0]);
      continue;
    }
    
    totalDuplicates += urlGroup.length - 1;
    
    // Sort by: 1) URLs without size indicators first, 2) then by length
    const sorted = urlGroup.sort((a, b) => {
      const aHasSize = /-\d+x\d+/.test(a) || /\d+x\d+\./.test(a) || /-scaled/.test(a);
      const bHasSize = /-\d+x\d+/.test(b) || /\d+x\d+\./.test(b) || /-scaled/.test(b);
      
      if (aHasSize && !bHasSize) return 1;  // b comes first (no size indicator)
      if (!aHasSize && bHasSize) return -1; // a comes first (no size indicator)
      
      return b.length - a.length; // Longer URLs first
    });
    
    deduplicated.push(sorted[0]);
    console.log(`  Kept: ${sorted[0].split('/').pop()}`);
    console.log(`  Removed ${urlGroup.length - 1} duplicates`);
  }
  
  console.log(`✓ Strict deduplication: ${imageUrls.length} → ${deduplicated.length} unique images (removed ${totalDuplicates} duplicates)`);
  return deduplicated;
}

// Geocode address to get accurate coordinates
async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('No Google Maps API key configured, using default Milan coordinates');
    return null;
  }

  try {
    // Construct full address for geocoding
    const fullAddress = `${address}, ${city}, Italy`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log(`✓ Geocoded "${fullAddress}" to: ${location.lat}, ${location.lng}`);
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      console.warn(`Geocoding failed for "${fullAddress}": ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

async function analyzeListingWithAI(html: string, url: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  // Step 1: Extract ALL image URLs from HTML (including duplicates and related properties)
  const allImageUrls = extractAllImageUrls(html);
  console.log(`Found ${allImageUrls.length} total URLs (including duplicates and related properties)`);
  
  // Step 2: Use AI to identify which images belong to THIS property (not related/similar listings)
  const propertyImagesWithDuplicates = await identifyMainPropertyImages(allImageUrls, html);
  console.log(`✓ AI identified ${propertyImagesWithDuplicates.length} images belonging to main property`);
  
  // Step 3: Use strict deduplication to remove size variations
  const propertyImages = deduplicateImageUrls(propertyImagesWithDuplicates);
  console.log(`✓ After deduplication: ${propertyImages.length} unique property images`);

  const prompt = `Extract property details from this Spacest listing.

**YOUR TASK:**
Extract only the following property details:
- Total apartment rent per month (look for "€" followed by amount, typically €1800-2000)
- Monthly utilities/bills (spese condominiali, typically €70-100)
- Number of bedrooms
- Number of bathrooms  
- Size in square meters (m²)
- Full address (street name and number if available)
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
      lat: 45.4654219, // Will be updated by geocoding
      lng: 9.1859243, // Will be updated by geocoding
      bedrooms: Math.max(1, aiData.bedrooms || 1),
      bathrooms: Math.max(1, aiData.bathrooms || 1),
      size_sqm: aiData.size_sqm || null,
      images: aiData.images || [],
      type: (aiData.bedrooms || 1) >= 2 ? 'apartment' : 'studio',
      furnished: true,
      bills_included: false,
    } : await parseListingPage(html, listingId);
    
    // Geocode the address to get accurate coordinates
    if (listingData.address) {
      const coords = await geocodeAddress(listingData.address, listingData.city);
      if (coords) {
        listingData.lat = coords.lat;
        listingData.lng = coords.lng;
      } else {
        console.log(`Using default Milan coordinates for: ${listingData.address}`);
      }
    }
    
    console.log('Listing data prepared:', { 
      images: listingData.images.length,
      rent: listingData.price,
      bedrooms: listingData.bedrooms,
      coordinates: `${listingData.lat}, ${listingData.lng}`
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
    
    // Extract images using strict deterministic deduplication
    const allImageUrls = extractAllImageUrls(html);
    images = deduplicateImageUrls(allImageUrls);
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
