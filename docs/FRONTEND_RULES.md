# Frontend Development Guardrails

## CRITICAL: Protected Files and Directories

### ❌ NEVER MODIFY (Backend/Money Path)
- `supabase/**` - All database migrations, Edge Functions, configs
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/payments.ts` - Payment helper functions
- `.env*` - Environment variables
- Any SQL files or migrations
- `package.json` dependencies related to payment processing

### ✅ SAFE TO MODIFY (Frontend Only)
- `src/pages/**` - All page components
- `src/components/**` - Reusable UI components
- `src/styles/**` - Stylesheets
- `src/lib/ui/**` - Design system components
- `src/routes/meta/**` - SEO and metadata
- `public/**` - Static assets
- `docs/**` - Documentation

## Data Access Rules

### Public Data (Anonymous Users)
Always use these secure views for public data:
- `public_profiles` - Safe profile data (no emails)
- `public_listings` - Active listings only
- `public_listing_slots` - Future slots for active listings

### Authentication
- Use `supabase.auth` for all authentication
- Never store service role keys in frontend
- Check session before showing authenticated UI

## API Contracts (DO NOT CHANGE)

### Edge Functions
Call these exactly as specified:

#### Stripe Connect Onboarding
```typescript
POST /functions/v1/stripe-connect-link
{
  returnUrl: string,
  accountId?: string  // Optional for returning users
}
```

#### Checkout Session
```typescript
POST /functions/v1/checkout
{
  booking_id: string,
  provider_connect_id: string,
  success_url: string,
  cancel_url: string
}
```

#### Update Provider Capabilities
```typescript
POST /functions/v1/update-provider-capabilities
{
  accountId: string
}
```

## Development Workflow

1. **Branch**: Always work on `fe-build` branch
2. **Test**: Run `npm run build && npm test` before committing
3. **PR**: Create PR to main, ensure CI passes
4. **Review**: Get approval before merging

## Component Guidelines

### Design System
- Use Tailwind CSS for styling
- Create small, reusable components in `src/lib/ui/`
- Keep components under 200 lines when possible
- Ensure responsive at: 360px, 768px, 1280px

### SEO Requirements (Public Pages)
- `<title>` tag
- `<meta name="description">`
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD) where appropriate

## Safe AI Prompt Template

When using AI to build frontend features, start with this prompt:

```
You are implementing frontend only for an existing marketplace.

Do not modify any files outside these paths: 
- src/pages/**, src/components/**, src/styles/**, src/lib/ui/**, src/routes/meta/**, public/**, docs/**

Never change:
- Supabase schema, Edge Functions, or anything in supabase/**
- src/lib/payments.ts, src/lib/supabase.ts, or .env*

Data reads must use Supabase public views: 
- public_profiles, public_listings, public_listing_slots

Payments must call existing Edge Functions with exact request shapes shown in docs/FRONTEND_RULES.md

Use the existing supabase client and src/lib/payments.ts helpers.

Build responsive components using Tailwind CSS.

Definition of done:
- npm run build passes
- npm test passes
- No edits to forbidden paths
- Uses public views for anonymous reads
- Uses payment helpers for money flows
- Responsive at 360px, 768px, 1280px
- SEO tags on public pages

If a feature requires backend changes, STOP and document the need instead of implementing.
```

## Testing Checklist

Before merging any PR:
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] No modifications to protected files
- [ ] Anonymous data uses public views
- [ ] Payment flows use existing helpers
- [ ] Responsive on mobile/tablet/desktop
- [ ] SEO tags present on public pages

## Emergency Contacts

If you accidentally modify protected files:
1. `git checkout -- <protected-file>` to revert
2. Review `git diff` before committing
3. Never force push to main

## The Golden Rule

**If it touches money, databases, or authentication backends - STOP.**
Document what you need and request a backend developer to review.