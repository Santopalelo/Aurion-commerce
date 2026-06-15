import Store from '../models/tenant/Store.model.js';
import Role from '../models/auth/Role.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Tenant Middleware
 *
 * Resolves the store context for a merchant request.
 * Must run AFTER authMiddleware.
 *
 * Resolution strategy:
 * 1. If JWT has storeId → Use that store
 * 2. Else → Use user's first active store
 * 3. Else → Throw 403 (user has no store yet)
 *
 * Attaches to request:
 * - req.store      → The store document
 * - req.userRole   → The user's role in this store (with permissions)
 * - req.storeAccess → The full storeAccess entry
 */
export const tenantMiddleware = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(
      401,
      'Authentication required',
      'NO_USER'
    );
  }

  // ============================================
  // Step 1: Determine which store to use
  // ============================================
  let targetStoreId = null;

  // Priority 1: storeId from JWT (set during login or store switch)
  if (req.tokenData && req.tokenData.storeId) {
    targetStoreId = req.tokenData.storeId;
  }

  // Priority 2: storeId from X-Store-Id header (for store switching)
  if (!targetStoreId && req.headers['x-store-id']) {
    targetStoreId = req.headers['x-store-id'];
  }

  // Priority 3: First active store in user's storeAccess[]
  if (!targetStoreId) {
    const firstActiveAccess = req.user.storeAccess?.find(
      (access) => access.status === 'active'
    );

    if (firstActiveAccess) {
      targetStoreId = firstActiveAccess.store;
    }
  }

  // ============================================
  // Step 2: User has no store → block them
  // ============================================
  if (!targetStoreId) {
    throw new ApiError(
      403,
      'You need to create a store first',
      'NO_STORE_ACCESS'
    );
  }

  // ============================================
  // Step 3: Verify the user has access to this store
  // ============================================
  const storeAccess = req.user.storeAccess?.find(
    (access) =>
      access.store.toString() === targetStoreId.toString() &&
      access.status === 'active'
  );

  if (!storeAccess) {
    throw new ApiError(
      403,
      'You do not have access to this store',
      'STORE_ACCESS_DENIED'
    );
  }

  // ============================================
  // Step 4: Load the store document
  // ============================================
  const store = await Store.findById(targetStoreId);

  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  // ============================================
  // Step 5: Check store status
  // ============================================
  if (store.status === 'suspended') {
    throw new ApiError(
      403,
      'This store has been suspended',
      'STORE_SUSPENDED'
    );
  }

  // ============================================
  // Step 6: Load the user's role for this store
  // ============================================
  const role = await Role.findById(storeAccess.role);

  if (!role) {
    throw new ApiError(
      403,
      'Your role in this store could not be loaded',
      'ROLE_NOT_FOUND'
    );
  }

  // ============================================
  // Step 7: Attach everything to the request
  // ============================================
  req.store = store;
  req.userRole = role;
  req.storeAccess = storeAccess;

  next();
});

/**
 * Optional Tenant Middleware
 * Like tenantMiddleware but does not throw if user has no store
 * Useful for endpoints that work both with and without store context
 */
export const optionalTenantMiddleware = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    let targetStoreId = req.tokenData?.storeId || req.headers['x-store-id'];

    if (!targetStoreId) {
      const firstActiveAccess = req.user.storeAccess?.find(
        (access) => access.status === 'active'
      );
      if (firstActiveAccess) {
        targetStoreId = firstActiveAccess.store;
      }
    }

    if (!targetStoreId) return next();

    const storeAccess = req.user.storeAccess?.find(
      (access) =>
        access.store.toString() === targetStoreId.toString() &&
        access.status === 'active'
    );

    if (!storeAccess) return next();

    const store = await Store.findById(targetStoreId);
    if (!store || store.status === 'suspended') return next();

    const role = await Role.findById(storeAccess.role);
    if (!role) return next();

    req.store = store;
    req.userRole = role;
    req.storeAccess = storeAccess;
  } catch (error) {
    // Silently fail — just continue without store context
  }

  next();
});