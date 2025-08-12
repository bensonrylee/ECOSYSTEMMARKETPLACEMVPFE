# Payment System Verification Guide

## ✅ What's Complete

1. **Edge Functions Ready**
   - `stripe-connect-link` - Creates onboarding links, reuses existing accounts
   - `checkout` - Creates sessions with 10% fee, validates bookings from DB
   - `stripe-webhook` - Marks bookings paid

2. **Frontend Integration**
   - Dynamic Supabase URL (works dev/prod)
   - Auth headers on all requests
   - CAD currency default
   - Provider status checking

3. **Security Features**
   - CORS headers on all functions
   - Booking validation in checkout
   - Service role key only in functions
   - No duplicate Connect accounts

## 🚀 Quick Start Commands

### Step 1: Install Docker Desktop (Required for local testing)
Download from: https://www.docker.com/products/docker-desktop/

### Step 2: Start Services

```bash
# Terminal 1: Functions server
supabase functions serve --env-file .env.local --no-verify-jwt

# Terminal 2: Stripe webhook listener
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
# Copy the whsec_... and update STRIPE_WEBHOOK_SECRET in .env.local
# Restart Terminal 1

# Terminal 3: Your app
npm run dev
```

## 📝 Quick Tests

### Test A: CORS Check
```bash
curl -i -X OPTIONS http://localhost:54321/functions/v1/checkout
# Should see: Access-Control-Allow-Origin: *
```

### Test B: Create Connect Link
```bash
curl -s -X POST http://localhost:54321/functions/v1/stripe-connect-link \
  -H "content-type: application/json" \
  -d '{"returnUrl":"http://localhost:5173/onboarding/provider"}'
# Returns: {"url":"...","accountId":"acct_..."}
```

### Test C: Create Test Booking & Checkout

1. First, create a test booking in Supabase SQL editor:
```sql
INSERT INTO bookings (
  listing_id, 
  customer_id, 
  provider_id, 
  amount_cents, 
  status
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(), 
  gen_random_uuid(),
  5000,
  'pending'
) RETURNING id;
-- Copy the returned ID
```

2. Test checkout with the booking ID:
```bash
curl -s -X POST http://localhost:54321/functions/v1/checkout \
  -H "content-type: application/json" \
  -d '{
    "amount_cents":5000,
    "currency":"cad",
    "provider_connect_id":"acct_XXX",
    "booking_id":"YOUR_BOOKING_ID",
    "success_url":"http://localhost:5173/success",
    "cancel_url":"http://localhost:5173/cancel"
  }'
# Returns: {"url":"https://checkout.stripe.com/..."}
```

3. Open the URL and pay with test card: `4242 4242 4242 4242`

### Test D: Verify Webhook Updates Booking
```sql
-- Check in Supabase after payment
SELECT id, status, stripe_payment_intent_id 
FROM bookings 
WHERE id = 'YOUR_BOOKING_ID';
-- Should show: status = 'paid'
```

## ⚠️ Prerequisites

1. **Enable Stripe Connect** (CRITICAL)
   - Go to: https://dashboard.stripe.com/test/settings/connect
   - Click "Enable as platform"

2. **Update Webhook Secret**
   - Get from `stripe listen` output
   - Update `STRIPE_WEBHOOK_SECRET` in `.env.local`

## 🚨 Common Issues & Fixes

| Error | Fix |
|-------|-----|
| Docker daemon not running | Install/start Docker Desktop |
| 403 from functions | Add `--no-verify-jwt` locally |
| "Invalid booking" | Booking doesn't exist or not pending |
| Connect/fee errors | Enable Connect in Stripe Dashboard |
| Webhook signature failed | Update `STRIPE_WEBHOOK_SECRET` |

## 🚢 Deploy to Production

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ftozjjjrhifbblpslixk

# Deploy functions
supabase functions deploy stripe-connect-link --no-verify-jwt
supabase functions deploy checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt

# Add webhook in Stripe Dashboard
# Point to: https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-webhook
# Use that whsec_... in production environment
```

## ✅ Success Criteria

- [ ] Provider completes onboarding → `stripe_connect_id` saved
- [ ] Customer creates booking → status = 'pending'
- [ ] Customer pays via Checkout → redirects to success
- [ ] Webhook fires → booking status = 'paid'
- [ ] 10% platform fee collected automatically

Your payment spine is ready. Just need Docker to test locally, or deploy to Supabase to test live.