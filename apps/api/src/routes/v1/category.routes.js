import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryImage,
} from '../../controllers/merchant/category.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { uploadSingle } from '../../middleware/upload.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../../validators/category.validator.js';

const router = express.Router();

// All category routes require auth + tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// GET /api/v1/categories — List categories
// ============================================
router.get(
  '/',
  requirePermission('categories:read'),
  getCategories
);

// ============================================
// GET /api/v1/categories/:id — Get single category
// ============================================
router.get(
  '/:id',
  requirePermission('categories:read'),
  getCategoryById
);

// ============================================
// POST /api/v1/categories — Create category
// Form data: name, description, parent, displayOrder, image (file)
// ============================================
router.post(
  '/',
  requirePermission('categories:create'),
  uploadSingle('image'),
  validate(createCategorySchema),
  createCategory
);

// ============================================
// PUT /api/v1/categories/:id — Update category
// ============================================
router.put(
  '/:id',
  requirePermission('categories:update'),
  uploadSingle('image'),
  validate(updateCategorySchema),
  updateCategory
);

// ============================================
// DELETE /api/v1/categories/:id — Delete category
// ============================================
router.delete(
  '/:id',
  requirePermission('categories:delete'),
  deleteCategory
);

// ============================================
// DELETE /api/v1/categories/:id/image — Remove image only
// ============================================
router.delete(
  '/:id/image',
  requirePermission('categories:update'),
  deleteCategoryImage
);

export default router;