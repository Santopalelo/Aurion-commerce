import express from 'express';
import rateLimit from 'express-rate-limit';
import { storefrontTenant } from '../../middleware/storefront.middleware.js';
import {
  createOrder,
  getOrderByNumber,
} from '../../controllers/storefront/sf.order.controller.js';

const router = express.Router();

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

router.use(orderLimiter);

// Create order after successful payment
router.post('/:storeSlug/orders/create', storefrontTenant, createOrder);

// Get order by number (requires email verification)
router.get(
  '/:storeSlug/orders/:orderNumber',
  storefrontTenant,
  getOrderByNumber
);

export default router;