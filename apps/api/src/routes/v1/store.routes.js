import express from 'express';
import {
  createStore,
  getMyStore,
  updateMyStore,
  checkSlugAvailability,
} from '../../controllers/merchant/store.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
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

export default router;