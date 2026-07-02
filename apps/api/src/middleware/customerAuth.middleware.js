import jwt from 'jsonwebtoken';
import Customer from '../models/customers/Customer.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * Customer Authentication Middleware
 *
 * Verifies customer JWT token and loads customer.
 * Must run AFTER storefrontTenant middleware.
 * Attaches req.customer
 */
export const customerAuthMiddleware = asyncHandler(async (req, res, next) => {
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

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired', 'TOKEN_EXPIRED');
    }
    throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN');
  }

  // Must be customer token
  if (decoded.type !== 'customer') {
    throw new ApiError(401, 'Invalid token type', 'INVALID_TOKEN_TYPE');
  }

  // Verify customer belongs to this store
  if (decoded.storeId !== req.store._id.toString()) {
    throw new ApiError(
      403,
      'Token does not match this store',
      'STORE_MISMATCH'
    );
  }

  // Load customer
  const customer = await Customer.findById(decoded.customerId);

  if (!customer) {
    throw new ApiError(401, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  if (customer.status === 'blocked') {
    throw new ApiError(403, 'Account is blocked', 'ACCOUNT_BLOCKED');
  }

  // Attach to request
  req.customer = customer;
  next();
});