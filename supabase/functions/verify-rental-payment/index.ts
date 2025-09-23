import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-RENTAL-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client using the service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    logStep("Verifying session", { sessionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      status: session.status 
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    if (!metadata) {
      throw new Error("No metadata found in session");
    }

    // Create booking record
    const bookingData = {
      listing_id: metadata.listingId,
      tenant_id: metadata.userId,
      landlord_id: metadata.landlordId,
      check_in_date: metadata.checkInDate,
      check_out_date: metadata.checkOutDate,
      monthly_rent: parseInt(metadata.firstMonthRent),
      security_deposit: 0, // No security deposit in this flow
      total_amount: session.amount_total! / 100, // Convert from cents
      stripe_payment_intent_id: session.payment_intent as string,
      status: 'confirmed' // Since payment is complete
    };

    logStep("Creating booking", bookingData);

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      logStep("Booking creation error", { error: bookingError });
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    logStep("Booking created successfully", { bookingId: booking.id });

    return new Response(JSON.stringify({ 
      success: true, 
      booking,
      sessionId: session.id,
      paymentIntentId: session.payment_intent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-rental-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});