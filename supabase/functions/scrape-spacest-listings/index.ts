import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_LISTINGS_URL = "https://spacest.com/rent-listings/italy/milan";
const USER_AGENT = "Flat2StudyScraper/1.0";
const MIN_USD = 300;
const MAX_USD = 1200;
const FALLBACK_EUR_USD = 1.06;
const RATE_LIMIT_MS = 400;

interface ScrapedListing {
  listing_code: string | null;
  url: string;
  price_value: number | null;
  currency: string | null;
  price_usd: number | null;
  rooms: number | null;
  per_room_usd: number | null;
  matches_price: boolean;
  matches_per_room: boolean;
}

// Get EUR to USD exchange rate
async function getEurToUsd(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate.host/latest?base=EUR&symbols=USD", {
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    const rate = data?.rates?.USD;
    if (rate) {
      console.log(`EUR->USD rate: ${rate}`);
      return parseFloat(rate);
    }
  } catch (error) {
    console.warn(`Exchange rate fetch failed: ${error.message}`);
  }
  console.warn(`Using fallback EUR->USD rate: ${FALLBACK_EUR_USD}`);
  return FALLBACK_EUR_USD;
}

// Parse price string like "1.200 € / month" or "€1,200 / month"
function parsePriceString(s: string): { value: number | null; currency: string | null } {
  if (!s) return { value: null, currency: null };
  
  s = s.trim().replace(/\xa0/g, " ");
  s = s.replace(/^[Ff]rom\s+/, "");
  
  const numCandidates = s.match(/[\d\.,]+/g);
  if (!numCandidates) return { value: null, currency: null };
  
  let raw = numCandidates[0];
  
  // Normalize separators
  if (raw.includes(",") && raw.includes(".")) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else {
    raw = raw.replace(/,/g, "");
  }
  
  let value: number | null = null;
  try {
    value = parseFloat(raw);
  } catch {
    return { value: null, currency: null };
  }
  
  let currency = "EUR";
  if (s.includes("$")) {
    currency = "USD";
  } else if (s.includes("€") || s.includes("EUR") || s.toLowerCase().includes("euro")) {
    currency = "EUR";
  }
  
  return { value, currency };
}

// Parse number of rooms from text
function parseRoomsFromText(s: string): number | null {
  if (!s) return null;
  
  s = s.toLowerCase();
  
  const match = s.match(/\b(\d{1,2})\b/);
  if (match) {
    const n = parseInt(match[1]);
    if (n >= 1 && n <= 10) return n;
  }
  
  const wordsMap: Record<string, number> = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "uno": 1, "due": 2, "tre": 3, "quattro": 4, "cinque": 5, "sei": 6
  };
  
  for (const [word, num] of Object.entries(wordsMap)) {
    if (s.includes(word)) return num;
  }
  
  return null;
}

// Extract listing code from page
function extractListingCode(doc: any, pageUrl: string): string | null {
  // Try meta tags
  const metaTags = doc.querySelectorAll("meta");
  for (const meta of metaTags) {
    const name = meta.getAttribute("name")?.toLowerCase() || "";
    if (["listing_code", "listing-code", "listingcode", "listingid"].includes(name)) {
      return meta.getAttribute("content");
    }
  }
  
  // Try data attributes
  for (const attr of ["data-listing-code", "data-listingid", "data-id", "data-code"]) {
    const el = doc.querySelector(`[${attr}]`);
    if (el) {
      const val = el.getAttribute(attr);
      if (val) return val;
    }
  }
  
  // Try URL pattern
  const urlMatch = pageUrl.match(/\/listing(?:s)?\/.*?([0-9]{3,})/);
  if (urlMatch) return urlMatch[1];
  
  // Try body text
  const text = doc.body?.textContent || "";
  const textMatch = text.match(/listing[_\- ]?code[:\s]*([0-9]{3,})/i);
  if (textMatch) return textMatch[1];
  
  // Final fallback: any long numeric sequence
  const numMatch = text.match(/\b([0-9]{4,7})\b/);
  if (numMatch) return numMatch[1];
  
  return null;
}

// Extract price and rooms from page
function extractPriceAndRooms(doc: any): { price: number | null; currency: string | null; rooms: number | null } {
  const text = doc.body?.textContent || "";
  
  const pricePattern = /(?:€|\bEUR\b|\$)[\s\d\.,]+(?:\s*\/\s*month|\s*\/\s*m| per month|\/month)?/gi;
  const candidates = text.match(pricePattern);
  
  let price = null;
  let currency = null;
  
  if (candidates && candidates.length > 0) {
    const parsed = parsePriceString(candidates[0]);
    price = parsed.value;
    currency = parsed.currency;
  }
  
  let rooms: number | null = null;
  const roomMatch = text.match(/(\d)\s*(?:room|rooms|camera|camere|bed)/i);
  if (roomMatch) {
    rooms = parseInt(roomMatch[1]);
  } else {
    rooms = parseRoomsFromText(text);
  }
  
  return { price, currency, rooms };
}

