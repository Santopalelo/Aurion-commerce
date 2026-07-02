import jwt from 'jsonwebtoken';
import Customer from '../../models/customers/Customer.model.js';
import Order from '../../models/orders/Order.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';

/**
 * Generate JWT token for customer
 * (Separate token type from merchant tokens)
 */
const generateCustomerToken = (customerId, storeId) => {
  return jwt.sign(
    {
      customerId,
      storeId,
      type: 'customer',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '7d' } // Customers get longer sessions
  );
};

/**
 * @route   POST /api/v1/storefront/:storeSlug/customers/register
 * @desc    Register a new customer account
 * @access  Public
 */
export const registerCustomer = asyncHandler(async (req, res) => {
  const { store } = req;
  const { firstName, lastName, email, password, phone, acceptsMarketing } = req.body;

  // Check if customer already exists in THIS store
  const existing = await Customer.findOne({
    store: store._id,
    email: email.toLowerCase(),
  });

  if (existing) {
    // If they exist as guest, upgrade to registered
    if (existing.isGuest) {
      existing.password = password;
      existing.isGuest = false;
      existing.firstName = firstName;
      existing.lastName = lastName;
      if (phone) existing.phone = phone;
      if (acceptsMarketing !== undefined) existing.acceptsMarketing = acceptsMarketing;
      await existing.save();

      const token = generateCustomerToken(existing._id, store._id);

      const customerData = existing.toObject();
      delete customerData.password;

      return res.status(200).json(
        ApiResponse.success('Account upgraded from guest', {
          customer: customerData,
          token,
        })
      );
    }

    throw new ApiError(
      409,
      'An account with this email already exists at this store',
      'EMAIL_EXISTS'
    );
  }

  // Create new customer
  const customer = await Customer.create({
    store: store._id,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    password,
    acceptsMarketing: acceptsMarketing || false,
    isGuest: false,
    source: 'storefront',
  });

  // Generate token
  const token = generateCustomerToken(customer._id, store._id);

  // Update login stats
  customer.lastLoginAt = new Date();
  customer.loginCount = 1;
  await customer.save();

  // Return customer (without password)
  const customerData = customer.toObject();
  delete customerData.password;

  return res.status(201).json(
    ApiResponse.success('Account created successfully', {
      customer: customerData,
      token,
    })
  );
});

/**
 * @route   POST /api/v1/storefront/:storeSlug/customers/login
 * @desc    Log in as a customer
 * @access  Public
 */
