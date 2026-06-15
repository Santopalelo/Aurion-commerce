import mongoose from 'mongoose';
import Store from '../../models/tenant/Store.model.js';
import User from '../../models/auth/User.model.js';
import Subscription from '../../models/platform/Subscription.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { generateUniqueSlug } from '../../utils/slugify.js';
import { seedDefaultRoles } from '../../utils/seedDefaultRoles.js';

/**
 * @route   POST /api/v1/stores
 * @desc    Create a new store (onboarding)
 * @access  Private (authenticated users)
 */
export const createStore = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description, currency, language, timezone, business, contact } = req.body;

  // ============================================
  // Check if user already has a store
  // (For MVP, one merchant = one store. We can lift this limit later.)
  // ============================================
  const existingStore = await Store.findOne({ owner: userId });
  if (existingStore) {
    throw new ApiError(
      409,
      'You already have a store. You can only own one store on this plan.',
      'STORE_EXISTS',
      { storeId: existingStore._id, storeSlug: existingStore.slug }
    );
  }

  // ============================================
  // Generate unique slug from store name
  // ============================================
  const slug = await generateUniqueSlug(name, Store, 'slug');

  // ============================================
  // Start MongoDB transaction
  // (Atomic — all operations succeed OR all fail)
  // ============================================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ============================================
    // Step 1: Create the store
    // ============================================
    const storeData = {
      name,
      slug,
      description,
      owner: userId,
      currency: currency || 'USD',
      currencySymbol: getCurrencySymbol(currency || 'USD'),
      language: language || 'en',
      timezone: timezone || 'UTC',
      status: 'setup',
      plan: 'free',
      planStatus: 'trialing',
      domain: {
        subdomain: slug,
      },
    };

    if (business) storeData.business = business;
    if (contact) storeData.contact = contact;

    const [store] = await Store.create([storeData], { session });

    // ============================================
    // Step 2: Create default roles for the store
    // ============================================
    const roles = await seedDefaultRoles(store._id, userId, session);

    // ============================================
    // Step 3: Add user as Owner in their storeAccess[]
    // ============================================
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          storeAccess: {
            store: store._id,
            role: roles.owner._id,
            status: 'active',
            joinedAt: new Date(),
          },
        },
      },
      { session }
    );

    // ============================================
    // Step 4: Create free subscription for the store
    // ============================================
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    await Subscription.create(
      [
        {
          store: store._id,
          owner: userId,
          plan: 'free',
          billingCycle: 'monthly',
          price: 0,
          currency: store.currency,
          limits: {
            products: 10,
            staff: 1,
            storageMB: 500,
            transactionFeePercent: 2,
            customDomain: false,
            removeAurionBranding: false,
            advancedAnalytics: false,
            multiCurrency: false,
            apiAccess: false,
            prioritySupport: false,
          },
          status: 'trialing',
          trialStartedAt: new Date(),
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
          planHistory: [
            {
              plan: 'free',
              billingCycle: 'monthly',
              price: 0,
              reason: 'initial',
              changedBy: userId,
            },
          ],
        },
      ],
      { session }
    );

    // ============================================
    // Commit the transaction
    // ============================================
    await session.commitTransaction();
    session.endSession();

    // ============================================
    // Return the created store
    // ============================================
    return res.status(201).json(
      ApiResponse.success('Store created successfully', {
        store,
        ownerRole: roles.owner,
      })
    );
  } catch (error) {
    // ============================================
    // Rollback on any error
    // ============================================
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @route   GET /api/v1/stores/my-store
 * @desc    Get the current user's store
 * @access  Private
 */
export const getMyStore = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const store = await Store.findOne({ owner: userId }).populate('activeTheme');

  if (!store) {
    throw new ApiError(
      404,
      'You have not created a store yet',
      'NO_STORE'
    );
  }

  // Also load subscription info
  const subscription = await Subscription.findOne({ store: store._id });

  return res.status(200).json(
    ApiResponse.success('Store retrieved successfully', {
      store,
      subscription,
    })
  );
});

/**
 * @route   PUT /api/v1/stores/my-store
 * @desc    Update the current user's store
 * @access  Private (owner only)
 */
export const updateMyStore = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const store = await Store.findOne({ owner: userId });
  if (!store) {
    throw new ApiError(404, 'Store not found', 'NO_STORE');
  }

  // Update only allowed fields (slug, owner, plan cannot be updated this way)
  const allowedFields = [
    'name', 'description', 'currency', 'currencySymbol', 'language',
    'timezone', 'weightUnit', 'business', 'contact', 'social',
    'policies', 'seo',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      store[field] = req.body[field];
    }
  });

  // Auto-update currency symbol when currency changes
  if (req.body.currency && !req.body.currencySymbol) {
    store.currencySymbol = getCurrencySymbol(req.body.currency);
  }

  await store.save();

  return res.status(200).json(
    ApiResponse.success('Store updated successfully', { store })
  );
});

/**
 * @route   GET /api/v1/stores/check-slug/:slug
 * @desc    Check if a store slug is available
 * @access  Public
 */
export const checkSlugAvailability = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug || slug.length < 2) {
    throw new ApiError(400, 'Slug must be at least 2 characters', 'INVALID_SLUG');
  }

  // Check format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(200).json(
      ApiResponse.success('Slug check completed', {
        slug,
        available: false,
        reason: 'Slug can only contain lowercase letters, numbers, and hyphens',
      })
    );
  }

  // Check reserved words
  const reserved = ['admin', 'api', 'www', 'mail', 'app', 'aurion', 'shop', 'store', 'help', 'support'];
  if (reserved.includes(slug)) {
    return res.status(200).json(
      ApiResponse.success('Slug check completed', {
        slug,
        available: false,
        reason: 'This slug is reserved',
      })
    );
  }

  const existing = await Store.findOne({ slug });

  return res.status(200).json(
    ApiResponse.success('Slug check completed', {
      slug,
      available: !existing,
    })
  );
});

// ============================================
// HELPER: Get currency symbol
// ============================================
function getCurrencySymbol(currencyCode) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    NGN: '₦',
    KES: 'KSh',
    ZAR: 'R',
    GHS: '₵',
    CAD: 'CA$',
    AUD: 'A$',
    BRL: 'R$',
    MXN: 'MX$',
  };
  return symbols[currencyCode] || currencyCode;
}