// Payment System Test Script
// Run with: node test-payments.js

const SUPABASE_URL = 'https://ftozjjjrhifbblpslixk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms';

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

async function testConnectLink() {
  console.log('\n🔗 Testing Stripe Connect Link Creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/stripe-connect-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:5173/onboarding/provider'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.url && data.accountId) {
      console.log('✅ Connect link created successfully');
      console.log(`   Account ID: ${data.accountId}`);
      console.log(`   Onboarding URL: ${data.url.substring(0, 50)}...`);
      return data.accountId;
    } else {
      console.log('❌ Failed to create Connect link:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error calling Connect link function:', error.message);
    return null;
  }
}

async function testCheckout(accountId) {
  console.log('\n💳 Testing Checkout Session Creation...');
  
  // Create a test booking ID (you should create a real one in Supabase)
  const testBookingId = crypto.randomUUID();
  
  console.log(`   Using test booking ID: ${testBookingId}`);
  console.log(`   Using Connect account: ${accountId || 'acct_test'}`);
  
  try {
    const response = await fetch(`${BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        amount_cents: 5000,
        currency: 'cad',
        provider_connect_id: accountId || 'acct_1PTest', // Use real account or test
        booking_id: testBookingId,
        success_url: 'http://localhost:5173/success',
        cancel_url: 'http://localhost:5173/cancel'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.url) {
      console.log('✅ Checkout session created successfully');
      console.log(`   Checkout URL: ${data.url.substring(0, 50)}...`);
    } else {
      console.log('❌ Failed to create checkout session:', data);
    }
  } catch (error) {
    console.log('❌ Error calling checkout function:', error.message);
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS Headers...');
  
  try {
    const response = await fetch(`${BASE_URL}/checkout`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log('✅ CORS headers present:', corsHeader);
    } else {
      console.log('⚠️  CORS headers might not be set');
    }
  } catch (error) {
    console.log('❌ Error testing CORS:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Payment System Verification Tests');
  console.log('====================================');
  
  // Test CORS
  await testCORS();
  
  // Test Connect Link
  const accountId = await testConnectLink();
  
  // Test Checkout
  await testCheckout(accountId);
  
  console.log('\n====================================');
  console.log('📋 Next Steps:');
  console.log('1. If functions are not deployed, run:');
  console.log('   supabase functions deploy stripe-connect-link --no-verify-jwt');
  console.log('   supabase functions deploy checkout --no-verify-jwt');
  console.log('   supabase functions deploy stripe-webhook --no-verify-jwt');
  console.log('');
  console.log('2. Enable Stripe Connect at:');
  console.log('   https://dashboard.stripe.com/test/settings/connect');
  console.log('');
  console.log('3. For local testing with Docker:');
  console.log('   - Install Docker Desktop');
  console.log('   - Run: supabase functions serve --env-file .env.local --no-verify-jwt');
  console.log('   - Run: stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook');
  console.log('');
}

// Run the tests
runTests();