// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false }
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
  }

  // 3.1 Record event (idempotent)
  const insert = await supabase
    .from("stripe_events")
    .insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> })
    .select("id");
  if (insert.error) {
    // conflict means we already processed this event; safe to return 200
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "content-type": "application/json", ...corsHeaders }
    });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const bookingId = s.client_reference_id;
    if (bookingId) {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "paid", stripe_payment_intent_id: s.payment_intent as string })
        .eq("id", bookingId);
      if (error) console.error("Failed to update booking:", error);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json", ...corsHeaders }
  });
});