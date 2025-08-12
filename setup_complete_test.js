import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

const PROVIDER_ID = '45ff8aff-d38d-485f-9a96-91c2a86f48fc';
const CUSTOMER_ID = '9c2f1d8a-c303-4ca7-9da6-3c2e65ef764b';
const CONNECT_ID = 'acct_1RvArcAbLWkD0WxT';

async function setupComplete() {
  console.log('📋 Setting up complete test scenario...\n');
  
  // Step 1: Create profiles
  console.log('1️⃣ Creating profiles...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert([
      { id: PROVIDER_ID, role: 'provider', display_name: 'Test Provider' },
      { id: CUSTOMER_ID, role: 'customer', display_name: 'Test Customer' }
    ]);
  
  if (profileError) {
    console.error('Profile error:', profileError);
    return;
  }
  console.log('   ✅ Profiles created');
  
  // Step 2: Create provider record
  console.log('\n2️⃣ Setting up provider with Connect ID...');
  const { error: providerError } = await supabase
    .from('providers')
    .upsert({ 
      id: PROVIDER_ID,
      stripe_connect_id: CONNECT_ID,
      charges_enabled: true 
    });
  
  if (providerError) {
    console.error('Provider error:', providerError);
    return;
  }
  console.log('   ✅ Provider linked to Stripe Connect');
  
  // Step 3: Create listing
  console.log('\n3️⃣ Creating listing...');
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert({
      provider_id: PROVIDER_ID,
      title: 'Lawn Mowing Service',
      description: 'Professional lawn care for front and back yard',
      kind: 'service',
      price_cents: 5000,
      pricing_unit: 'fixed',
      is_active: true
    })
    .select()
    .single();
  
  if (listingError) {
    console.error('Listing error:', listingError);
    return;
  }
  console.log('   ✅ Listing created:', listing.id);
  
  // Step 4: Create slots
  console.log('\n4️⃣ Creating available slots...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const start = new Date(tomorrow);
    start.setHours(9 + i * 2, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    slots.push({
      listing_id: listing.id,
      start_at: start.toISOString(),
      end_at: end.toISOString()
    });
  }
  
  await supabase.from('listing_slots').insert(slots);
  console.log('   ✅ Created 3 slots for tomorrow');
  
  // Step 5: Create booking
  console.log('\n5️⃣ Creating pending booking...');
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      listing_id: listing.id,
      customer_id: CUSTOMER_ID,
      provider_id: PROVIDER_ID,
      start_at: slots[0].start_at,
      end_at: slots[0].end_at,
      amount_cents: 5000,
      status: 'pending'
    })
    .select()
    .single();
  
  if (bookingError) {
    console.error('Booking error:', bookingError);
    return;
  }
  console.log('   ✅ Booking created:', booking.id);
  
  // Generate test commands
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST CHECKOUT SESSION\n');
  console.log('Run this command to create a Stripe Checkout session:\n');
  
  const checkoutCmd = `curl -s -X POST https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \\
  -H "content-type: application/json" \\
  -d '{
    "amount_cents": 5000,
    "currency": "cad",
    "provider_connect_id": "${CONNECT_ID}",
    "booking_id": "${booking.id}",
    "success_url": "http://localhost:5173/success",
    "cancel_url": "http://localhost:5173/cancel"
  }' | jq -r '.url'`;
  
  console.log(checkoutCmd);
  
  console.log('\n💳 Test card: 4242 4242 4242 4242');
  console.log('   Any future expiry, any CVC, any postal code\n');
  console.log('='.repeat(60));
  
  // Save test booking ID
  console.log('\n📝 Quick verification after payment:');
  console.log(`Booking ID: ${booking.id}`);
  console.log('\nTo check payment status:');
  console.log(`curl -s https://ftozjjjrhifbblpslixk.supabase.co/rest/v1/bookings?id=eq.${booking.id} \\
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" | jq`);
  
  return { listing, booking };
}

setupComplete();