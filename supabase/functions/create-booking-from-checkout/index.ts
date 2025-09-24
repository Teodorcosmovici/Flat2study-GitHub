import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-FROM-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client
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

    logStep("Request validated", { sessionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get checkout session details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      paymentIntentId: session.payment_intent?.id 
    });

    // Check if payment was authorized (for manual capture, payment_status is 'unpaid' but payment_intent is 'requires_capture')
    if (session.payment_status !== 'unpaid') {
      throw new Error(`Payment not authorized. Status: ${session.payment_status}`);
    }

    const paymentIntent = session.payment_intent as any;
    if (!paymentIntent || paymentIntent.status !== 'requires_capture') {
      throw new Error(`Payment intent not authorized. Status: ${paymentIntent?.status}`);
    }

    // Extract metadata
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error("No metadata found in session");
    }

    const {
      listingId,
      landlordId,
      userId,
      checkInDate,
      checkOutDate,
      firstMonthRent,
      serviceFee,
      totalAmount
    } = metadata;

    logStep("Metadata extracted", metadata);

    // Create booking record with payment authorization
    const landlordResponseDeadline = new Date();
    landlordResponseDeadline.setHours(landlordResponseDeadline.getHours() + 24);

    const bookingData = {
      listing_id: listingId,
      tenant_id: userId,
      landlord_id: landlordId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      monthly_rent: parseInt(firstMonthRent),
      security_deposit: parseInt(serviceFee),
      total_amount: parseInt(totalAmount),
      payment_authorization_id: paymentIntent.id,
      payment_status: 'authorized',
      authorization_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      landlord_response_due_at: landlordResponseDeadline,
      status: 'pending_landlord_response'
    };

    logStep("Creating booking record", bookingData);

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
      paymentIntentId: paymentIntent.id,
      landlordResponseDeadline: landlordResponseDeadline.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-booking-from-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});