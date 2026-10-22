import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '../../controllers/webhooks/stripe.webhook.controller.js';

const router = Router();

/**
 * Stripe Webhook Route
 *
 * IMPORTANT: this route uses `express.raw()` — the RAW body buffer, not JSON.
 *
 * Stripe signs the exact bytes it sent. If Express parses the body into a
 * JavaScript object first, the bytes are gone and the signature can never
 * match. So this router MUST be mounted BEFORE the global `express.json()`
 * middleware in app.js.
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json', limit: '1mb' }),
  handleStripeWebhook
);

export default router;
