import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT-AUTHORIZATION] ${step}${detailsStr}`);
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
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      throw new Error("Missing payment intent ID");
    }

    logStep("Verifying payment intent", { paymentIntentId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    logStep("Payment intent retrieved", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    });

    if (paymentIntent.status !== 'requires_capture') {
      logStep("Payment not in requires_capture state", { status: paymentIntent.status });
      
      // Update booking status based on payment intent status
      let newPaymentStatus, newBookingStatus;
      
      switch (paymentIntent.status) {
        case 'succeeded':
          newPaymentStatus = 'captured';
          newBookingStatus = 'confirmed';
          break;
        case 'canceled':
          newPaymentStatus = 'cancelled';
          newBookingStatus = 'cancelled';
          break;
        case 'requires_payment_method':
        case 'requires_confirmation':
          newPaymentStatus = 'failed';
          newBookingStatus = 'cancelled';
          break;
        default:
          newPaymentStatus = 'pending';
          newBookingStatus = 'pending_payment';
      }

      // Update the booking record
      const { data: updatedBooking, error: updateError } = await supabaseClient
        .from('bookings')
        .update({
          payment_status: newPaymentStatus,
          status: newBookingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('payment_authorization_id', paymentIntentId)
        .select()
        .single();

      if (updateError) {
        logStep("Error updating booking", { error: updateError });
      } else {
        logStep("Booking updated", { bookingId: updatedBooking?.id, newStatus: newBookingStatus });
      }

      return new Response(JSON.stringify({ 
        success: true,
        paymentStatus: paymentIntent.status,
        bookingStatus: newBookingStatus,
        requiresAction: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Payment is authorized and waiting for capture
    // Update booking to authorized status
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .update({
        payment_status: 'authorized',
        status: 'pending_landlord_response',
        updated_at: new Date().toISOString()
      })
      .eq('payment_authorization_id', paymentIntentId)
      .select()
      .single();

    if (bookingError) {
      logStep("Booking update error", { error: bookingError });
      throw new Error(`Failed to update booking: ${bookingError.message}`);
    }

    logStep("Payment authorized successfully", { bookingId: booking.id });

    return new Response(JSON.stringify({ 
      success: true,
      booking,
      paymentStatus: 'authorized',
      requiresLandlordResponse: true,
      landlordResponseDeadline: booking.landlord_response_due_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment-authorization", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});