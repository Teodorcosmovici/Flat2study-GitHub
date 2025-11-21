import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpacestListing {
  code: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  price?: number;
  deposit?: number;
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  size?: number;
  furnished?: boolean;
  bills_included?: boolean;
  images?: string[];
  amenities?: string[];
  availability_date?: string;
  occupation_periods?: Array<{ from: string; to: string }>;
}

interface Classification {
  type: 'single_room' | 'studio' | 'multi_bedroom_apartment' | 'unknown';
  mappedCategory: string;
  reasoning?: string;
}

// AI-powered classification using Lovable AI Gateway
async function classifyListingWithAI(
  category: string,
  bedrooms: number,
  description?: string
): Promise<Classification> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not found, using fallback classification');
    return fallbackClassification(category, bedrooms);
  }

  try {
    const prompt = `Classify this rental listing into one of these types:
- single_room: A private room in a shared apartment/house
- studio: A complete small apartment for one person (monolocale, efficiency, studio)
- multi_bedroom_apartment: An apartment with 2+ bedrooms
- unknown: Cannot determine or invalid listing

Listing details:
- Category: "${category}"
- Bedrooms: ${bedrooms}
${description ? `- Description: "${description.substring(0, 200)}"` : ''}

Return the classification type and the appropriate Italian category mapping:
- single_room → "stanza"
- studio → "monolocale"
- multi_bedroom_apartment → "bilocale" (2 bed) or "appartamento" (3+ bed)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a real estate listing classifier. Respond with structured JSON only.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_listing',
            description: 'Classify a rental listing',
            parameters: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['single_room', 'studio', 'multi_bedroom_apartment', 'unknown']
                },
                mappedCategory: {
                  type: 'string',
                  description: 'Italian category: stanza, monolocale, bilocale, or appartamento'
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of classification'
                }
              },
              required: ['type', 'mappedCategory']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'classify_listing' } }
      }),
    });

    if (!response.ok) {
      console.error(`AI Gateway error: ${response.status}`);
      return fallbackClassification(category, bedrooms);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return {
        type: result.type,
        mappedCategory: result.mappedCategory,
        reasoning: result.reasoning
      };
    }

    return fallbackClassification(category, bedrooms);
  } catch (error) {
    console.error('AI classification error:', error);
    return fallbackClassification(category, bedrooms);
  }
}

// Comprehensive fallback classification with all vocabulary variations
function fallbackClassification(category: string, bedrooms: number): Classification {
  const lowerCategory = (category || '').toLowerCase().trim();
  
  // Single room keywords (English, Italian, Spanish, French, Portuguese, German)
  const roomKeywords = [
    'room', 'single room', 'private room', 'bedroom', 'double room',
    'stanza', 'camera', 'camera singola', 'camera doppia', 'posto letto',
    'habitación', 'habitacion', 'cuarto',
    'chambre', 'chambre privée', 'chambre simple',
    'quarto', 'quarto individual',
    'zimmer', 'einzelzimmer'
  ];
  
  // Studio/efficiency keywords (all languages)
  const studioKeywords = [
    'studio', 'studio apartment', 'efficiency', 'bachelor', 'bedsit',
    'monolocale', 'miniappartamento',
    'estudio',
    'studio meublé',
    'kitchenette',
    'apartamento tipo estudio'
  ];
  
  // Multi-bedroom apartment keywords (all languages)
  const apartmentKeywords = [
    'apartment', 'flat', 'condo', 'unit',
    'appartamento', 'bilocale', 'trilocale', 'quadrilocale', 'attico',
    'apartamento', 'piso', 'departamento',
    'appartement',
    'wohnung'
  ];
  
  // Shared/co-living keywords (treat as single room)
  const sharedKeywords = [
    'shared', 'coliving', 'co-living', 'flatshare', 'houseshare',
    'condiviso', 'condivisa',
    'compartido', 'compartida',
    'partagé', 'colocation'
  ];
  
  // Check for studios first (most specific)
  if (bedrooms === 0 || studioKeywords.some(kw => lowerCategory.includes(kw))) {
    return { 
      type: 'studio', 
      mappedCategory: 'monolocale', 
      reasoning: `Fallback: Studio detected (${bedrooms} bedrooms, category: "${category}")` 
    };
  }
  
  // Check for single/shared rooms
  if (
    bedrooms === 1 || 
    roomKeywords.some(kw => lowerCategory.includes(kw)) ||
    sharedKeywords.some(kw => lowerCategory.includes(kw))
  ) {
    return { 
      type: 'single_room', 
      mappedCategory: 'stanza', 
      reasoning: `Fallback: Single room detected (${bedrooms} bedrooms, category: "${category}")` 
    };
  }
  
  // Check for multi-bedroom apartments
  if (bedrooms >= 2 || apartmentKeywords.some(kw => lowerCategory.includes(kw))) {
    const effectiveBedrooms = bedrooms || 2; // Default to 2 if not specified
    const mappedCategory = effectiveBedrooms === 2 ? 'bilocale' : 
                           effectiveBedrooms === 3 ? 'trilocale' : 'appartamento';
    return { 
      type: 'multi_bedroom_apartment', 
      mappedCategory, 
      reasoning: `Fallback: ${effectiveBedrooms}-bedroom apartment detected (category: "${category}")` 
    };
  }
  
  // If we still can't classify, default based on bedrooms count
  if (bedrooms >= 2) {
    const mappedCategory = bedrooms === 2 ? 'bilocale' : 'appartamento';
    return { 
      type: 'multi_bedroom_apartment', 
      mappedCategory, 
      reasoning: `Fallback: Default to apartment based on ${bedrooms} bedrooms` 
    };
  }
  
  return { 
    type: 'unknown', 
    mappedCategory: '', 
    reasoning: `Fallback: Could not classify (bedrooms: ${bedrooms}, category: "${category}")` 
  };
}

// Updated validation function with AI classification
async function shouldImportListing(
  listing: SpacestListing,
  classification: Classification
): Promise<boolean> {
  // Reject unknown types
  if (classification.type === 'unknown') return false;
  
  // Price validation based on type
  const price = listing.price || 0;
  
  if (classification.type === 'single_room' || classification.type === 'studio') {
    // Single rooms and studios: 300-1200 EUR total
    return price >= 300 && price <= 1200;
  }
  
  if (classification.type === 'multi_bedroom_apartment') {
    // Multi-bedroom apartments: 300-1000 EUR per room
    const bedrooms = listing.bedrooms || 2;
    const pricePerRoom = price / bedrooms;
    return pricePerRoom >= 300 && pricePerRoom <= 1000;
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the requesting user
    const authHeader = req.headers.get('Authorization');
    let requestingUserId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      requestingUserId = user?.id || null;
    }

    const { listings } = await req.json();

    if (!listings || !Array.isArray(listings)) {
      throw new Error('listings array is required');
    }

    console.log(`Processing ${listings.length} listings from feed`);

    // Get or create Spacest agency profile
    const spacestEmail = 'spacest-listings@flat2study.com';
    
    const { data: existingAgency } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', spacestEmail)
      .eq('user_type', 'agency')
      .maybeSingle();

    let agencyId: string;
    
    if (existingAgency) {
      agencyId = existingAgency.id;
      console.log('Using existing Spacest agency:', agencyId);
    } else {
      console.log('No existing Spacest profile found');
      
      // Fallback: Use the requesting admin user's profile as temporary owner
      if (requestingUserId) {
        console.log('Using requesting user as fallback owner:', requestingUserId);
        
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', requestingUserId)
          .single();
        
        if (adminProfile) {
          agencyId = adminProfile.id;
          console.log('Using admin profile as agency:', agencyId);
        } else {
          throw new Error('Could not find profile for requesting user');
        }
      } else {
        throw new Error('No authentication provided and no Spacest profile exists. Please create a Spacest agency profile manually first.');
      }
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Milan area bounds
    const MILAN_BOUNDS = {
      minLat: 45.26,
      maxLat: 45.66,
      minLng: 9.00,
      maxLng: 9.38,
    };

    // Track valid listing codes from the feed
    const validListingCodes = new Set<string>();
    
    // Classification cache to minimize AI calls
    const classificationCache = new Map<string, Classification>();
    let skippedDetails: string[] = [];

    for (const listing of listings) {
      try {
        // Get or create classification
        const cacheKey = `${listing.category}-${listing.bedrooms || 0}`;
        let classification = classificationCache.get(cacheKey);
        
        if (!classification) {
          classification = await classifyListingWithAI(
            listing.category || '',
            listing.bedrooms || 0,
            listing.description
          );
          classificationCache.set(cacheKey, classification);
          console.log(`AI classified "${cacheKey}" as ${classification.type} (${classification.mappedCategory}): ${classification.reasoning}`);
        }

        // Validate with AI classification
        const isValid = await shouldImportListing(listing, classification);
        if (!isValid) {
          if (skippedDetails.length < 10) {
            skippedDetails.push(`${listing.code}: ${classification.type}, ${listing.price}€, ${listing.bedrooms}bed`);
          }
          skipped++;
          continue;
        }

        // REJECT invalid coordinates (changed from allowing null/0)
        if (
          !listing.lat || !listing.lng ||
          listing.lat === 0 || listing.lng === 0 ||
          listing.lat < MILAN_BOUNDS.minLat ||
          listing.lat > MILAN_BOUNDS.maxLat ||
          listing.lng < MILAN_BOUNDS.minLng ||
          listing.lng > MILAN_BOUNDS.maxLng
        ) {
          if (skippedDetails.length < 10) {
            skippedDetails.push(`${listing.code}: Invalid/non-Milan coordinates`);
          }
          skipped++;
          continue;
        }

        // Track this listing as valid
        validListingCodes.add(listing.code);

        const mappedListing = mapSpacestListing(listing, agencyId, classification.mappedCategory);

        // Check if listing exists
        const { data: existingListing } = await supabase
          .from('listings')
          .select('id')
          .eq('external_listing_id', listing.code)
          .single();

        if (existingListing) {
          await supabase
            .from('listings')
            .update(mappedListing)
            .eq('id', existingListing.id);
          updated++;
        } else {
          await supabase.from('listings').insert(mappedListing);
          imported++;
        }
      } catch (error) {
        console.error(`Error processing listing ${listing.code}:`, error);
      }
    }
    
    // Log summary
    console.log(`Import summary: ${imported} imported, ${updated} updated, ${skipped} skipped, ${classificationCache.size} unique categories classified`);
    if (skippedDetails.length > 0) {
      console.log('Sample skipped listings:', skippedDetails.join('; '));
    }

    // Remove listings that are no longer in the feed
    const { data: existingSpacestListings } = await supabase
      .from('listings')
      .select('id, external_listing_id')
      .eq('external_source', 'spacest')
      .not('external_listing_id', 'is', null);

    let removed = 0;
    if (existingSpacestListings) {
      for (const existing of existingSpacestListings) {
        if (!validListingCodes.has(existing.external_listing_id)) {
          await supabase
            .from('listings')
            .delete()
            .eq('id', existing.id);
          removed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        removed,
        skipped,
        total: listings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function mapSpacestListing(listing: SpacestListing, agencyId: string, mappedCategory: string): any {
  const city = listing.city || extractCity(listing.address);
  const addressLine = listing.address || '';
  
  return {
    external_listing_id: listing.code,
    external_source: 'spacest',
    agency_id: agencyId,
    title: listing.title || generateTitle(listing),
    type: mappedCategory,
    description: listing.description || '',
    address_line: addressLine,
    city: city,
    country: listing.country || 'Italy',
    lat: listing.lat || 0,
    lng: listing.lng || 0,
    rent_monthly_eur: listing.price,
    deposit_eur: listing.deposit || 0,
    bills_included: listing.bills_included || false,
    furnished: listing.furnished !== false,
    bedrooms: listing.bedrooms || (mappedCategory === 'monolocale' ? 0 : 1),
    bathrooms: listing.bathrooms || 1,
    floor: listing.floor || null,
    size_sqm: listing.size || null,
    amenities: listing.amenities || [],
    availability_date: listing.availability_date || null,
    images: listing.images || [],
    status: 'PUBLISHED',
    review_status: 'approved',
    last_synced_at: new Date().toISOString(),
  };
}

function extractCity(address?: string): string {
  if (!address) return 'Milano';
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes('milan') || lowerAddress.includes('milano')) {
    return 'Milano';
  }
  return 'Milano';
}

function generateTitle(listing: SpacestListing): string {
  const type = listing.category || 'Room';
  const city = extractCity(listing.address);
  return `${type} in ${city}`;
}
