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
 * The env vars that hold origins, and what each one is for.
 */
const ORIGIN_ENV_KEYS = [
  ['PRODUCTION_DASHBOARD_URL', 'merchant dashboard (production)'],
  ['PRODUCTION_ADMIN_URL', 'admin panel (production)'],
  ['PRODUCTION_STOREFRONT_URL', 'storefront (production)'],
  ['CLIENT_URL', 'merchant dashboard (development)'],
  ['STOREFRONT_URL', 'storefront (development)'],
  ['ADMIN_URL', 'admin panel (development)'],
];

/**
 * Origins that are always trusted in development, so a fresh checkout works
 * without extra configuration. The Vite apps use fixed ports.
 */
const DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

/**
 * Split a raw env value into individual origins.
 *
 * A comma is the documented separator. `&&`, `||` and `;` are accepted as
 * well, because those are the separators people actually paste — e.g.
 * `CLIENT_URL=http://localhost:5173 && http://localhost:3000`. dotenv does
 * not interpret them, so the value would otherwise become one long string
 * that matches no origin at all, and the only symptom is a bare
 * "403 Origin not allowed" with no obvious cause.
 *
 * @param {string|undefined} raw
 * @returns {string[]}
 */
const splitOrigins = (raw) =>
  String(raw)
    .split(/,|&&|\|\||\||;/)
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Is this a usable origin? An absolute http(s) URL with a host.
 *
 * @param {string} value
 * @returns {boolean}
 */
const isValidOrigin = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return Boolean(url.hostname);
  } catch {
    return false;
  }
};

/**
 * Read every origin env var, split it into individual origins, drop the
 * invalid ones and warn about anything suspicious.
 *
 * @returns {string[]}
 */
const readOrigins = () => {
  const origins = [];
  const seen = new Set();

  const add = (origin) => {
    if (seen.has(origin)) return;
    seen.add(origin);
    origins.push(origin);
  };

  if (env.isDevelopment) DEVELOPMENT_ORIGINS.forEach(add);

  for (const [key, label] of ORIGIN_ENV_KEYS) {
    const raw = env[key];
    if (!raw) continue;

    const parts = splitOrigins(raw);
    const invalid = parts.filter((part) => !isValidOrigin(part));

    if (invalid.length > 0) {
      console.warn(
        `⚠️  ${key} (${label}) is not a valid origin and was ignored: ${invalid
          .map((part) => `"${part}"`)
          .join(', ')}`
      );
      console.warn(
        '   Expected a single URL, or several separated by commas:\n' +
          '     CLIENT_URL=https://app.example.com,https://other.example.com'
      );
    }

    for (const part of parts) {
      if (!isValidOrigin(part)) continue;
      if (seen.has(part)) continue;
      seen.add(part);
      origins.push(part);
    }

    if (parts.length > 1 && !raw.includes(',')) {
      console.warn(
        `⚠️  ${key} holds ${parts.length} origins separated by something other than a comma. ` +
          'Use commas — "&", "|" and ";" are accepted but not recommended.'
      );
    }
  }

  return origins;
};

/**
 * Origins that may send credentialed, cookie-authenticated requests.
 */
export const TRUSTED_ORIGINS = readOrigins();

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
