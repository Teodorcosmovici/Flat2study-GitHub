import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CAPTURE-PAYMENT] ${step}${detailsStr}`);
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

    // Authenticate user (landlord)
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { bookingId, landlordResponse } = body; // 'approved' or 'declined'

    if (!bookingId || !landlordResponse) {
      throw new Error("Missing required fields");
    }

    if (!['approved', 'declined'].includes(landlordResponse)) {
      throw new Error("Invalid landlord response");
    }

    logStep("Request validated", { bookingId, landlordResponse });

    // Get booking details and verify landlord ownership
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Verify the current user is the landlord for this booking
    const { data: landlordProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', booking.landlord_id)
      .eq('user_id', user.id)
      .single();

    if (!landlordProfile) {
      throw new Error("Unauthorized: You are not the landlord for this booking");
    }

    logStep("Landlord verification successful", { landlordId: landlordProfile.id });

    // Check if booking is still in valid state for response
    if (booking.landlord_response) {
      throw new Error("Landlord has already responded to this booking");
    }

    if (new Date() > new Date(booking.landlord_response_due_at)) {
      throw new Error("Response deadline has passed");
    }

    if (booking.payment_status !== 'authorized') {
      throw new Error("Payment is not in authorized state");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let updatedBooking;

    if (landlordResponse === 'approved') {
      // Approve the booking but don't capture payment yet - manual capture required
      logStep("Approving booking without capturing payment", { paymentIntentId: booking.payment_authorization_id });
      
      // Update booking to approved (awaiting manual payment capture)
      const { data: updated, error: updateError } = await supabaseClient
        .from('bookings')
        .update({
          landlord_response: 'approved',
          payment_status: 'approved_awaiting_capture', // New status for manual capture
          status: 'approved_awaiting_payment',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      updatedBooking = updated;
      logStep("Booking approved, awaiting manual payment capture", { 
        bookingId: updatedBooking.id,
        paymentIntentId: booking.payment_authorization_id 
      });
    } else {
      // Declined - cancel the payment intent
      logStep("Declining booking and cancelling payment", { paymentIntentId: booking.payment_authorization_id });
      
      await stripe.paymentIntents.cancel(booking.payment_authorization_id);
      
      // Update booking to declined
      const { data: updated, error: updateError } = await supabaseClient
        .from('bookings')
        .update({
          landlord_response: 'declined',
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update booking: ${updateError.message}`);
      }

      updatedBooking = updated;
      logStep("Payment cancelled and booking declined");
    }

    return new Response(JSON.stringify({ 
      success: true,
      booking: updatedBooking,
      landlordResponse
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in capture-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});