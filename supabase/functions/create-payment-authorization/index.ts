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

    // Create Stripe Checkout session with manual capture
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Rental Application Authorization`,
              description: `Authorization for listing ${listingId} - First month rent and service fee`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual", // This is key - payment will be authorized but not captured
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
      },
      success_url: `${origin}/checkout/${listingId}?checkin=${checkInDate}&checkout=${checkOutDate}&persons=${applicationData?.persons || 1}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${listingId}?checkin=${checkInDate}&checkout=${checkOutDate}&persons=${applicationData?.persons || 1}`,
      metadata: {
        listingId,
        landlordId,
        userId: user.id,
        checkInDate,
        checkOutDate,
        firstMonthRent: firstMonthRent.toString(),
        serviceFee: serviceFee.toString(),
        totalAmount: totalAmount.toString(),
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ 
      checkoutUrl: session.url,
      sessionId: session.id
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