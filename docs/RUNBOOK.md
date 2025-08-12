# Build Steps (Paste these prompts in order)

## 1) Onboarding page + role upsert + Connect button
Create src/pages/onboarding.tsx:
- Two buttons: "I'm a Provider" / "I'm a Customer"
- Upsert profile with role
- Provider path: show Connect button that calls stripe-connect-link function
- Customer path: redirect to /browse
- ≤150 lines, no new libs

**Done when:** provider can click Connect, complete Express, return, and we persist acct_...

## 2) New listing page
Create src/pages/listings/new.tsx:
- Require session and provider role
- Fields: title, kind(service|event|space), price_cents, pricing_unit(fixed|hour), lat, lng
- Insert listing, redirect to /listings/{id}
- ≤160 lines, no new libs

## 3) Listing detail + slot generator
Create src/pages/listings/[id].tsx:
- Provider view: form to generate slots for next 14 days (start_date, days_ahead, start_time, end_time, slot_minutes). Bulk insert to listing_slots; ignore duplicates
- Customer view: list future slots with "Book" button
- ≤220 lines

## 4) Booking + Checkout
In [id].tsx customer view:
- On Book → insert bookings row (pending) then call checkout function and redirect to Stripe
- Provider view: banner if charges_enabled=false
- Diff-only change

## 5) Success page
Create src/pages/bookings/[id]/success.tsx:
- Show status + payment_intent; poll up to 10s if not paid
- ≤120 lines

## 6) (Tomorrow) Minimal RLS policies
Generate supabase/migrations/rls_minimal.sql with policies
- Don't apply today

## Commit after each step:
```bash
git add -A
git commit -m "step X: <what you added>"
```

## Acceptance criteria
- Provider completes Connect Express and charges_enabled = true
- Listing created; slots generated; customer books and pays; webhook flips to paid
- Second booking for same slot fails nicely
- Secrets not in client bundle
- No function code changed post-deployment