import express from 'express';
import rateLimit from 'express-rate-limit';
import { storefrontTenant } from '../../middleware/storefront.middleware.js';
import { getStoreInfo } from '../../controllers/storefront/sf.store.controller.js';
import {
  getStorefrontProducts,
  getStorefrontProduct,
} from '../../controllers/storefront/sf.product.controller.js';
import {
  getStorefrontCategories,
  getStorefrontCategory,
} from '../../controllers/storefront/sf.category.controller.js';

const router = express.Router();

// ============================================
// RATE LIMITING (DDoS protection for public API)
// ============================================
const storefrontLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all storefront routes
router.use(storefrontLimiter);

// ============================================
// All routes require resolving the store first
// ============================================

// Store info
// GET /api/v1/storefront/:storeSlug
router.get('/:storeSlug', storefrontTenant, getStoreInfo);

// Products
// GET /api/v1/storefront/:storeSlug/products
router.get('/:storeSlug/products', storefrontTenant, getStorefrontProducts);

// GET /api/v1/storefront/:storeSlug/products/:productSlug
router.get(
  '/:storeSlug/products/:productSlug',
  storefrontTenant,
  getStorefrontProduct
);

// Categories
// GET /api/v1/storefront/:storeSlug/categories
router.get('/:storeSlug/categories', storefrontTenant, getStorefrontCategories);

// GET /api/v1/storefront/:storeSlug/categories/:categorySlug
router.get(
  '/:storeSlug/categories/:categorySlug',
  storefrontTenant,
  getStorefrontCategory
);

export default router;