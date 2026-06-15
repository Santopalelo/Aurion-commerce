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
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES,
    }
  );
};

/**
 * Generate both tokens at once
 *
 * @param {string} userId
 * @param {string} [storeId]
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateAuthTokens = (userId, storeId = null) => {
  return {
    accessToken: generateAccessToken(userId, storeId),
    refreshToken: generateRefreshToken(userId),
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
 * httpOnly = JavaScript cannot access (XSS protection)
 * secure = HTTPS only in production
 * sameSite = CSRF protection
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};