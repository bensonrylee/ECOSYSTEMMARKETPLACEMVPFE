# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Ecosystem Marketplace - A two-sided marketplace platform with React frontend and Supabase backend, integrated with Stripe Connect for payment processing.

## Tech Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 7
- **Styling**: Tailwind CSS 4 with PostCSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: Stripe Connect (Express accounts) with `@stripe/stripe-js`
- **State Management**: Zustand 5
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI, Lucide React icons
- **Data Fetching**: TanStack React Query
- **Testing**: Vitest with Happy DOM

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (runs TypeScript compiler first)
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview

# Run tests with Vitest
npm test
```

## Project Architecture

### Frontend Structure
```
/src
  /components    # Shared UI components
  /lib          # Core utilities and service clients
    supabase.ts   # Supabase client (DO NOT MODIFY)
    payments.ts   # Payment helpers (DO NOT MODIFY)
    stripe.ts     # Stripe.js configuration
  /pages        # Route pages following file-based routing
    /bookings   # Booking flow pages
    /listings   # Listing management pages
    /onboarding # Provider onboarding flow
  /types        # TypeScript type definitions
```

### Backend Structure (Protected - DO NOT MODIFY)
```
/supabase
  /functions      # Edge Functions (Deno)
    /checkout     # Creates Stripe Checkout sessions
    /stripe-connect-link  # Generates Connect onboarding links
    /stripe-webhook      # Handles payment webhooks
  /migrations     # Database schema migrations
