import stripe from '../../config/stripe.js';
import { env } from '../../config/env.js';
import Order from '../../models/orders/Order.model.js';
import Payment from '../../models/payments/Payment.model.js';
import CheckoutSession from '../../models/checkout/CheckoutSession.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { fromStripeAmount } from '../../utils/currency.js';
import {
  finalizeCheckout,
  findSessionByPaymentIntent,
  findSessionByMetadata,
} from '../../services/checkout.service.js';

/**
 * Stripe Webhook Controller
 *
 * Stripe can PUSH events to this server. That is the only way our database
 * learns about a payment without relying on the customer's browser to tell us.
 *
 * Without it:
 *   - Customer pays, then closes the browser  ->  money taken, no order.
 *   - Slow payment method (bank debit)         ->  status is "processing",
 *                                                not "succeeded", so the
 *                                                browser never creates the order.
 *
 * SECURITY
 * ---------
 * Every event is signed by Stripe with a shared secret. We verify that
 * signature against the RAW request body before trusting anything in it.
 * If the secret is not configured we refuse the event (fail closed) rather
 * than accept unverified data.
 */

/**
 * Verify the Stripe signature on a raw request body.
 *
 * @param {Buffer} rawBody - The unparsed request body
 * @param {string} signature - The `stripe-signature` header
 * @returns {object} The verified Stripe event
 */
const verifySignature = (rawBody, signature) => {
  if (!stripe) {
    throw new ApiError(
      503,
      'Stripe is not configured on this server',
      'STRIPE_NOT_CONFIGURED'
    );
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(
      503,
      'Stripe webhook secret is not configured',
      'WEBHOOK_SECRET_MISSING'
    );
  }

  if (!signature) {
    throw new ApiError(
      400,
      'Missing stripe-signature header',
      'MISSING_SIGNATURE'
    );
  }

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    // Stripe throws when the body was tampered with, or the secret is wrong.
    throw new ApiError(
      400,
      `Webhook signature verification failed: ${error.message}`,
      'INVALID_SIGNATURE'
    );
  }
};

/**
 * Handle `payment_intent.succeeded`.
 *
 * This is the event that actually creates the order. It runs the SAME code
 * the browser runs, so whichever arrives first wins and the other is a no-op.
 */
const handlePaymentSucceeded = async (paymentIntent) => {
  const checkoutSession =
    (await findSessionByMetadata(paymentIntent)) ||
    (await findSessionByPaymentIntent(paymentIntent.id));

  if (!checkoutSession) {
    // Nothing to do — the payment was not started by our checkout flow
    // (e.g. a manual PaymentIntent created in the Stripe dashboard).
    console.warn(
      `⚠️  No checkout session for payment intent ${paymentIntent.id} — nothing to finalize`
    );
    return;
  }

  const order = await finalizeCheckout({
    checkoutSession,
    paymentIntent,
  });

  console.log(
    `✅ Order ${order.orderNumber} finalized from webhook (payment intent ${paymentIntent.id})`
  );
};

/**
 * Handle `payment_intent.processing` — slow payment methods (bank debit,
 * 3D Secure, etc.) that will settle later.
 */
const handlePaymentProcessing = async (paymentIntent) => {
  const checkoutSession =
    (await findSessionByMetadata(paymentIntent)) ||
    (await findSessionByPaymentIntent(paymentIntent.id));

  if (!checkoutSession || checkoutSession.status === 'completed') return;

  checkoutSession.status = 'pending';
  await checkoutSession.save();
};

/**
 * Handle `payment_intent.payment_failed` / `payment_intent.canceled`.
 */
const handlePaymentFailed = async (paymentIntent, reason) => {
  const checkoutSession =
    (await findSessionByMetadata(paymentIntent)) ||
    (await findSessionByPaymentIntent(paymentIntent.id));

  if (!checkoutSession || checkoutSession.status === 'completed') return;

  checkoutSession.markFailed(
    reason.code || 'payment_failed',
    reason.message || 'Payment failed'
  );
  await checkoutSession.save();
};

/**
 * Handle `charge.refunded` — keep the order in sync with the money.
 */
const handleChargeRefunded = async (charge) => {
  const order = await Order.findOne({
    'payment.stripeChargeId': charge.id,
  });

  if (!order) return;

  // Idempotency — a refund event can be delivered more than once
  if (order.paymentStatus === 'refunded') return;

  const refundedAmount =
    charge.amount_refunded > 0
      ? fromStripeAmount(charge.amount_refunded, charge.currency)
      : fromStripeAmount(charge.amount, charge.currency);

  order.paymentStatus = 'refunded';
  order.status = 'refunded';
  order.payment.refundedAmount = refundedAmount;
  order.addStatusChange(
    'payment',
    order.paymentStatus,
    'refunded',
    `Refund of ${refundedAmount} processed by Stripe`
  );
  await order.save();

  // Mark the Payment record as refunded too
  await Payment.updateMany(
    { 'stripe.chargeId': charge.id },
    {
      status: 'refunded',
      refundedAt: new Date(),
    }
  );
};

/**
 * @route   POST /api/v1/webhooks/stripe
 * @desc    Receive Stripe events (payment succeeded, failed, refunded...)
 * @access  Public — authenticity is proven by the Stripe signature
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const event = verifySignature(req.body, req.headers['stripe-signature']);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'payment_intent.processing':
      await handlePaymentProcessing(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object, {
        code: event.data.object.last_payment_error?.code,
        message: event.data.object.last_payment_error?.message,
      });
      break;

    case 'payment_intent.canceled':
      await handlePaymentFailed(event.data.object, {
        code: 'payment_canceled',
        message: 'Payment was canceled',
      });
      break;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;

    default:
      // Unhandled events are acknowledged so Stripe stops retrying them
      console.log(`ℹ️  Ignoring unhandled Stripe event: ${event.type}`);
      break;
  }

  return res.status(200).json(
    ApiResponse.success('Webhook processed', {
      eventId: event.id,
      type: event.type,
    })
  );
});
