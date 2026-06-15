import User from '../models/auth/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/generateToken.js';

/**
 * Authentication Middleware
 *
 * 1. Extracts JWT from Authorization header
 * 2. Verifies the token
 * 3. Loads the user from database
 * 4. Attaches user to req.user
 *
 * If token is missing/invalid/expired → throws 401 error
 */
export const authMiddleware = asyncHandler(async (req, res, next) => {
  // ============================================
  // Step 1: Extract token from Authorization header
  // ============================================
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(
      401,
      'Authentication required. Please log in.',
      'NO_TOKEN'
    );
  }

  // ============================================
  // Step 2: Verify the token
  // ============================================
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(
        401,
        'Session expired. Please log in again.',
        'TOKEN_EXPIRED'
      );
    }
    throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN');
  }

  // Ensure it's an access token (not refresh)
  if (decoded.type !== 'access') {
    throw new ApiError(401, 'Invalid token type', 'INVALID_TOKEN_TYPE');
  }

  // ============================================
  // Step 3: Load user from database
  // ============================================
  const user = await User.findById(decoded.userId).select(
    '-password -passwordResetToken -emailVerificationToken'
  );

  if (!user) {
    throw new ApiError(
      401,
      'User no longer exists',
      'USER_NOT_FOUND'
    );
  }

  // ============================================
  // Step 4: Check user status
  // ============================================
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account has been deactivated',
      'ACCOUNT_DEACTIVATED'
    );
  }

  if (user.isSuspended) {
    throw new ApiError(
      403,
      'Your account has been suspended',
      'ACCOUNT_SUSPENDED'
    );
  }

  // ============================================
  // Step 5: Check if password was changed after token was issued
  // ============================================
  if (user.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10
    );

    if (decoded.iat < passwordChangedTimestamp) {
      throw new ApiError(
        401,
        'Password was changed recently. Please log in again.',
        'PASSWORD_CHANGED'
      );
    }
  }

  // ============================================
  // Step 6: Attach user and tokenData to request
  // ============================================
  req.user = user;
  req.tokenData = decoded; // Contains userId, storeId, type, iat, exp

  next();
});

/**
 * Optional Auth Middleware
 * Like authMiddleware but does not throw if no token
 * Used for routes that work for both logged-in and guest users
 */
export const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(); // No token = continue as guest
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive && !user.isSuspended) {
      req.user = user;
      req.tokenData = decoded;
    }
  } catch (error) {
    // Silently fail — just continue as guest
  }

  next();
});

/**
 * Restrict to Platform Roles
 *
 * Usage:
 *   router.get('/admin', authMiddleware, restrictTo('platform_admin'), handler);
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required', 'NO_USER');
    }

    if (!allowedRoles.includes(req.user.platformRole)) {
      throw new ApiError(
        403,
        'You do not have permission to perform this action',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};