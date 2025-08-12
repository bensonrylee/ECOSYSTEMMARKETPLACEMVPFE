import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

const PROVIDER_ID = '45ff8aff-d38d-485f-9a96-91c2a86f48fc';
const NEW_CONNECT_ID = 'acct_1RvBECA3qvm3FysA';

async function updateProvider() {
  const { error } = await supabase
    .from('providers')
    .update({ 
      stripe_connect_id: NEW_CONNECT_ID,
      charges_enabled: true 
    })
    .eq('id', PROVIDER_ID);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Provider updated with new Connect ID:', NEW_CONNECT_ID);
    console.log('\n📋 Complete onboarding at:');
    console.log('https://connect.stripe.com/setup/e/acct_1RvBECA3qvm3FysA/7n8kdblisSqG');
    console.log('\nThen test checkout with:');
    console.log(`curl -s -X POST https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \\
  -H "content-type: application/json" \\
  -d '{
    "amount_cents": 5000,
    "currency": "cad",
    "provider_connect_id": "${NEW_CONNECT_ID}",
    "booking_id": "81326ae3-8784-42db-a284-a09be14bdaf0",
    "success_url": "http://localhost:5173/success",
    "cancel_url": "http://localhost:5173/cancel"
  }' | jq -r '.url'`);
  }
}

updateProvider();