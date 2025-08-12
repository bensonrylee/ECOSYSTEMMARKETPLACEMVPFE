import { supabase } from './supabase';

// Base URL for functions (works in both dev and prod)
const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Get auth headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "content-type": "application/json",
    "Authorization": session?.access_token 
      ? `Bearer ${session.access_token}`
      : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

// Connect Stripe for provider onboarding
export async function connectStripe(existingAccountId?: string) {
  // Check if provider already has a Connect account
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: provider } = await supabase
      .from('providers')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single();
    
    if (provider?.stripe_connect_id) {
      existingAccountId = provider.stripe_connect_id;
    }
  }

  const headers = await getAuthHeaders();
  const res = await fetch(`${FN_BASE}/stripe-connect-link`, {
    method: "POST",
    headers,
    body: JSON.stringify({ 
      returnUrl: `${window.location.origin}/onboarding/provider`,
      accountId: existingAccountId // Reuse existing account if available
    })
  });
  
  if (!res.ok) {
    throw new Error('Failed to create Stripe Connect link');
  }
  
  const { url, accountId } = await res.json();
  
  // Store pending account ID for later
  localStorage.setItem("acct_pending", accountId);
  
  // Redirect to Stripe onboarding
  window.location.href = url;
}

// Handle provider return from Stripe onboarding
export async function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const done = params.get('done');
  const acct = params.get('acct');
  
  if (done === '1' && acct) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Update provider with Stripe Connect ID
    const { error } = await supabase
      .from('providers')
      .upsert({
        id: user.id,
        stripe_connect_id: acct,
        charges_enabled: true
      });
    
    if (error) throw error;
    
    // Clear pending account
    localStorage.removeItem('acct_pending');
    
    return acct;
  }
  
  return null;
}

// Start checkout for a booking
export async function startCheckout(
  bookingId: string, 
  amountCents: number, 
  providerConnectId: string,
  listingId: string
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${FN_BASE}/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount_cents: amountCents,
      currency: "cad", // Canadian dollars
      provider_connect_id: providerConnectId,
      booking_id: bookingId,
      success_url: `${window.location.origin}/bookings/${bookingId}/success`,
      cancel_url: `${window.location.origin}/listing/${listingId}`
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }
  
  const { url } = await res.json();
  
  // Redirect to Stripe Checkout
  window.location.href = url;
}

// Create a booking and start checkout
export async function bookListing(
  listingId: string,
  providerId: string,
  providerConnectId: string,
  startAt: Date,
  endAt: Date,
  amountCents: number
) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Create pending booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: listingId,
      customer_id: user.id,
      provider_id: providerId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      amount_cents: amountCents,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Start checkout
  await startCheckout(booking.id, amountCents, providerConnectId, listingId);
}

// Check if provider has completed onboarding
export async function checkProviderStatus(providerId: string) {
  const { data: provider } = await supabase
    .from('providers')
    .select('stripe_connect_id, charges_enabled')
    .eq('id', providerId)
    .single();
  
  return {
    hasConnectAccount: !!provider?.stripe_connect_id,
    canAcceptCharges: provider?.charges_enabled || false,
    connectId: provider?.stripe_connect_id
  };
}