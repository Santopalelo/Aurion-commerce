import User from '../../models/auth/User.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  generateAuthTokens,
  verifyRefreshToken,
  generateAccessToken,
  refreshTokenCookieOptions,
} from '../../utils/generateToken.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../services/email.service.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new merchant
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // ============================================
  // Check if user already exists
  // ============================================
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      409,
      'An account with this email already exists',
      'EMAIL_EXISTS'
    );
  }

  // ============================================
  // Create the user
  // (password gets hashed automatically by pre-save hook)
  // ============================================
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    platformRole: 'merchant',
  });

  // ============================================
  // Generate tokens
  // ============================================
  const { accessToken, refreshToken } = generateAuthTokens(user._id);

  // ============================================
  // Set refresh token in httpOnly cookie
  // ============================================
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  // ============================================
  // Update login tracking
  // ============================================
  user.lastLoginAt = new Date();
  user.loginCount = 1;
  user.lastLoginIp = req.ip;
  await user.save();

  // ============================================
  // Return response (without password)
  // ============================================
  const userResponse = user.toObject();
  delete userResponse.password;

  return res.status(201).json(
    ApiResponse.success('Account created successfully', {
      user: userResponse,
      accessToken,
      // We don't return refreshToken in body — it's in the cookie
    })
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Log in a user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ============================================
  // Find user (must include password field)
  // ============================================
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(
      401,
      'Invalid email or password',
      'INVALID_CREDENTIALS'
    );
  }

  // ============================================
  // Check user status
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
      `Your account has been suspended. Reason: ${user.suspendedReason || 'Contact support'}`,
      'ACCOUNT_SUSPENDED'
    );
  }

  // ============================================
  // Verify password
  // ============================================
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(
      401,
      'Invalid email or password',
      'INVALID_CREDENTIALS'
    );
  }

  // ============================================
  // Generate tokens
  // ============================================
  const { accessToken, refreshToken } = generateAuthTokens(user._id);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  // ============================================
  // Update login tracking
  // ============================================
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  user.lastLoginIp = req.ip;
  await user.save();

  // ============================================
  // Return response
  // ============================================
  const userResponse = user.toObject();
  delete userResponse.password;

  return res.status(200).json(
    ApiResponse.success('Logged in successfully', {
      user: userResponse,
      accessToken,
    })
  );
});

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public (requires refresh token cookie)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // ============================================
  // Get refresh token from cookie
  // ============================================
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(
      401,
      'No refresh token provided',
      'NO_REFRESH_TOKEN'
    );
  }

  // ============================================
  // Verify refresh token
  // ============================================
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new ApiError(
      401,
      'Invalid or expired refresh token',
      'INVALID_REFRESH_TOKEN'
    );
  }

  if (decoded.type !== 'refresh') {
    throw new ApiError(401, 'Invalid token type', 'INVALID_TOKEN_TYPE');
  }

  // ============================================
  // Verify user still exists and is active
  // ============================================
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive || user.isSuspended) {
    throw new ApiError(401, 'User account is not accessible', 'USER_INACCESSIBLE');
  }

  // ============================================
  // Generate new access token
  // ============================================
  const newAccessToken = generateAccessToken(user._id);

  return res.status(200).json(
    ApiResponse.success('Token refreshed successfully', {
      accessToken: newAccessToken,
    })
  );
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out the user
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // ============================================
  // Clear the refresh token cookie
  // ============================================
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: refreshTokenCookieOptions.sameSite,
    secure: refreshTokenCookieOptions.secure,
    path: '/',
  });

  // TODO: Add token to blacklist in Redis
  // For now, just clearing the cookie is enough

  return res
    .status(200)
    .json(ApiResponse.success('Logged out successfully'));
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already loaded by authMiddleware
  return res.status(200).json(
    ApiResponse.success('User retrieved successfully', {
      user: req.user,
    })
  );
/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required', 'NO_EMAIL');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success (prevent email enumeration attacks)
  if (!user) {
    return res.status(200).json(
      ApiResponse.success(
        'If an account exists with that email, a reset link has been sent.'
      )
    );
  }

  // Generate reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Save hashed token + expiry (1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // Send email
  try {
    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetToken: rawToken,
    });
  } catch (error) {
    // If email fails, clear the token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    throw new ApiError(
      500,
      'Could not send reset email. Please try again.',
      'EMAIL_SEND_FAILED'
    );
  }

  return res.status(200).json(
    ApiResponse.success(
      'If an account exists with that email, a reset link has been sent.'
    )
  );
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token) throw new ApiError(400, 'Token is required', 'NO_TOKEN');
  if (!password) throw new ApiError(400, 'Password is required', 'NO_PASSWORD');
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters', 'PASSWORD_TOO_SHORT');
  }

  // Hash the incoming token to match what's stored
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new ApiError(
      400,
      'Invalid or expired reset link. Please request a new one.',
      'INVALID_TOKEN'
    );
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  return res.status(200).json(
    ApiResponse.success('Password reset successfully. You can now log in.')
  );
});

/**
 * @route   POST /api/v1/auth/verify-reset-token
 * @desc    Verify a reset token is still valid (used before showing the form)
 * @access  Public
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(200).json(
      ApiResponse.success('Token check completed', { valid: false })
    );
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('email firstName');

  return res.status(200).json(
    ApiResponse.success('Token check completed', {
      valid: !!user,
      email: user?.email,
    })
  );
});
});