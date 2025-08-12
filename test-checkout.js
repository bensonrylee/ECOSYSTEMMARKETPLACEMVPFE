// Quick test for checkout flow
const testCheckout = async () => {
  console.log('🧪 Testing checkout flow...\n');
  
  // Test booking ID
  const bookingId = crypto.randomUUID();
  const connectAccountId = 'acct_1RvATgAIlLjcXXIO'; // From our test above
  
  console.log(`📦 Test Booking ID: ${bookingId}`);
  console.log(`🔗 Connect Account: ${connectAccountId}`);
  
  const payload = {
    amount_cents: 5000,
    currency: 'cad',
    provider_connect_id: connectAccountId,
    booking_id: bookingId,
    success_url: 'http://localhost:5173/success',
    cancel_url: 'http://localhost:5173/cancel'
  };
  
  console.log('\n📤 Calling checkout function...');
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.url) {
      console.log('✅ Checkout session created!');
      console.log(`\n🌐 Checkout URL:\n${data.url}\n`);
      console.log('💳 Test with card: 4242 4242 4242 4242');
      console.log('📅 Any future expiry, any CVC, any postal code\n');
    } else {
      console.log('❌ Checkout failed:', data);
      if (data.error && data.error.includes('Invalid booking')) {
        console.log('\n⚠️  The booking ID must exist in the database.');
        console.log('Run this SQL in Supabase to create a test booking:\n');
        console.log(`INSERT INTO bookings (
  id,
  listing_id, 
  customer_id, 
  provider_id, 
  amount_cents, 
  status
) VALUES (
  '${bookingId}'::uuid,
  gen_random_uuid(),
  gen_random_uuid(), 
  gen_random_uuid(),
  5000,
  'pending'
);`);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

testCheckout();