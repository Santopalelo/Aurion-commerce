import express from 'express';
import {
  createStore,
  getMyStore,
  updateMyStore,
  checkSlugAvailability,
} from '../../controllers/merchant/store.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createStoreSchema,
  updateStoreSchema,
} from '../../validators/store.validator.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/v1/stores/check-slug/:slug — Check if a store slug is available
router.get('/check-slug/:slug', checkSlugAvailability);

// ============================================
// PROTECTED ROUTES (require auth)
// ============================================

// POST /api/v1/stores — Create a new store
router.post('/', authMiddleware, validate(createStoreSchema), createStore);

// GET /api/v1/stores/my-store — Get current user's store
router.get('/my-store', authMiddleware, getMyStore);

// PUT /api/v1/stores/my-store — Update current user's store
router.put('/my-store', authMiddleware, validate(updateStoreSchema), updateMyStore);

// ============================================
// TEST ROUTE — Verify middleware chain works
// (Remove this in production, just for testing)
// ============================================
router.get(
  '/test-middleware',
  authMiddleware,
  tenantMiddleware,
  requirePermission('store:manage'),
  (req, res) => {
    res.json({
      success: true,
      message: 'All middleware passed successfully!',
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          fullName: req.user.fullName,
        },
        store: {
          id: req.store._id,
          name: req.store.name,
          slug: req.store.slug,
        },
        role: {
          name: req.userRole.name,
          systemRoleType: req.userRole.systemRoleType,
          permissionsCount: req.userRole.permissions.length,
        },
      },
    });
  }
);

export default router;