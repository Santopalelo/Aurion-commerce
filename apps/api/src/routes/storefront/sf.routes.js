import express from 'express';
import rateLimit from 'express-rate-limit';
import { storefrontTenant } from '../../middleware/storefront.middleware.js';
import { env } from '../../config/env.js';
import { getStoreInfo } from '../../controllers/storefront/sf.store.controller.js';
import {
  getStorefrontProducts,
  getStorefrontProduct,
} from '../../controllers/storefront/sf.product.controller.js';
import {
  getStorefrontCategories,
  getStorefrontCategory,
} from '../../controllers/storefront/sf.category.controller.js';
import { validateDiscountCode } from '../../controllers/storefront/sf.discount.controller.js';

const router = express.Router();

// ============================================
// RATE LIMITING (DDoS protection for public API)
// ============================================
const storefrontLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.RATE_LIMIT_STOREFRONT_MAX, // 120 requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to read-only storefront routes (per-route, so it
// does not stack with the stricter payment/order/customer limiters).
// See BUG-020.

// ============================================
// All routes require resolving the store first
// ============================================

// Store info
// GET /api/v1/storefront/:storeSlug
router.get('/:storeSlug', storefrontLimiter, storefrontTenant, getStoreInfo);

// Products
// GET /api/v1/storefront/:storeSlug/products
router.get('/:storeSlug/products', storefrontLimiter, storefrontTenant, getStorefrontProducts);

// GET /api/v1/storefront/:storeSlug/products/:productSlug
router.get(
  '/:storeSlug/products/:productSlug',
  storefrontLimiter,
  storefrontTenant,
  getStorefrontProduct
);

// Categories
// GET /api/v1/storefront/:storeSlug/categories
router.get('/:storeSlug/categories', storefrontLimiter, storefrontTenant, getStorefrontCategories);

// GET /api/v1/storefront/:storeSlug/categories/:categorySlug
router.get(
  '/:storeSlug/categories/:categorySlug',
  storefrontLimiter,
  storefrontTenant,
  getStorefrontCategory
);

// Discount code preview
// POST /api/v1/storefront/:storeSlug/discount/validate
router.post(
  '/:storeSlug/discount/validate',
  storefrontLimiter,
  storefrontTenant,
  validateDiscountCode
);

export default router;