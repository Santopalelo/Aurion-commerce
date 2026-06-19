import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  updateProductStatus,
} from '../../controllers/merchant/product.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { uploadMultiple } from '../../middleware/upload.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../../validators/product.validator.js';

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

// List & search
router.get('/', requirePermission('products:read'), getProducts);

// Get single
router.get('/:id', requirePermission('products:read'), getProductById);

// Create (with up to 10 images)
router.post(
  '/',
  requirePermission('products:create'),
  uploadMultiple('images', 10),
  validate(createProductSchema),
  createProduct
);

// Update (with up to 10 new images)
router.put(
  '/:id',
  requirePermission('products:update'),
  uploadMultiple('images', 10),
  validate(updateProductSchema),
  updateProduct
);

// Delete
router.delete('/:id', requirePermission('products:delete'), deleteProduct);

// Duplicate
router.post('/:id/duplicate', requirePermission('products:create'), duplicateProduct);

// Quick status update
router.put('/:id/status', requirePermission('products:update'), updateProductStatus);

export default router;