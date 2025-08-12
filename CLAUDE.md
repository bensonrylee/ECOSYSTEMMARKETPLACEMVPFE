# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Ecosystem marketplace application built with React, TypeScript, and Vite. It integrates with Stripe for payments and Firebase for backend services.

## Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Payment Processing**: Stripe (stripe-js and server SDK)
- **Backend**: Firebase 12
- **State Management**: Zustand 5
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI, Lucide React icons
- **Data Fetching**: TanStack React Query

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview

# Type checking (runs during build)
tsc -b
```

## Project Structure

```
/src
  /components    # React components
  /hooks        # Custom React hooks
  /lib          # Utility functions and configurations
  /pages        # Page components
  /services     # API and external service integrations
  /store        # Zustand store definitions
  /types        # TypeScript type definitions
```

## Key Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for Tailwind
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules

## Stripe Integration Notes

The project uses both `@stripe/stripe-js` for client-side operations and `stripe` SDK for server-side operations. Stripe CLI has been configured with account ID: acct_1RnmHHAtcuskq3MV

## Environment Variables

Create a `.env` file with the following variables:
```
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Development Workflow

1. All Vite environment variables must be prefixed with `VITE_` to be accessible in the client
2. Use TypeScript strict mode for type safety
3. Follow React 19 patterns and best practices
4. Tailwind classes should be used for styling
5. Form validation should use Zod schemas with React Hook Form