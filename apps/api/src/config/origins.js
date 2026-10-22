import { env } from './env.js';

/**
 * Origin configuration
 *
 * There are TWO different origin lists, and they are NOT the same:
 *
 * 1. `TRUSTED_ORIGINS` — the apps we own. These may send **credentialed**
 *    (cookie-carrying) requests to the API. This is the list the CSRF guard
 *    uses.
 *
 * 2. Preview deployments — any `*.vercel.app` URL. These are allowed to make
 *    ordinary CORS requests so that preview builds keep working, but they are
 *    **not** trusted with cookies.
 *
 * Why the split: the API lives on `onrender.com` and the dashboards on
 * `vercel.app`, so they are different sites. The refresh cookie therefore has
 * to be `SameSite=None; Secure` (see `utils/generateToken.js`), which means
 * the browser will now attach it to cross-site requests. That makes the CORS
 * wildcard dangerous for anything cookie-authenticated, so the strict list
 * exists to keep credentialed requests limited to origins we control.
 */

/**
 * Origins that may send credentialed, cookie-authenticated requests.
 */
export const TRUSTED_ORIGINS = [
  // Production
  env.PRODUCTION_DASHBOARD_URL, // merchant dashboard (Vercel)
  env.PRODUCTION_ADMIN_URL, // platform admin panel (Vercel)
  env.PRODUCTION_STOREFRONT_URL, // storefront (Vercel)
  // Development / staging
  env.CLIENT_URL, // merchant dashboard
  env.STOREFRONT_URL, // storefront
  'http://localhost:5173', // merchant dashboard (vite dev)
  'http://localhost:5174', // admin panel (vite dev)
  'http://localhost:3000', // storefront (next dev)
].filter(Boolean);

/**
 * Is this origin allowed to make CORS requests at all?
 *
 * Trusted origins, plus any Vercel preview deployment.
 *
 * @param {string|undefined} origin - The `Origin` header
 * @returns {boolean}
 */
export const isCorsOriginAllowed = (origin) => {
  // Same-origin requests and non-browser clients send no Origin
  if (!origin) return true;

  if (TRUSTED_ORIGINS.includes(origin)) return true;

  // Vercel preview deployments (e.g. aurion-commerce-abc-123.vercel.app)
  if (origin.endsWith('.vercel.app')) return true;

  return false;
};

/**
 * Is this origin trusted with credentialed requests?
 *
 * Strict — the explicit list only. A preview deployment is NOT trusted.
 *
 * @param {string|undefined} origin - The `Origin` header
 * @returns {boolean}
 */
export const isTrustedOrigin = (origin) => {
  if (!origin) return false;
  return TRUSTED_ORIGINS.includes(origin);
};
