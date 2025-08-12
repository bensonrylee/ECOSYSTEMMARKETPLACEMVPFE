// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { provider_connect_id, success_url, cancel_url, booking_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 2.1 Verify booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id,status,amount_cents,currency,provider_id,listing_id")
      .eq("id", booking_id)
      .single();

    if (error || !booking || booking.status !== "pending") {
      return new Response(JSON.stringify({ error: "Invalid booking" }), { status: 400, headers: corsHeaders });
    }

    // 2.2 Ensure provider account matches destination and can charge
    const { data: providerRow, error: provErr } = await supabase
      .from("providers")
      .select("stripe_connect_id, charges_enabled")
      .eq("id", booking.provider_id)
      .single();

    if (provErr || !providerRow?.stripe_connect_id) {
      return new Response(JSON.stringify({ error: "Provider not connected to Stripe" }), { status: 400, headers: corsHeaders });
    }
    if (!providerRow.charges_enabled) {
      return new Response(JSON.stringify({ error: "Provider not ready to accept payments" }), { status: 400, headers: corsHeaders });
    }
    if (providerRow.stripe_connect_id !== provider_connect_id) {
      return new Response(JSON.stringify({ error: "Destination mismatch" }), { status: 400, headers: corsHeaders });
    }

    // 2.3 Create session with idempotency keyed to booking_id
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      client_reference_id: booking.id,
      line_items: [{
        price_data: {
          currency: booking.currency || "cad",
          product_data: { name: "Booking" },
          unit_amount: booking.amount_cents
        },
        quantity: 1
      }],
      payment_intent_data: {
        application_fee_amount: Math.floor(booking.amount_cents * 0.10),
        transfer_data: { destination: provider_connect_id }
      },
      success_url,
      cancel_url
    };

    const session = await stripe.checkout.sessions.create(
      params,
      { idempotencyKey: booking.id } // retriable client calls won't double-create
    );

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 400,
      headers: corsHeaders 
    });
  }
});