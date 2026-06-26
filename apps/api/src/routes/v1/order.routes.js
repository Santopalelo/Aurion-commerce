import express from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateFulfillment,
  addOrderNote,
  cancelOrder,
  getOrderStats,
} from '../../controllers/merchant/order.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  updateOrderStatusSchema,
  updateFulfillmentSchema,
  addOrderNoteSchema,
  cancelOrderSchema,
} from '../../validators/order.validator.js';

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

// List orders
router.get('/', requirePermission('orders:read'), getOrders);

// Get order stats
router.get('/stats/overview', requirePermission('orders:read'), getOrderStats);

// Get single order
router.get('/:id', requirePermission('orders:read'), getOrderById);

// Update status
router.put(
  '/:id/status',
  requirePermission('orders:update'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Update fulfillment
router.put(
  '/:id/fulfillment',
  requirePermission('orders:update'),
  validate(updateFulfillmentSchema),
  updateFulfillment
);

// Add note
router.post(
  '/:id/notes',
  requirePermission('orders:update'),
  validate(addOrderNoteSchema),
  addOrderNote
);

// Cancel order
router.post(
  '/:id/cancel',
  requirePermission('orders:update'),
  validate(cancelOrderSchema),
  cancelOrder
);

export default router;