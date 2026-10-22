import Order from '../../models/orders/Order.model.js';
import stripe from '../../config/stripe.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  finalizeCheckout,
  findSessionByMetadata,
  findSessionByPaymentIntent,
} from '../../services/checkout.service.js';

/**
 * @route   POST /api/v1/storefront/:storeSlug/orders/create
 * @desc    Create an order after successful Stripe payment
 * @access  Public
 *
 * This is a THIN wrapper around `checkout.service.finalizeCheckout`.
 *
 * The order data comes from the server-side CheckoutSession (created when the
 * payment intent was made) — NOT from this request body. A client therefore
 * cannot change prices, products or totals by tampering with the payload.
 *
 * It is also safe to call this repeatedly: the service is idempotent, and the
 * Stripe webhook calls the exact same code path. Whichever arrives first
 * creates the order; the other one returns that same order.
 *
 * Body:
 *   paymentIntentId: string (from Stripe)
 *   notes: string (optional)
 *   billingAddress: { ... } (optional, defaults to the shipping address)
 */
export const createOrder = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(500, 'Payment system not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const { store } = req;
  const { paymentIntentId, notes, billingAddress } = req.body;

  // ============================================
  // Step 1: Validate input
  // ============================================
  if (!paymentIntentId) {
    throw new ApiError(400, 'Payment intent ID is required', 'NO_PAYMENT_INTENT');
  }

  // ============================================
  // Step 2: Verify payment with Stripe
  // (CRITICAL: Always verify on server before creating order!)
  // ============================================
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }

  // Verify the payment belongs to this store
  if (paymentIntent.metadata?.storeId !== store._id.toString()) {
    throw new ApiError(403, 'Payment does not match this store', 'STORE_MISMATCH');
  }

  // Check payment status
  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(
      400,
      `Payment not completed. Status: ${paymentIntent.status}`,
      'PAYMENT_NOT_COMPLETED'
    );
  }

  // ============================================
  // Step 3: Find the server-side cart for this payment
  // ============================================
  const checkoutSession =
    (await findSessionByMetadata(paymentIntent)) ||
    (await findSessionByPaymentIntent(paymentIntentId));

  if (!checkoutSession) {
    throw new ApiError(
      404,
      'No checkout found for this payment. If you were charged, contact support.',
      'CHECKOUT_SESSION_NOT_FOUND'
    );
  }

  // ============================================
  // Step 4: Merge in what the browser knows and the intent did not
  // (the order note and a separate billing address)
  // ============================================
  if (notes) {
    checkoutSession.notes = notes;
  }

  if (billingAddress?.line1) {
    checkoutSession.billingAddress = {
      firstName: billingAddress.firstName || checkoutSession.customer.firstName,
      line1: billingAddress.line1,
      line2: billingAddress.line2 || '',
      city: billingAddress.city,
      state: billingAddress.state || '',
      country: billingAddress.country || 'US',
      zipCode: billingAddress.zipCode,
      sameAsShipping: false,
    };
  }

  await checkoutSession.save();

  // ============================================
  // Step 5: Create the order
  // (shared with the Stripe webhook — idempotent)
  // ============================================
  const order = await finalizeCheckout({
    checkoutSession,
    paymentIntent,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // ============================================
  // Step 6: Return order details
  // ============================================
  return res.status(201).json(
    ApiResponse.success('Order created successfully', {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.pricing.total,
        currency: order.pricing.currency,
        items: order.items.length,
        customerEmail: order.customerSnapshot.email,
        createdAt: order.createdAt,
      },
    })
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/orders/:orderNumber
 * @desc    Get order details by order number (for success page)
 * @access  Public (limited info)
 */
export const getOrderByNumber = asyncHandler(async (req, res) => {
  const { store } = req;
  const { orderNumber } = req.params;
  const { email } = req.query;

  if (!email) {
    throw new ApiError(400, 'Email is required to view order', 'NO_EMAIL');
  }

  const order = await Order.findOne({
    store: store._id,
    orderNumber: orderNumber.toUpperCase(),
    'customerSnapshot.email': email.toLowerCase(),
  });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  // Return public-safe order data
  return res.status(200).json(
    ApiResponse.success('Order retrieved', {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        items: order.items,
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        customerSnapshot: order.customerSnapshot,
        shipping: order.shipping,
        createdAt: order.createdAt,
      },
    })
  );
});
