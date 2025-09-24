import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-AUTHORIZATION] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { 
      listingId, 
      landlordId, 
      checkInDate, 
      checkOutDate, 
      firstMonthRent, 
      serviceFee, 
      totalAmount, 
      applicationData 
    } = body;

    if (!listingId || !landlordId || !checkInDate || !checkOutDate || !totalAmount) {
      throw new Error("Missing required fields");
    }

    logStep("Request data validated", { listingId, landlordId, totalAmount });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: applicationData?.name || user.user_metadata?.full_name || "",
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Create payment intent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "eur",
      customer: customerId,
      capture_method: "manual", // This is key - payment will be authorized but not captured
      payment_method_types: ["card"],
      metadata: {
        listingId,
        landlordId,
        userId: user.id,
        checkInDate,
        checkOutDate,
        firstMonthRent: firstMonthRent.toString(),
        serviceFee: serviceFee.toString(),
        type: "rental_authorization"
      },
      description: `Rental authorization for listing ${listingId}`,
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id });

    // Create booking record with authorization tracking
    const landlordResponseDeadline = new Date();
    landlordResponseDeadline.setHours(landlordResponseDeadline.getHours() + 24);

    const bookingData = {
      listing_id: listingId,
      tenant_id: user.id,
      landlord_id: landlordId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      monthly_rent: firstMonthRent,
      security_deposit: serviceFee, // Using service fee as deposit
      total_amount: totalAmount,
      payment_authorization_id: paymentIntent.id,
      payment_status: 'pending',
      authorization_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now (Stripe default)
      landlord_response_due_at: landlordResponseDeadline,
      status: 'pending_payment'
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
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      paymentIntentId: paymentIntent.id,
      landlordResponseDeadline: landlordResponseDeadline.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-authorization", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});