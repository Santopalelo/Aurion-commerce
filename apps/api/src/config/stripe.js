import Stripe from 'stripe';
import { env } from './env.js';

/**
 * Stripe Configuration
 *
 * Initialized once at server startup.
 * Used by payment controllers to create Payment Intents,
 * handle webhooks, manage subscriptions, etc.
 */

let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: false,
  });
  console.log('✅ Stripe configured');
} else {
  console.warn(
    '⚠️  STRIPE_SECRET_KEY not set. Payment processing will not work.'
  );
}

export default stripe;