// Fetch URL with retries
async function fetchUrl(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml"
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${error.message}`);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  return null;
}

// Gather listing links from index page
function gatherListingLinks(html: string, baseUrl: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) return [];
  
  const links = new Set<string>();
  const anchors = doc.querySelectorAll("a");
  
  for (const a of anchors) {
    const href = a.getAttribute("href");
    if (!href) continue;
    
    if (href.includes("/listing") || href.includes("/rent-listing") || href.includes("/rent/")) {
      try {
        const fullUrl = new URL(href, baseUrl).href;
        links.add(fullUrl);
      } catch {
        // Invalid URL, skip
      }
    }
  }
  
  return Array.from(links);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { maxListings = 20, importToDb = false } = await req.json().catch(() => ({}));
    
    console.log(`Starting Spacest scraper (max: ${maxListings}, import: ${importToDb})`);
    
    const eurUsd = await getEurToUsd();
    
    // Fetch index page
    const indexHtml = await fetchUrl(BASE_LISTINGS_URL);
    if (!indexHtml) {
      throw new Error("Could not fetch listings index page");
    }
    
    const listingLinks = gatherListingLinks(indexHtml, BASE_LISTINGS_URL);
    console.log(`Found ${listingLinks.length} candidate links`);
    
    const results: ScrapedListing[] = [];
    const parser = new DOMParser();
    
    const linksToProcess = listingLinks.slice(0, maxListings);
    
    for (let i = 0; i < linksToProcess.length; i++) {
      const link = linksToProcess[i];
      console.log(`Processing (${i + 1}/${linksToProcess.length}): ${link}`);
      
      const html = await fetchUrl(link);
      if (!html) {
        console.warn("Skipping (no HTML)");
        continue;
      }
      
      const doc = parser.parseFromString(html, "text/html");
      if (!doc) continue;
      
      const listingCode = extractListingCode(doc, link);
      const { price, currency, rooms } = extractPriceAndRooms(doc);
      
      let priceUsd: number | null = null;
      if (price !== null && currency) {
        if (currency.toUpperCase() === "EUR" || currency === "€") {
          priceUsd = price * eurUsd;
        } else if (currency.toUpperCase() === "USD" || currency === "$") {
          priceUsd = price;
        } else {
          priceUsd = price * eurUsd; // default to EUR
        }
      }
      
      const normalizedRooms = rooms || 1;
      
      let matchesPrice = false;
      let matchesPerRoom = false;
      
      if (priceUsd !== null) {
        matchesPrice = priceUsd >= MIN_USD && priceUsd <= MAX_USD;
        const perRoomValue = priceUsd / normalizedRooms;
        matchesPerRoom = perRoomValue >= MIN_USD && perRoomValue <= MAX_USD;
      }
      
      if (matchesPrice || matchesPerRoom) {
        results.push({
          listing_code: listingCode,
          url: link,
          price_value: price,
          currency,
          price_usd: priceUsd ? Math.round(priceUsd * 100) / 100 : null,
          rooms: normalizedRooms,
          per_room_usd: priceUsd ? Math.round((priceUsd / normalizedRooms) * 100) / 100 : null,
          matches_price: matchesPrice,
          matches_per_room: matchesPerRoom
        });
      }
      
      // Rate limiting
      if (i < linksToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
    
    console.log(`Found ${results.length} matching listings`);
    
    // Import to DB if requested
    let imported = 0;
    if (importToDb && results.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get or create Spacest agency profile
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('agency_name', 'Spacest')
        .limit(1);
      
      let agencyId = profiles?.[0]?.id;
      
      if (!agencyId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_type: 'agency',
            agency_name: 'Spacest',
            email: 'listings@spacest.com',
            phone: '+39000000000'
          })
          .select('id')
          .single();
        
        if (profileError) {
          console.error('Error creating Spacest profile:', profileError);
        } else {
          agencyId = newProfile.id;
        }
      }
      
      if (agencyId) {
        for (const result of results) {
          if (!result.listing_code) continue;
          
          const listingData = {
            agency_id: agencyId,
            external_listing_id: result.listing_code,
            external_source: 'spacest_scraper',
            title: `Property ${result.listing_code}`,
            rent_monthly_eur: result.price_value ? Math.round(result.price_value) : null,
            bedrooms: result.rooms,
            lat: 45.4642, // Milan default
            lng: 9.1900,
            city: 'Milano',
            country: 'Italy',
            status: 'DRAFT',
            review_status: 'pending'
          };
          
          const { error } = await supabase
            .from('listings')
            .upsert(listingData, {
              onConflict: 'external_listing_id,external_source',
              ignoreDuplicates: false
            });
          
          if (error) {
            console.error(`Error importing listing ${result.listing_code}:`, error);
          } else {
            imported++;
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        total_scraped: results.length,
        imported_to_db: imported,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
