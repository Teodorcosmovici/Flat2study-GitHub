import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-CAPTURE-PAYMENT] ${step}${detailsStr}`);
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

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      throw new Error("Unauthorized: Admin access required");
    }

    logStep("Admin user authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      throw new Error("Missing booking ID");
    }

    logStep("Request validated", { bookingId });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    if (booking.payment_status !== 'approved_awaiting_capture') {
      throw new Error(`Invalid booking status for capture: ${booking.payment_status}`);
    }

    if (!booking.payment_authorization_id) {
      throw new Error("No payment authorization ID found");
    }

    logStep("Booking validation successful", { 
      bookingId: booking.id, 
      paymentIntentId: booking.payment_authorization_id 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Capture the payment
    logStep("Attempting to capture payment", { paymentIntentId: booking.payment_authorization_id });
    
    const paymentIntent = await stripe.paymentIntents.capture(booking.payment_authorization_id);
    
    if (paymentIntent.status === 'succeeded') {
      // Update booking to confirmed
      const { data: updated, error: updateError } = await supabaseClient
        .from('bookings')
        .update({
          payment_status: 'captured',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      logStep("Payment captured and booking confirmed", { 
        paymentIntentId: paymentIntent.id,
        bookingId: updated.id 
      });

      return new Response(JSON.stringify({ 
        success: true,
        booking: updated,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Payment capture failed: ${paymentIntent.status}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manual-capture-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});