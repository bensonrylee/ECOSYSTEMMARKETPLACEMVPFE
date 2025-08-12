// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

// Use APP_URL for CORS in production, * for local dev
const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
const isDev = appUrl.includes("localhost");

const corsHeaders = {
  "Access-Control-Allow-Origin": isDev ? "*" : appUrl,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json();
    
    if (!accountId) {
      return new Response(JSON.stringify({ error: "Account ID required" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(accountId);
    
    // Extract capability status
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.details_submitted || false;
    
    // Get auth context from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Create Supabase client with user context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { 
        auth: { persistSession: false },
        global: { headers: { authorization: authHeader } }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Update provider record
    const { error: updateError } = await supabase
      .from('providers')
      .update({ 
        stripe_connect_id: accountId,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted
    }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }
});