export const loginCustomer = asyncHandler(async (req, res) => {
  const { store } = req;
  const { email, password } = req.body;

  // Find customer with password
  const customer = await Customer.findOne({
    store: store._id,
    email: email.toLowerCase(),
  }).select('+password');

  if (!customer) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (customer.status === 'blocked') {
    throw new ApiError(
      403,
      'Your account has been blocked. Please contact support.',
      'ACCOUNT_BLOCKED'
    );
  }

  if (customer.isGuest) {
    throw new ApiError(
      401,
      'Please create an account with this email first',
      'GUEST_CANNOT_LOGIN'
    );
  }

  if (!customer.password) {
    throw new ApiError(
      401,
      'Please reset your password to log in',
      'NO_PASSWORD_SET'
    );
  }

  // Verify password
  const isValid = await customer.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Update login tracking
  customer.lastLoginAt = new Date();
  customer.loginCount = (customer.loginCount || 0) + 1;
  await customer.save();

  // Generate token
  const token = generateCustomerToken(customer._id, store._id);

  const customerData = customer.toObject();
  delete customerData.password;

  return res.status(200).json(
    ApiResponse.success('Logged in successfully', {
      customer: customerData,
      token,
    })
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/customers/me
 * @desc    Get current customer's profile
 * @access  Private (customer auth)
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  // req.customer set by customerAuthMiddleware
  return res.status(200).json(
    ApiResponse.success('Profile retrieved', {
      customer: req.customer,
    })
  );
});

/**
 * @route   PUT /api/v1/storefront/:storeSlug/customers/me
 * @desc    Update customer profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer._id);

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  const { firstName, lastName, phone, acceptsMarketing } = req.body;

  if (firstName !== undefined) customer.firstName = firstName;
  if (lastName !== undefined) customer.lastName = lastName;
  if (phone !== undefined) customer.phone = phone;
  if (acceptsMarketing !== undefined) customer.acceptsMarketing = acceptsMarketing;

  await customer.save();

  const customerData = customer.toObject();
  delete customerData.password;

  return res.status(200).json(
    ApiResponse.success('Profile updated', { customer: customerData })
  );
});

/**
 * @route   PUT /api/v1/storefront/:storeSlug/customers/me/password
 * @desc    Change customer password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const customer = await Customer.findById(req.customer._id).select('+password');

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  // Verify current password
  const isValid = await customer.comparePassword(currentPassword);
  if (!isValid) {
    throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
  }

  // Update password (will be hashed by pre-save hook)
  customer.password = newPassword;
  await customer.save();

  return res.status(200).json(
    ApiResponse.success('Password updated successfully')
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/customers/me/orders
 * @desc    Get customer's order history
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { store, customer } = req;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find({
      store: store._id,
      customer: customer._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('orderNumber status paymentStatus fulfillmentStatus pricing items createdAt shipping')
      .lean(),
    Order.countDocuments({
      store: store._id,
      customer: customer._id,
    }),
  ]);

  return res.status(200).json(
    ApiResponse.success('Orders retrieved', orders, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/customers/me/addresses
 * @desc    Get customer's saved addresses
 * @access  Private
 */
export const getMyAddresses = asyncHandler(async (req, res) => {
  return res.status(200).json(
    ApiResponse.success('Addresses retrieved', {
      addresses: req.customer.addresses || [],
    })
  );
});

/**
 * @route   POST /api/v1/storefront/:storeSlug/customers/me/addresses
 * @desc    Add a new address
 * @access  Private
 */
export const addAddress = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer._id);

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  const newAddress = { ...req.body };

  // If this is the first address or marked as default, make sure it's the only default
  if (newAddress.isDefault || customer.addresses.length === 0) {
    customer.addresses.forEach((addr) => (addr.isDefault = false));
    newAddress.isDefault = true;
  }

  customer.addresses.push(newAddress);
  await customer.save();

  return res.status(201).json(
    ApiResponse.success('Address added', {
      addresses: customer.addresses,
    })
  );
});

/**
 * @route   DELETE /api/v1/storefront/:storeSlug/customers/me/addresses/:addressId
 * @desc    Delete an address
 * @access  Private
 */
export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const customer = await Customer.findById(req.customer._id);

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  const wasDefault = customer.addresses.find(
    (a) => a._id.toString() === addressId
  )?.isDefault;

  customer.addresses = customer.addresses.filter(
    (a) => a._id.toString() !== addressId
  );

  // If we deleted the default, make the first one default
  if (wasDefault && customer.addresses.length > 0) {
    customer.addresses[0].isDefault = true;
  }

  await customer.save();

  return res.status(200).json(
    ApiResponse.success('Address deleted', {
      addresses: customer.addresses,
    })
  );
});

/**
 * @route   PUT /api/v1/storefront/:storeSlug/customers/me/addresses/:addressId/default
 * @desc    Set an address as default
 * @access  Private
 */
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const customer = await Customer.findById(req.customer._id);

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  let found = false;
  customer.addresses.forEach((addr) => {
    if (addr._id.toString() === addressId) {
      addr.isDefault = true;
      found = true;
    } else {
      addr.isDefault = false;
    }
  });

  if (!found) {
    throw new ApiError(404, 'Address not found', 'ADDRESS_NOT_FOUND');
  }

  await customer.save();

  return res.status(200).json(
    ApiResponse.success('Default address updated', {
      addresses: customer.addresses,
    })
  );
});