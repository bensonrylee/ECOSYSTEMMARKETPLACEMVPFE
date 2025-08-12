# End-to-End Payment Test Guide

## Current Status
- ✅ Functions running with correct env vars
- ✅ Stripe webhook listening: `whsec_22ddddaa6dcbd6099fd8d6862bd02c4c4087c47ac9ad39c3f8d1feb4a2f91ccd`
- ✅ Connect account created: `acct_1RvATgAIlLjcXXIO`

## Step 1: Create Test Users in Supabase

Go to Supabase Dashboard → Authentication → Users and create:
1. Provider user (email: provider@test.com)
2. Customer user (email: customer@test.com)

Copy their UUIDs.

## Step 2: Set Up Database

Run this SQL in Supabase SQL editor:

```sql
-- Replace with your actual user UUIDs
DO $$
DECLARE
  provider_id uuid := 'YOUR_PROVIDER_UUID';
  customer_id uuid := 'YOUR_CUSTOMER_UUID';
  listing_id uuid;
  booking_id uuid;
BEGIN
  -- Create provider profile
  INSERT INTO profiles (id, role, display_name) 
  VALUES (provider_id, 'provider', 'Test Provider')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO providers (id, stripe_connect_id, charges_enabled)
  VALUES (provider_id, 'acct_1RvATgAIlLjcXXIO', true)
  ON CONFLICT (id) DO UPDATE SET 
    stripe_connect_id = 'acct_1RvATgAIlLjcXXIO',
    charges_enabled = true;
  
  -- Create customer profile
  INSERT INTO profiles (id, role, display_name) 
  VALUES (customer_id, 'customer', 'Test Customer')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create listing
  INSERT INTO listings (provider_id, title, description, kind, price_cents, pricing_unit, is_active)
  VALUES (provider_id, 'Lawn Mowing', 'Front and back yard', 'service', 5000, 'fixed', true)
  RETURNING id INTO listing_id;
  
  -- Create pending booking
  INSERT INTO bookings (listing_id, customer_id, provider_id, amount_cents, status, start_at, end_at)
  VALUES (listing_id, customer_id, provider_id, 5000, 'pending', 
          now() + interval '1 hour', now() + interval '2 hour')
  RETURNING id INTO booking_id;
  
  RAISE NOTICE 'Created booking: %', booking_id;
END $$;

-- View your test booking
SELECT * FROM bookings WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;
```

## Step 3: Test Checkout

Use the booking ID from above:

```bash
curl -s -X POST http://127.0.0.1:54321/functions/v1/checkout \
  -H "content-type: application/json" \
  -d '{
    "amount_cents": 5000,
    "currency": "cad",
    "provider_connect_id": "acct_1RvATgAIlLjcXXIO",
    "booking_id": "YOUR_BOOKING_ID",
    "success_url": "http://localhost:5173/success",
    "cancel_url": "http://localhost:5173/cancel"
  }' | jq -r '.url'
```

## Step 4: Complete Payment

1. Open the Checkout URL
2. Pay with test card: `4242 4242 4242 4242`
3. Any future expiry, any CVC, any postal code

## Step 5: Verify Success

```sql
-- Check booking was marked paid
SELECT id, status, stripe_payment_intent_id 
FROM bookings 
WHERE id = 'YOUR_BOOKING_ID';
-- Should show: status = 'paid'
```

## Quick Test Script

Save as `quick-test.sh`:

```bash
#!/bin/bash
BOOKING_ID="YOUR_BOOKING_ID"
CONNECT_ID="acct_1RvATgAIlLjcXXIO"

echo "Testing checkout for booking: $BOOKING_ID"
URL=$(curl -s -X POST http://127.0.0.1:54321/functions/v1/checkout \
  -H "content-type: application/json" \
  -d "{
    \"amount_cents\": 5000,
    \"currency\": \"cad\",
    \"provider_connect_id\": \"$CONNECT_ID\",
    \"booking_id\": \"$BOOKING_ID\",
    \"success_url\": \"http://localhost:5173/success\",
    \"cancel_url\": \"http://localhost:5173/cancel\"
  }" | jq -r '.url')

echo "Checkout URL: $URL"
echo "Pay with: 4242 4242 4242 4242"
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid booking" | Booking doesn't exist or not pending |
| Webhook not firing | Check `stripe listen` is running |
| Functions not loading env | Restart with updated .env.local |
| Connect account error | Verify account exists and is enabled |

## Success Criteria
- ✅ Checkout URL generated
- ✅ Payment completes
- ✅ Webhook fires (check stripe listen output)
- ✅ Booking marked as paid
- ✅ 10% platform fee collected (check Stripe Dashboard)

The payment spine is ready. Just need real user UUIDs and booking IDs.