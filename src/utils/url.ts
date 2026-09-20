/**
 * URL and Environment Configuration Utilities for RESTI CBO.
 *
 * Ensures all production redirects resolve to the official production domain
 * (https://resticbo.org) rather than localhost or test origins, while properly
 * respecting VITE_SITE_URL if configured, and supporting local development.
 */

export const PRODUCTION_SITE_URL = 'https://resticbo.org';

/**
 * Returns the base site URL according to environment context.
 */
export function getBaseUrl(): string {
  // 1. Explicitly configured Vite environment variable
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 2. Production build / production deployment
  if (import.meta.env.PROD) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const hostname = window.location.hostname;
      if (hostname === 'resticbo.org' || hostname === 'www.resticbo.org') {
        return window.location.origin;
      }
    }
    return PRODUCTION_SITE_URL;
  }

  // 3. Local development fallback
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return PRODUCTION_SITE_URL;
}

/**
 * Returns the absolute redirect URL for a given path.
 * e.g. getAuthRedirectUrl('/admin/reset-password')
 * => 'https://resticbo.org/admin/reset-password' in production
 */
export function getAuthRedirectUrl(path: string = ''): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
