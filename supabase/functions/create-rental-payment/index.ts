import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RENTAL-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
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
      throw new Error("Missing required payment parameters");
    }

    logStep("Payment parameters received", { 
      listingId, 
      landlordId, 
      firstMonthRent, 
      serviceFee, 
      totalAmount 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Create line items for the payment
    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Rental Application - First Month + Service Fee`,
            description: `First month rent (€${firstMonthRent}) + Service fee (€${serviceFee})`,
          },
          unit_amount: totalAmount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ];

    logStep("Creating Stripe checkout session", { totalAmount, lineItems });

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/checkout/${listingId}?checkin=${checkInDate}&checkout=${checkOutDate}&persons=1&step=3&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout/${listingId}?checkin=${checkInDate}&checkout=${checkOutDate}&persons=1&step=2`,
      metadata: {
        listingId,
        landlordId,
        userId: user.id,
        checkInDate,
        checkOutDate,
        firstMonthRent: firstMonthRent.toString(),
        serviceFee: serviceFee.toString(),
        applicationData: JSON.stringify(applicationData),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-rental-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});