import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generate an access token (short-lived, 15 minutes)
 * Used for API authentication
 *
 * @param {string} userId - The user's MongoDB ID
 * @param {string} [storeId] - Optional current store context
 * @returns {string} JWT token
 */
export const generateAccessToken = (userId, storeId = null) => {
  return jwt.sign(
    {
      userId,
      storeId,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES,
    }
  );
};

/**
 * Generate a refresh token (long-lived, 7 days)
 * Used only to obtain new access tokens
 * Stored in httpOnly cookie
 *
 * @param {string} userId - The user's MongoDB ID
 * @returns {string} JWT token
 */
export const generateRefreshToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
      tv: tokenVersion,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES,
    }
  );
};

export const generateAuthTokens = (userId, storeId = null, tokenVersion = 0) => {
  return {
    accessToken: generateAccessToken(userId, storeId),
    refreshToken: generateRefreshToken(userId, tokenVersion),
  };
};

/**
 * Verify an access token
 *
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

/**
 * Verify a refresh token
 *
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

/**
 * Generate a random secure token (for email verification, password reset)
 *
 * @param {number} bytes - Number of random bytes (default 32 = 64 char hex)
 * @returns {string} Random hex string
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token for storage in the database
 * We never store raw tokens — always store the hash
 *
 * @param {string} token
 * @returns {string} SHA-256 hash
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Cookie options for the refresh token
 *
 * httpOnly = JavaScript cannot access it (XSS protection)
 * secure  = HTTPS only in production
 * path    = sent to every route on the API
 *
 * sameSite — WHY IT IS 'none' IN PRODUCTION
 * -----------------------------------------
 * The API runs on `*.onrender.com` and the dashboards on `*.vercel.app`.
 * Those are DIFFERENT SITES as far as the browser is concerned (a site is
 * the registrable domain — the port does not matter), so a cross-site
 * `fetch()` from the dashboard to the API is a cross-site request.
 *
 *   SameSite=Strict -> the cookie is NOT sent on a cross-site request
 *   SameSite=Lax    -> the cookie is NOT sent on a cross-site request either
 *                      (only on top-level GET navigations)
 *   SameSite=None   -> the cookie IS sent, but the browser then REQUIRES
 *                      `Secure`, i.e. HTTPS
 *
 * So 'none' + Secure is the only combination that works once the API and the
 * dashboard are on different domains. In development both run on
 * `localhost` (same site, ports are irrelevant), so 'lax' is enough and
 * 'none' cannot be used because there is no HTTPS on http://localhost.
 *
 * Because 'none' removes the browser's built-in CSRF protection for this
 * cookie, the cookie-authenticated auth routes are guarded by
 * `middleware/csrf.middleware.js` (an Origin check).
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

/**
 * Options for CLEARING the refresh cookie.
 *
 * `res.clearCookie()` only removes a cookie when the attributes match the
 * ones it was set with. It also overrides `expires` with `maxAge` when
 * `maxAge` is present, which would make the "clear" set the cookie to live
 * for another 7 days instead of deleting it.
 *
 * Deriving this from `refreshTokenCookieOptions` (minus `maxAge`) means the
 * set and the clear can never drift apart.
 */
export const clearRefreshTokenCookieOptions = (() => {
  const { maxAge, ...rest } = refreshTokenCookieOptions;
  return rest;
})();