export const isValidEnvValue = (val: unknown): boolean => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const upper = trimmed.toUpperCase();
  if (
    upper.includes('YOUR_') ||
    upper.includes('PLACEHOLDER') ||
    upper.includes('REPLACE_') ||
    upper === 'UNDEFINED' ||
    upper === 'NULL'
  ) {
    return false;
  }
  return true;
};

export const getEnv = (_key: string, value: any): string => {
  if (!isValidEnvValue(value)) return '';
  return String(value).trim();
};

export const STRIPE_PK = getEnv('VITE_STRIPE_PUBLISHABLE_KEY', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
export const PAYPAL_CLIENT_ID = getEnv('VITE_PAYPAL_CLIENT_ID', import.meta.env.VITE_PAYPAL_CLIENT_ID);
export const PAYPAL_MERCHANT_EMAIL = getEnv('VITE_PAYPAL_MERCHANT_EMAIL', import.meta.env.VITE_PAYPAL_MERCHANT_EMAIL);