```

## Critical Development Rules

### Protected Files (NEVER MODIFY)
- `supabase/**` - All backend code, migrations, Edge Functions
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/payments.ts` - Payment helper functions
- `.env*` - Environment variables
- SQL files and database migrations

### Safe to Modify
- `src/pages/**` - All page components
- `src/components/**` - UI components
- `src/types/**` - Type definitions
- `docs/**` - Documentation

## API Contracts

### Edge Functions (Use exactly as specified)

#### Stripe Connect Onboarding
```typescript
POST /functions/v1/stripe-connect-link
Body: {
  returnUrl: string,
  accountId?: string  // For returning users
}
Response: { url: string }
```

#### Create Checkout Session
```typescript
POST /functions/v1/checkout
Body: {
  booking_id: string,
  provider_connect_id: string,
  success_url: string,
  cancel_url: string
}
Response: { url: string }
```

#### Update Provider Capabilities
```typescript
POST /functions/v1/update-provider-capabilities
Body: {
  accountId: string
}
```

## Database Access Patterns

### Public Views (Use for anonymous access)
- `public_profiles` - Safe profile data without emails
- `public_listings` - Active listings only
- `public_listing_slots` - Future available slots

### Authentication
- Always use `supabase.auth` for authentication
- Check session before showing authenticated UI
- Service role keys stay in Supabase secrets only

## Environment Variables

Required in `.env` or `.env.local`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY_TEST=
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=
VITE_APP_ENV=development|production
```

## Testing Requirements

Before any commit:
1. Run `npm run build` - Must pass without errors
2. Run `npm test` - All tests must pass
3. Verify no modifications to protected files
4. Check responsive design at 360px, 768px, 1280px

## CI/CD Pipeline

GitHub Actions runs on every PR:
1. TypeScript compilation check
2. Unit test execution
3. Protected file modification check (blocks PR if violated)
4. Optional linting (non-blocking)

## Key Implementation Patterns

### Booking Flow
1. Customer selects slot → Creates pending booking
2. Calls `/checkout` Edge Function → Validates booking
3. Redirects to Stripe Checkout
4. Webhook updates booking to 'paid' status
5. Success page polls for status update

### Provider Onboarding
1. Provider signs up → Profile with role='provider'
2. Calls `/stripe-connect-link` → Express onboarding
3. Returns to `/onboarding/complete`
4. Updates provider with Connect account ID
5. Webhook updates `charges_enabled` flag

## Current Implementation Status

### Completed Features
- Stripe Connect Express onboarding
- Checkout session creation with destination charges
- Webhook processing for payment status
- Booking conflict prevention (unique constraint)
- Test/Live mode environment switching

### Database Tables
- `profiles` - User profiles with roles
- `providers` - Provider-specific data with Stripe Connect IDs
- `listings` - Service/event/space offerings
- `listing_slots` - Available time slots
- `bookings` - Customer bookings with payment status

## Development Workflow Best Practices

1. Work on feature branches, PR to main
2. Use existing Supabase client and payment helpers
3. Follow TypeScript strict mode patterns
4. Use Tailwind classes for all styling
5. Implement Zod schemas for form validation
6. Add SEO meta tags to public pages
7. Ensure mobile-first responsive design

## Security Reminders

- Never expose service role keys in frontend code
- Always validate booking ownership before payment
- Use RLS policies for data access control
- Verify Stripe webhook signatures
- Keep Stripe in TEST mode during development

## Common Implementation Pitfalls & Fixes

### Routing Issues
**Problem**: Using `:id` instead of `:slug` → 404 errors
**Fix**: Verify route params with `useParams()`, update browse card links to `/providers/${slug}`

### Data Access Violations
**Problem**: Querying base tables instead of public views for anonymous users
**Fix**: ALWAYS use `public_profiles`, `public_listings`, `public_listing_slots` for anonymous access
**Verification**: Run `rg -n "from\\('(profiles|listings|listing_slots)'\\)" src/pages` - should return no results

### SEO/Accessibility Issues
**Problem**: Missing meta tags, layout shift, poor accessibility
**Fix**: Create reusable `<Seo>` component with title, description, OG/Twitter tags
**Requirements**: 
- Lighthouse mobile scores: Performance ≥85, Accessibility ≥95, SEO ≥95
- CLS (Cumulative Layout Shift) ≤0.1
- All images must have fixed dimensions or aspect ratio containers

### Booking Flow Errors
**Problem**: Wrong payload shape to checkout helper
**Fix**: Use exact shape: `{ booking_id, provider_connect_id, success_url, cancel_url }`

### Bundle Bloat
**Problem**: Adding unnecessary dependencies
**Fix**: Use existing dependencies only. If new lib added, remove and inline functionality

## Preemptive Implementation Requirements

### For Every New Page Component
1. Create and use `src/components/Seo.tsx` with:
   - `<title>` tag
   - Meta description
   - Canonical URL
   - Open Graph tags
   - Twitter Card tags

2. Add comment above anonymous data queries:
   ```typescript
   // Anonymous access - must use public view per CLAUDE.md rules
   const { data } = await supabase.from('public_listings')
   ```

3. Prevent layout shift:
   - Set explicit heights on skeletons (`h-48`, `h-64`)
   - Add width/height attributes to all images
   - Use aspect ratio containers for responsive images

### For Time/Date Features
Create `groupSlotsByLocalDate(slots, timeZone)` utility with tests for:
- DST transitions
- Midnight boundaries  
- Empty arrays
- UTC normalization

### For Browse/Filter Features
- Client-side filtering (city/kind/price)
- "Load more" pagination without page reload
- Empty state components
- Loading skeletons with fixed heights

## Acceptance Criteria Checklist

### After Each Feature Implementation

1. **Build & Type Check**
   ```bash
   npm run build  # Must pass without errors
   ```

2. **Run Tests**
   ```bash
   npm test  # All tests must pass
   ```

3. **Browser Smoke Test**
   - [ ] Landing page loads on mobile (360px) without horizontal scroll
   - [ ] Browse page shows cards, filters work
   - [ ] Provider page (`/providers/:slug`) loads with services and slots
   - [ ] Booking button triggers checkout (network call visible)
   - [ ] Success page renders without layout jumps

4. **Security Verification**
   ```bash
   # Should return NO results - only public_ views allowed
   rg -n "from\\('(profiles|listings|listing_slots)'\\)" src/pages
   ```

5. **Performance Check**
   - Provider page loads under 2s on 3G throttling
   - No CLS > 0.1 on any page
   - Keyboard navigation works throughout

## Quick Fix Commands

### If Build Fails
```bash
# Check for type errors
npm run build

# Common fixes:
# - Update route params to match :slug not :id
# - Fix import paths
# - Add missing type definitions
```

### If Wrong Data Access
```bash
# Find violations
rg -n "from\\('(profiles|listings|listing_slots)'\\)" src/pages

# Replace with public_ views
# profiles → public_profiles
# listings → public_listings  
# listing_slots → public_listing_slots
```

### If Git Goes Wrong
```bash
# Discard uncommitted changes
git restore -SW :/

# Revert last commit (keep changes)
git reset --soft HEAD~1

# View what changed
git diff --cached
```

## Minimal "Done" Criteria

### Landing Page
- Lighthouse mobile: Performance ≥85, Accessibility ≥95, SEO ≥95
- Responsive at 360px, 768px, 1280px
- Links to /onboarding and /browse work

### Provider Page
- Loads under 2s on 3G with skeletons
- No CLS > 0.1
- Keyboard navigable
- Shows services and available slots
- Booking button creates valid checkout session

### Browse Page  
- Filters work without page reload
- Load more pagination works
- Empty states present
- Cards link correctly to `/providers/:slug`

### Booking Success
- Shows amount, provider, time
- "Add to calendar" generates valid .ics file
- Polls for payment status (max 10s)

## Development Workflow Reminders

1. **Always work on `fe-build` branch**
2. **Commit after each completed feature** (enables easy revert)
3. **Never modify protected files** (CI will block PR)
4. **Test on mobile first** (360px viewport)
5. **Use existing helpers** from `src/lib/payments.ts`

## Verification Workflow (Plan → Apply → Verify → Report)

### 0) Preconditions Check
Before starting any task, verify:
```bash
# Current location and git status
pwd && git status -s && git rev-parse --abbrev-ref HEAD

# Environment setup
[ -f .env.local ] && echo "✅ .env.local exists" || echo "❌ .env.local missing"

# Supabase connection (if needed)
supabase status | head -5
```

### 1) Plan Phase
- Show brief plan (≤10 bullets) with files to edit
- Preview key diffs before applying
- Identify success criteria
- Request approval: "Type GO to apply"

### 2) Apply Phase
After approval:
- Create feature branch if not on one
- Make changes exactly as planned
- Stage and commit with descriptive message

### 3) Verify Phase (MANDATORY)

Run automated verification:
```bash
# Full smoke test suite
bash scripts/smoke.sh

# SQL verification (in Supabase SQL Editor)
-- Run scripts/sql_verify.sql
```

Manual checks:
- Build: `npm run build`
- Tests: `npm test`
- Type check: `tsc -b`
- Security: `rg -n "from\\('(profiles|listings|listing_slots)'\\)" src/pages`

### 4) Self-Diagnose & Auto-Repair
If verification fails:
1. Identify root cause
2. Attempt up to 2 focused fixes
3. Re-run verification after each fix
4. Stop and ask for help if still failing

### 5) Report Phase
Provide summary:
- What changed and why
- Verification results
- Any warnings or issues
- Next safe steps

## Verification Scripts

### scripts/smoke.sh
Comprehensive verification suite that:
- Runs build and type checking
- Executes test suite
- Tests API endpoints (CORS, public views)
- Verifies security (anon access restrictions)
- Checks for code violations

Usage:
```bash
bash scripts/smoke.sh
```

### scripts/sql_verify.sql
SQL verification queries that check:
- Public views exist
- PostGIS installed and configured
- Spatial indexes present
- Storage policies applied
- Data integrity (future-only slots)

Usage: Run in Supabase SQL Editor

## Quick Recovery Commands

### If something goes wrong:
```bash
# Discard all uncommitted changes
git restore -SW :/

# Revert last commit but keep changes
git reset --soft HEAD~1

# Check what changed
git diff --cached

# Return to main branch
git checkout main
```

### Common fixes:
```bash
# Fix type errors
npm run build

# Find data access violations
rg -n "from\\('(profiles|listings|listing_slots)'\\)" src/pages

# Test API access
curl -s "$VITE_SUPABASE_URL/rest/v1/public_listings?limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```