export const getEnv = (key: string, value: any): string => {
  return value || '';
};

export const STRIPE_PK = getEnv('VITE_STRIPE_PUBLISHABLE_KEY', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const PAYPAL_CLIENT_ID = getEnv('VITE_PAYPAL_CLIENT_ID', import.meta.env.VITE_PAYPAL_CLIENT_ID);
export const PAYPAL_MERCHANT_EMAIL = getEnv('VITE_PAYPAL_MERCHANT_EMAIL', import.meta.env.VITE_PAYPAL_MERCHANT_EMAIL);
