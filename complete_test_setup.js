import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

const PROVIDER_ID = '45ff8aff-d38d-485f-9a96-91c2a86f48fc';
const CUSTOMER_ID = '9c2f1d8a-c303-4ca7-9da6-3c2e65ef764b';
const CONNECT_ID = 'acct_1RvArcAbLWkD0WxT';

async function completeTestSetup() {
  console.log('🔄 Setting up provider with Connect ID...');
  
  // Upsert provider with Connect account
  const { data: providerData, error: providerError } = await supabase
    .from('providers')
    .upsert({ 
      id: PROVIDER_ID,
      stripe_connect_id: CONNECT_ID,
      charges_enabled: true 
    })
    .select();
  
  if (providerError) {
    console.error('Provider error:', providerError.message || providerError);
    console.error('Details:', providerError.details || 'No details');
    console.error('Hint:', providerError.hint || 'No hint');
    return;
  }
  
  console.log('✅ Provider updated with Connect ID');
  
  // Create a listing
  console.log('\n📝 Creating listing...');
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
    console.error('Error creating listing:', JSON.stringify(listingError, null, 2));
    return;
  }
  
  console.log('✅ Created listing:', listing.id);
  
  // Create slots for the listing
  console.log('\n⏰ Creating available slots...');
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
  console.log('✅ Created 3 slots for tomorrow');
  
  // Create a pending booking
  console.log('\n📅 Creating pending booking...');
  const { data: booking } = await supabase
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
  
  console.log('✅ Created booking:', booking.id);
  
  // Generate checkout command
  console.log('\n💳 TEST CHECKOUT:');
  console.log('Run this command to create a Checkout session:\n');
  console.log(`curl -s -X POST https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout \\`);
  console.log(`  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \\`);
  console.log(`  -H "content-type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "amount_cents": 5000,`);
  console.log(`    "currency": "cad",`);
  console.log(`    "provider_connect_id": "${CONNECT_ID}",`);
  console.log(`    "booking_id": "${booking.id}",`);
  console.log(`    "success_url": "http://localhost:5173/success",`);
  console.log(`    "cancel_url": "http://localhost:5173/cancel"`);
  console.log(`  }' | jq -r '.url'`);
  
  console.log('\n🎯 Test with card: 4242 4242 4242 4242');
  console.log('   Any future expiry, any CVC, any postal code');
  
  console.log('\n📊 VERIFY PAYMENT:');
  console.log(`After payment, check booking status:`);
  console.log(`node -e "import('@supabase/supabase-js').then(({createClient}) => {`);
  console.log(`  const s = createClient('https://ftozjjjrhifbblpslixk.supabase.co',`);
  console.log(`    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw');`);
  console.log(`  s.from('bookings').select('id,status,stripe_payment_intent_id')`);
  console.log(`    .eq('id','${booking.id}').single()`);
  console.log(`    .then(({data}) => console.log('Booking status:', data.status));`);
  console.log(`})"`);
  
  return { listing, booking };
}

completeTestSetup();