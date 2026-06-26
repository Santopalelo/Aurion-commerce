import express from 'express';
import rateLimit from 'express-rate-limit';
import { storefrontTenant } from '../../middleware/storefront.middleware.js';
import {
  createPaymentIntent,
  verifyPayment,
} from '../../controllers/payments/stripe.controller.js';

const router = express.Router();

// Aggressive rate limiting on payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 payment attempts per minute per IP
  message: {
    success: false,
    message: 'Too many payment attempts. Please wait a moment.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(paymentLimiter);

// Create payment intent
router.post(
  '/:storeSlug/payment/create-intent',
  storefrontTenant,
  createPaymentIntent
);

// Verify payment status
router.post(
  '/:storeSlug/payment/verify',
  storefrontTenant,
  verifyPayment
);

export default router;