import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

async function createTestBooking() {
  const testBookingId = '11111111-1111-1111-1111-111111111111';
  
  // First check if table exists and create test booking
  const { data, error } = await supabase
    .from('bookings')
    .upsert({
      id: testBookingId,
      listing_id: '11111111-1111-1111-1111-111111111111',
      customer_id: '11111111-1111-1111-1111-111111111111',
      provider_id: '11111111-1111-1111-1111-111111111111',
      amount_cents: 5000,
      status: 'pending',
      start_at: new Date(Date.now() + 3600000).toISOString(),
      end_at: new Date(Date.now() + 7200000).toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return;
  }

  console.log('Created test booking:', data);
  console.log('\nNow test checkout with:');
  console.log(`curl -s -X POST https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \\
  -H "content-type: application/json" \\
  -d '{
    "amount_cents": 5000,
    "currency": "cad",
    "provider_connect_id": "acct_1RvAlKPQyozETHKP",
    "booking_id": "${testBookingId}",
    "success_url": "http://localhost:5173/success",
    "cancel_url": "http://localhost:5173/cancel"
  }'`);
}

createTestBooking();