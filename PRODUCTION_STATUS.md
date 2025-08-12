# Production Deployment Status

## ✅ Completed
1. **Edge Functions Deployed** - All 3 functions live in production
   - `stripe-connect-link` - Creates onboarding links
   - `checkout` - Validates bookings and creates Checkout sessions  
   - `stripe-webhook` - Updates booking status on payment

2. **Webhook Configured**
   - Production endpoint: `we_1RvAnYAtcuskq3MVsrliO9eL`
   - Secret updated: `whsec_5WI046MvTSaZVdPDJu5t8KJUF60ohePz`

3. **Test Users Created**
   - Provider: `45ff8aff-d38d-485f-9a96-91c2a86f48fc`
   - Customer: `9c2f1d8a-c303-4ca7-9da6-3c2e65ef764b`

4. **Connect Account Ready**
   - Test account: `acct_1RvArcAbLWkD0WxT`

5. **Unit Tests Written** - 11 tests passing
   - Slot generation logic
   - Booking conflict detection
   - Payment client wrapper

## ⏳ Pending - Manual Steps Required

### Create Database Tables
Run this SQL in Supabase Dashboard SQL Editor:
https://supabase.com/dashboard/project/ftozjjjrhifbblpslixk/sql/new

```sql
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('customer','provider')) not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists providers(
  id uuid primary key references profiles(id) on delete cascade,
  stripe_connect_id text,
  charges_enabled boolean default false
);

create table if not exists listings(
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id),
  title text not null,
  description text,
  kind text check (kind in ('service','event','space')) not null,
  price_cents int not null,
  pricing_unit text check (pricing_unit in ('hour','fixed')) not null,
  lat double precision, lng double precision,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists listing_slots(
  listing_id uuid references listings(id) on delete cascade,
  start_at timestamptz,
  end_at timestamptz,
  primary key (listing_id, start_at)
);

create table if not exists bookings(
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  customer_id uuid references profiles(id),
  provider_id uuid references providers(id),
  start_at timestamptz,
  end_at timestamptz,
  amount_cents int not null,
  status text check (status in ('pending','paid','canceled')) default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

create unique index if not exists uniq_booking_slot
on bookings(listing_id, start_at) where status in ('pending','paid');
```

### After Tables Created
Run `node complete_test_setup.js` to:
- Update provider with Connect ID
- Create test listing
- Create booking
- Get checkout URL for testing

## Key Files
- `create_tables.sql` - Database schema
- `seed_test_data.js` - Creates test users
- `complete_test_setup.js` - Sets up test scenario
- `src/lib/helpers.test.ts` - Unit tests for client helpers

## Test Commands
```bash
# Run unit tests
npm test

# Test Connect onboarding
curl -s https://ftozjjjrhifbblpslixk.supabase.co/functions/v1/stripe-connect-link \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "content-type: application/json" \
  -d '{"returnUrl":"http://localhost:5173/onboarding/complete"}' | jq -r '.url'
```

## Security Notes
- ✅ Service role key only in Supabase secrets (not .env.local)
- ✅ Stripe in TEST mode only
- ✅ Functions validate bookings before payment
- ✅ Webhook signature verification enabled