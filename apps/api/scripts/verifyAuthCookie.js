/**
 * Verify the refresh-cookie behaviour (BUG-002 / BUG-035 / BUG-040)
 *
 * Run: npm run verify:auth-cookie --workspace=apps/api
 *       npm run verify:auth-cookie --workspace=apps/api -- --mode=development
 *       VERIFY_MODE=development npm run verify:auth-cookie --workspace=apps/api
 *
 * NOTE: npm 10 swallows `--mode=...` as its own config flag, so the env var is
 * the reliable way to pick the mode through `npm run`.
 *
 * WHAT IT CHECKS
 * --------------
 * The API runs on *.onrender.com and the dashboards on *.vercel.app. Those are
 * different SITES, so a SameSite=Strict or Lax cookie is never attached to
 * the cross-site refresh call and the merchant gets logged out every 15
 * minutes. This script proves that:
 *
 *   1. The refresh cookie is set with the right attributes
 *      (production: SameSite=None; Secure — development: SameSite=Lax)
 *   2. A cross-site refresh WITH the cookie works
 *   3. A cross-site refresh from an UNTRUSTED origin is rejected (CSRF)
 *   4. A refresh with no cookie is rejected
 *   5. A refresh token issued before a password change is rejected
 *   6. Logout really clears the cookie (matching attributes + expired)
 *   7. Login from an untrusted origin is rejected (login CSRF)
 *
 * It runs against a THROWAWAY database and drops it at the end.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ---------------------------------------------------------------
// Mode: production (default) or development
// `--mode=` is read first, then VERIFY_MODE (npm 10 eats `--mode`).
// ---------------------------------------------------------------
const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const MODE = (modeArg ? modeArg.split('=')[1] : process.env.VERIFY_MODE) || 'production';

const REAL_URI = process.env.MONGODB_URI;
const TEST_DB = 'Aurion-commerce-authcookie-test';

process.env.NODE_ENV = MODE;
process.env.MONGODB_URI = REAL_URI.replace(/\/([^/?]+)(\?|$)/, `/${TEST_DB}$2`);
// Deterministic trusted origins
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.STOREFRONT_URL = 'http://localhost:3000';
process.env.PRODUCTION_DASHBOARD_URL = 'https://dashboard.example.vercel.app';

const { connectDB } = await import('../src/config/db.js');
const { env } = await import('../src/config/env.js');
const { default: mongoose } = await import('mongoose');
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/auth/User.model.js');

const TRUSTED_ORIGIN = 'http://localhost:5173';
const UNTRUSTED_ORIGIN = 'https://evil.example.com';

let passed = 0;
let failed = 0;
const check = (label, cond, extra = '') => {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label} ${extra}`);
  }
};

// ============================================================
await connectDB();
console.log(`\n🧪 Mode: ${MODE}`);
console.log(`🧪 Test database: ${mongoose.connection.name}\n`);

await mongoose.connection.db.dropDatabase();

const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
console.log(`🚀 API listening on ${base}\n`);

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const post = async (path, { body = {}, cookie, origin } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (origin) headers.Origin = origin;

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return {
    status: res.status,
    setCookie: res.headers.getSetCookie?.() ?? [],
    body: await res.json().catch(() => ({})),
  };
};

const CREDENTIALS = {
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
  password: 'C0mpiler1952',
};

// ============================================================
// TEST 1 — registration sets the refresh cookie correctly
// ============================================================
console.log('TEST 1 — the refresh cookie attributes');
let refreshCookie = null;
let accessToken = null;
{
  const res = await post('/api/v1/auth/register', {
    body: CREDENTIALS,
    origin: TRUSTED_ORIGIN,
  });

  check('register -> 201', res.status === 201, JSON.stringify(res.body));

  const cookieHeader = res.setCookie.find((c) => c.startsWith('refreshToken='));
  check('a refreshToken cookie was set', !!cookieHeader, JSON.stringify(res.setCookie));
  check('the cookie is HttpOnly', /HttpOnly/i.test(cookieHeader || ''), cookieHeader);
  check('the cookie path is /', /Path=\//i.test(cookieHeader || ''), cookieHeader);
  check('the cookie lasts 7 days', /Max-Age=604800/i.test(cookieHeader || ''), cookieHeader);

  if (MODE === 'production') {
    check(
      'SameSite=None (required for a cross-site cookie)',
      /SameSite=None/i.test(cookieHeader || ''),
      cookieHeader
    );
    check('Secure is set (required with SameSite=None)', /Secure/i.test(cookieHeader || ''), cookieHeader);
  } else {
    check(
      'SameSite=Lax (development is same-site)',
      /SameSite=Lax/i.test(cookieHeader || ''),
      cookieHeader
    );
    check('no Secure flag in development', !/;\s*Secure/i.test(cookieHeader || ''), cookieHeader);
  }

  refreshCookie = cookieHeader;
  accessToken = res.body?.data?.accessToken;
  check('an access token was returned', !!accessToken);
}

// ============================================================
// TEST 2 — the cross-site refresh works
// ============================================================
console.log('\nTEST 2 — refreshing with the cookie');
{
  const res = await post('/api/v1/auth/refresh-token', {
    cookie: refreshCookie,
    origin: TRUSTED_ORIGIN,
  });
  check('refresh -> 200', res.status === 200, JSON.stringify(res.body));
  check('a new access token was issued', !!res.body?.data?.accessToken);
  check(
    'the new token is usable',
    !!res.body?.data?.accessToken &&
      res.body.data.accessToken.split('.').length === 3
  );
}

// ============================================================
// TEST 3 — an untrusted origin is rejected (CSRF)
// ============================================================
console.log('\nTEST 3 — CSRF protection');
{
  // An untrusted origin is stopped by the CORS layer before it even reaches
  // the CSRF guard — either way the request must be refused.
  const res = await post('/api/v1/auth/refresh-token', {
    cookie: refreshCookie,
    origin: UNTRUSTED_ORIGIN,
  });
  check('refresh from an untrusted origin -> 403', res.status === 403, `got ${res.status}`);
  check(
    'refresh from an untrusted origin -> refused by CORS or CSRF',
    ['CORS_ERROR', 'UNTRUSTED_ORIGIN'].includes(res.body?.error),
    JSON.stringify(res.body)
  );
  check('no access token was leaked', !res.body?.data?.accessToken);
}
{
  // A Vercel preview deployment PASSES the CORS layer (the wildcard), so this
  // is the case the CSRF guard exists for.
  const res = await post('/api/v1/auth/refresh-token', {
    cookie: refreshCookie,
    origin: 'https://aurion-commerce-preview-123.vercel.app',
  });
  check('refresh from a Vercel preview -> 403', res.status === 403, `got ${res.status}`);
  check(
    'refresh from a Vercel preview -> UNTRUSTED_ORIGIN (the CSRF guard)',
    res.body?.error === 'UNTRUSTED_ORIGIN',
    JSON.stringify(res.body)
  );
  check('no access token was leaked', !res.body?.data?.accessToken);
}
{
  // Login CSRF: an attacker site logging a victim into the attacker's account
  const res = await post('/api/v1/auth/login', {
    body: { email: CREDENTIALS.email, password: CREDENTIALS.password },
    origin: UNTRUSTED_ORIGIN,
  });
  check('login from an untrusted origin -> 403', res.status === 403, `got ${res.status}`);
  check(
    'login from an untrusted origin -> refused by CORS or CSRF',
    ['CORS_ERROR', 'UNTRUSTED_ORIGIN'].includes(res.body?.error),
    JSON.stringify(res.body)
  );
}
{
  // A non-browser client (no Origin, no Referer) is allowed through
  const res = await post('/api/v1/auth/refresh-token', { cookie: refreshCookie });
  check('refresh with no Origin -> 200 (not a browser)', res.status === 200, `got ${res.status}`);
}
{
  // The Referer is used when there is no Origin
  const res = await fetch(`${base}/api/v1/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: refreshCookie,
      Referer: 'https://evil.example.com/page',
    },
    body: '{}',
  });
  check('refresh with an untrusted Referer -> 403', res.status === 403, `got ${res.status}`);
}

// ============================================================
// TEST 4 — no cookie, no refresh
// ============================================================
console.log('\nTEST 4 — refresh without a cookie');
{
  const res = await post('/api/v1/auth/refresh-token', { origin: TRUSTED_ORIGIN });
  check('refresh without a cookie -> 401', res.status === 401, `got ${res.status}`);
  check(
    'refresh without a cookie -> NO_REFRESH_TOKEN',
    res.body?.error === 'NO_REFRESH_TOKEN',
    JSON.stringify(res.body)
  );
}

// ============================================================
// TEST 5 — a password change revokes the refresh token
// ============================================================
console.log('\nTEST 5 — password change revokes the refresh token');
{
  const user = await User.findOne({ email: CREDENTIALS.email });
  check('the user exists', !!user);

  // Simulate a password change (a real one would come from /auth/reset-password)
  user.passwordChangedAt = new Date();
  await user.save();

  const res = await post('/api/v1/auth/refresh-token', {
    cookie: refreshCookie,
    origin: TRUSTED_ORIGIN,
  });
  check('refresh after a password change -> 401', res.status === 401, `got ${res.status}`);
  check(
    'refresh after a password change -> PASSWORD_CHANGED',
    res.body?.error === 'PASSWORD_CHANGED',
    JSON.stringify(res.body)
  );

  // A fresh login issues a new refresh token that DOES work
  const login = await post('/api/v1/auth/login', {
    body: { email: CREDENTIALS.email, password: CREDENTIALS.password },
    origin: TRUSTED_ORIGIN,
  });
  check('login after a password change -> 200', login.status === 200, JSON.stringify(login.body));
  const newCookie = login.setCookie.find((c) => c.startsWith('refreshToken='));
  const res2 = await post('/api/v1/auth/refresh-token', {
    cookie: newCookie,
    origin: TRUSTED_ORIGIN,
  });
  check('the new refresh token works -> 200', res2.status === 200, `got ${res2.status}`);
  refreshCookie = newCookie;
  accessToken = login.body?.data?.accessToken;
}

// ============================================================
// TEST 6 — logout really clears the cookie
// ============================================================
console.log('\nTEST 6 — logout clears the cookie');
{
  const res = await fetch(`${base}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: refreshCookie,
      Origin: TRUSTED_ORIGIN,
      Authorization: `Bearer ${accessToken}`,
    },
    body: '{}',
  });
  check('logout -> 200', res.status === 200, `got ${res.status}`);

  const cleared = res.headers.getSetCookie?.().find((c) => c.startsWith('refreshToken='));
  check('a clear-cookie header was sent', !!cleared, JSON.stringify(res.headers.getSetCookie?.()));
  check('the cookie value is emptied', /refreshToken=;/.test(cleared || ''), cleared);
  check('it expires in the past', /Expires=Thu, 01 Jan 1970/i.test(cleared || ''), cleared);

  if (MODE === 'production') {
    check(
      'the clear keeps SameSite=None (must match the set)',
      /SameSite=None/i.test(cleared || ''),
      cleared
    );
    check('the clear keeps Secure (must match the set)', /Secure/i.test(cleared || ''), cleared);
  } else {
    check(
      'the clear keeps SameSite=Lax (must match the set)',
      /SameSite=Lax/i.test(cleared || ''),
      cleared
    );
    check(
      'the clear has no Secure flag (must match the set)',
      !/;\s*Secure/i.test(cleared || ''),
      cleared
    );
  }
  check('the clear keeps Path=/ (must match the set)', /Path=\//i.test(cleared || ''), cleared);
}

// ------------------------------------------------------------
// Cleanup
// ------------------------------------------------------------
console.log('\n🧹 Dropping the test database');
await mongoose.connection.db.dropDatabase();
server.close();
await mongoose.connection.close();

console.log(`\n${'='.repeat(46)}`);
console.log(`  MODE: ${MODE}   PASSED: ${passed}   FAILED: ${failed}`);
console.log('='.repeat(46) + '\n');
process.exit(failed > 0 ? 1 : 0);
