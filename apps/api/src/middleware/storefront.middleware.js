import Store from '../models/tenant/Store.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Storefront Tenant Resolver
 *
 * Unlike tenantMiddleware (which uses JWT), this resolves
 * the store from the URL slug since storefront is public.
 *
 * Attaches:
 * - req.store → The store document
 *
 * Throws 404 if store doesn't exist or is not accessible.
 */
export const storefrontTenant = asyncHandler(async (req, res, next) => {
  const { storeSlug } = req.params;

  if (!storeSlug) {
    throw new ApiError(400, 'Store slug is required', 'NO_STORE_SLUG');
  }

  // Find the store by slug
  const store = await Store.findOne({ slug: storeSlug.toLowerCase() });

  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  // Block access to suspended or inactive stores
  if (store.status === 'suspended') {
    throw new ApiError(
      403,
      'This store is currently unavailable',
      'STORE_SUSPENDED'
    );
  }

  if (store.status === 'inactive') {
    throw new ApiError(
      404,
      'Store not found',
      'STORE_NOT_FOUND'
    );
  }

  // Note: We allow 'setup' status so merchants can preview their store
  // while still configuring it

  // Attach to request
  req.store = store;
  next();
});

export default storefrontTenant;