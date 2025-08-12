import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

async function seedTestData() {
  console.log('🚀 Creating test users...');
  
  // Create provider user
  const { data: providerAuth, error: providerError } = await supabase.auth.admin.createUser({
    email: 'provider@test.com',
    password: 'Test123456!',
    email_confirm: true
  });
  
  if (providerError) {
    console.error('Provider creation error:', providerError);
    return;
  }
  
  // Create customer user  
  const { data: customerAuth, error: customerError } = await supabase.auth.admin.createUser({
    email: 'customer@test.com',
    password: 'Test123456!',
    email_confirm: true
  });
  
  if (customerError) {
    console.error('Customer creation error:', customerError);
    return;
  }
  
  const providerId = providerAuth.user.id;
  const customerId = customerAuth.user.id;
  
  console.log('✅ Created users:');
  console.log('   Provider:', providerId);
  console.log('   Customer:', customerId);
  
  // Create profiles
  await supabase.from('profiles').upsert([
    { id: providerId, role: 'provider', display_name: 'Test Provider' },
    { id: customerId, role: 'customer', display_name: 'Test Customer' }
  ]);
  
  // Create provider record (will add stripe_connect_id after onboarding)
  await supabase.from('providers').upsert({
    id: providerId,
    charges_enabled: false
  });
  
  console.log('\n📋 Next steps:');
  console.log('1. Get Connect onboarding link:');
  console.log(`   curl -s https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link \\`);
  console.log(`     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \\`);
  console.log(`     -H "content-type: application/json" \\`);
  console.log(`     -d '{"returnUrl":"http://localhost:5173/onboarding/complete"}' | jq -r '.url'`);
  console.log('\n2. Complete onboarding in browser');
  console.log('3. Update provider with Connect ID');
  console.log('\nProvider ID for reference:', providerId);
  console.log('Customer ID for reference:', customerId);
  
  return { providerId, customerId };
}

seedTestData();