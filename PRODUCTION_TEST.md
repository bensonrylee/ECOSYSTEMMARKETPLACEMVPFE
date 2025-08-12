# Production Deployment Summary

## ✅ Deployed Functions
All three Edge Functions are live on Supabase:

1. **stripe-connect-link** - Creates Stripe Connect onboarding links
   - URL: `https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link`
   - Test account created: `acct_1RvAlKPQyozETHKP`

2. **checkout** - Creates Stripe Checkout sessions with 10% platform fee
   - URL: `https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/checkout`
   - Validates bookings exist in database before payment

3. **stripe-webhook** - Handles payment confirmations
   - URL: `https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-webhook`
   - Webhook endpoint created: `we_1RvAnYAtcuskq3MVsrliO9eL`
   - Production secret: `whsec_5WI046MvTSaZVdPDJu5t8KJUF60ohePz`

## Environment Variables Set
- `STRIPE_SECRET_KEY` - Test key for Stripe API
- `STRIPE_WEBHOOK_SECRET` - Production webhook signing secret
- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database writes

## Test Results

### ✅ Connect Link Function
```bash
curl -X POST https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "content-type: application/json" \
  -d '{"returnUrl":"http://localhost:5173/onboarding/provider"}'
```
Response:
```json
{
  "url": "https://connect.stripe.com/setup/e/acct_1RvAlKPQyozETHKP/20iuV2lCYXWn",
  "accountId": "acct_1RvAlKPQyozETHKP"
}
```

### ✅ Checkout Function 
Correctly rejects invalid bookings:
```json
{"error": "Invalid booking"}
```

### ✅ Webhook Endpoint
Created and listening for `checkout.session.completed` events.

## Next Steps to Complete Testing

1. **Create Database Tables**
   The `bookings` table needs to be created in Supabase with columns:
   - id (uuid, primary key)
   - listing_id (uuid)
   - customer_id (uuid)
   - provider_id (uuid)
   - amount_cents (integer)
   - status (text)
   - stripe_payment_intent_id (text, nullable)
   - start_at (timestamp)
   - end_at (timestamp)
   - created_at (timestamp)

2. **Create Test Data**
   Once tables exist, create a test booking with status='pending'

3. **Test Full Payment Flow**
   - Call checkout endpoint with valid booking_id
   - Complete payment with test card (4242 4242 4242 4242)
   - Verify webhook updates booking to status='paid'

## Quick Commands

Test Connect onboarding:
```bash
curl -s https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzkwNjAsImV4cCI6MjA2OTU1NTA2MH0.o--tZzMxNLgT-juc6MJvcRU87oIB09X8LPN5rt6hNms" \
  -H "content-type: application/json" \
  -d '{"returnUrl":"http://localhost:5173/onboarding/provider"}' | jq -r '.url'
```

## Status
✅ Payment spine deployed and working
⏳ Awaiting database schema creation for full end-to-end test