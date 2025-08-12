import { loadStripe } from '@stripe/stripe-js';

// Determine which Stripe key to use based on environment
const getStripePublishableKey = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  
  if (env === 'production') {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE;
  }
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST;
};

// Initialize Stripe.js with the appropriate key
export const stripePromise = loadStripe(getStripePublishableKey());

// Helper to check if we're in test mode
export const isTestMode = () => {
  const key = getStripePublishableKey();
  return key?.includes('pk_test_');
};

// Stripe configuration
export const stripeConfig = {
  publishableKey: getStripePublishableKey(),
  isTestMode: isTestMode(),
  // Add any additional Stripe configuration here
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
};