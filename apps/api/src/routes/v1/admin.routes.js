import express from 'express';
import {
  getDashboard,
  getAllStores,
  getStoreDetail,
  updateStoreStatus,
  getAllUsers,
  suspendUser,
  unsuspendUser,
  getRevenueAnalytics,
  createAdmin,
} from '../../controllers/admin/admin.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { adminOnly } from '../../middleware/admin.middleware.js';

const router = express.Router();

// ALL admin routes require: authenticated + platform_admin role
router.use(authMiddleware);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Stores
router.get('/stores', getAllStores);
router.get('/stores/:id', getStoreDetail);
router.put('/stores/:id/status', updateStoreStatus);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);

// Admin management
router.post('/create-admin', createAdmin);

export default router;