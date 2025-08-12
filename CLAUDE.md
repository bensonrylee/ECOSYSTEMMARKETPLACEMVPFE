# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a marketplace application with Stripe Connect integration, built with React 19, TypeScript, and Vite. It uses Supabase for backend services and supports provider onboarding, listings management, and payment processing through Stripe Connect.

## Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7  
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payment Processing**: Stripe Connect with Express accounts
- **Routing**: React Router DOM 7
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI, Lucide React icons
- **State Management**: Zustand 5
- **Testing**: Vitest with Happy DOM

## Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Run tests
npm test

# Run ESLint
npm run lint

# Preview production build
npm run preview

# Type checking
tsc -b

# Run single test file
npm test -- <test-file-name>
```

## Architecture Overview

### Frontend Structure
- **Pages**: Route-based components in `/pages` with nested routing (listings/[id], bookings/[id]/success)
- **Components**: Reusable UI components with Layout component providing navigation
- **Library Code**: Core utilities in `/lib` for Supabase client, payment helpers, and Stripe integration
- **Types**: TypeScript definitions in `/types` including generated Supabase types

### Backend Architecture
- **Supabase Project**: PostgreSQL database with Row-Level Security (RLS) policies
- **Edge Functions**: Deno-based serverless functions for payment operations
  - `stripe-connect-link`: Provider onboarding to Stripe Connect
  - `checkout`: Create checkout sessions for bookings
  - `stripe-webhook`: Handle Stripe webhook events
  - `update-provider-capabilities`: Update provider payment capabilities

### Payment Flow
1. **Provider Onboarding**: Stripe Connect Express account setup via `stripe-connect-link` function
2. **Booking Creation**: Frontend creates booking record, calls `checkout` function
3. **Payment Processing**: Stripe Checkout handles payment, webhook updates booking status
4. **Success Handling**: Success page polls for payment confirmation

## Critical Development Constraints

### 🚫 PROTECTED FILES (Never Modify)
- `supabase/**` - Database migrations, Edge Functions, configuration
- `src/lib/supabase.ts` - Supabase client configuration  
- `src/lib/payments.ts` - Payment helper functions
- `.env*` files - Environment variables
- Any SQL files or database migrations

### ✅ SAFE TO MODIFY (Frontend Only)
- `src/pages/**` - Page components
- `src/components/**` - UI components  
- `src/types/index.ts` - Frontend type definitions (not Supabase generated types)
- `public/**` - Static assets
- `docs/**` - Documentation

### Data Access Rules
- **Public Data**: Use secure views (`public_profiles`, `public_listings`, `public_listing_slots`)
- **Authentication**: Always use `supabase.auth` methods from `src/lib/supabase.ts`
- **Payments**: Only use functions from `src/lib/payments.ts`

## Environment Setup

Required environment variables (all prefixed with `VITE_` for Vite access):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Testing Strategy

- **Unit Tests**: Use Vitest for utility functions and components
- **Environment**: Happy DOM for DOM simulation
- **Test Files**: Co-located with source files using `.test.ts` suffix
- **Coverage**: Focus on critical payment flows and authentication

## Branch Strategy
- **Main Branch**: `main` (production-ready)
- **Development Branch**: `fe-build` (active frontend development)
- **Workflow**: Create PRs from feature branches to `main`

## Key Integration Points

### Stripe Connect API Contracts
All payment functions expect exact request shapes:

**Provider Onboarding**:
```typescript
POST /functions/v1/stripe-connect-link
{ returnUrl: string, accountId?: string }
```

**Checkout Session**:
```typescript  
POST /functions/v1/checkout
{ booking_id: string, provider_connect_id: string, success_url: string, cancel_url: string }
```

### Database Schema
- **Core Tables**: profiles, providers, listings, listing_slots, bookings
- **Public Views**: Secure, read-only views for anonymous access
- **RLS Policies**: Row-level security for data isolation

## Development Workflow

1. **Setup**: Work on `fe-build` branch for frontend changes
2. **Testing**: Run `npm run build && npm test` before commits  
3. **Constraints**: Never modify protected backend files
4. **Data Access**: Use public views for anonymous reads, authenticated queries for user data
5. **Payments**: Use existing payment helpers, never modify payment logic
6. **Responsive**: Ensure components work at 360px, 768px, 1280px breakpoints