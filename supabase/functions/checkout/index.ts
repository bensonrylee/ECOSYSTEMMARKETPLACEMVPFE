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
    const { amount_cents, currency, provider_connect_id, success_url, cancel_url, booking_id } = await req.json();

    // Verify booking exists and is pending
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, status, amount_cents, provider_id")
      .eq("id", booking_id)
      .single();
    
    if (error || !booking || booking.status !== "pending") {
      return new Response(JSON.stringify({ error: "Invalid booking" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Use verified amount from database, not client payload
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: booking_id, // lets webhook find the booking
      line_items: [{
        price_data: {
          currency: currency || "cad", // Default to CAD
          product_data: { name: "Booking" },
          unit_amount: booking.amount_cents // Use DB amount
        },
        quantity: 1
      }],
      payment_intent_data: {
        application_fee_amount: Math.floor(booking.amount_cents * 0.10),
        transfer_data: { destination: provider_connect_id }
      },
      success_url,
      cancel_url
    });

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