// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";

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
    const { returnUrl, accountId } = await req.json();
    
    // Reuse existing account if provided, otherwise create new
    const acct = accountId
      ? await stripe.accounts.retrieve(accountId)
      : await stripe.accounts.create({ type: "express" });

    const link = await stripe.accountLinks.create({
      account: acct.id,
      refresh_url: `${returnUrl}?refresh=1`,
      return_url: `${returnUrl}?done=1&acct=${acct.id}`,
      type: "account_onboarding",
    });
    
    return new Response(JSON.stringify({ url: link.url, accountId: acct.id }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }
});