export const getEnv = (key: string): string => {
  // @ts-ignore - resolve import.meta.env error for local IDE
  return import.meta.env[key] || '';
};

export const STRIPE_PK = getEnv('VITE_STRIPE_PUBLISHABLE_KEY');
export const PAYPAL_CLIENT_ID = getEnv('VITE_PAYPAL_CLIENT_ID');
export const PAYPAL_MERCHANT_EMAIL = getEnv('VITE_PAYPAL_MERCHANT_EMAIL');
