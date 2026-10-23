import Product from '../../models/catalog/Product.model.js';
import Store from '../../models/tenant/Store.model.js';
import CheckoutSession from '../../models/checkout/CheckoutSession.model.js';
import stripe from '../../config/stripe.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { toStripeAmount, fromStripeAmount } from '../../utils/currency.js';
import { calculateTotals } from '../../services/pricing.service.js';
import {
  getApplicableDiscount,
  calculateDiscount,
} from '../../services/discount.service.js';

/**
 * @route   POST /api/v1/storefront/:storeSlug/payment/create-intent
 * @desc    Create a Stripe Payment Intent for checkout
 * @access  Public
 *
 * Body:
 *   items: [{ productId, quantity }]
 *   shippingAddress: { ... }
 *   customer: { email, firstName, lastName, phone }
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(
      500,
      'Payment processing is not configured',
      'STRIPE_NOT_CONFIGURED'
    );
  }

  const { storeSlug } = req.params;
  const {
    items,
    customer,
    shippingAddress,
    billingAddress,
    notes,
    discountCode,
  } = req.body;

  // ============================================
  // Step 1: Validate input
  // ============================================
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'No items in cart', 'EMPTY_CART');
  }

  if (!customer?.email) {
    throw new ApiError(400, 'Customer email is required', 'NO_EMAIL');
  }

  if (!shippingAddress?.line1) {
    throw new ApiError(400, 'Shipping address is required', 'NO_ADDRESS');
  }

  // ============================================
  // Step 2: Find the store
  // ============================================
  const store = await Store.findOne({ slug: storeSlug.toLowerCase() });
  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  if (store.status === 'suspended') {
    throw new ApiError(403, 'This store is not accepting orders', 'STORE_SUSPENDED');
  }

  // ============================================
  // Step 3: Verify all products exist and calculate REAL totals
  // (NEVER trust prices from the frontend - always recalculate!)
  // ============================================
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    store: store._id,
    status: 'active',
  });

  if (products.length !== items.length) {
    throw new ApiError(
      400,
      'Some products are no longer available',
      'PRODUCTS_UNAVAILABLE'
    );
  }

  // Build line items with verified prices and check inventory
  const lineItems = [];
  let subtotal = 0;

  for (const cartItem of items) {
    const product = products.find(
      (p) => p._id.toString() === cartItem.productId
    );

    if (!product) {
      throw new ApiError(
        400,
        `Product ${cartItem.productId} not found`,
        'PRODUCT_NOT_FOUND'
      );
    }

    // Validate quantity
    const quantity = Number(cartItem.quantity);
    if (!quantity || quantity < 1) {
      throw new ApiError(400, 'Invalid quantity', 'INVALID_QUANTITY');
    }

    // Check inventory (unless backorders are allowed)
    if (
      product.trackInventory &&
      !product.allowBackorder &&
      product.inventoryQuantity < quantity
    ) {
      throw new ApiError(
        400,
        `Only ${product.inventoryQuantity} of "${product.title}" available`,
        'INSUFFICIENT_INVENTORY',
        { productId: product._id, available: product.inventoryQuantity }
      );
    }

    const itemTotal = product.price * quantity;
    subtotal += itemTotal;

    // Primary image, used in the order snapshot and the cart UI
    const primaryImage =
      product.images?.find((img) => img.isPrimary) || product.images?.[0];

    lineItems.push({
      productId: product._id,
      title: product.title,
      sku: product.sku || '',
      image: primaryImage?.url || '',
      price: product.price,
      quantity,
      lineTotal: itemTotal,
      weight: product.weight?.value || 0,
      requiresShipping: product.isPhysical !== false,
    });
  }

  // ============================================
  // Step 4: Apply the discount code (if any)
  //
  // The code is a *suggestion* from the browser. Everything about it — does
  // it exist, is it active, has it expired, does the cart qualify, and what
  // is it worth — is decided here, on the server, from the real cart.
  // ============================================
  let discount = null;
  let discountAmount = 0;
  let freeShipping = false;

  if (discountCode) {
    discount = await getApplicableDiscount({
      store,
      code: discountCode,
      subtotal,
      totalQuantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
    });

    const result = await calculateDiscount({
      discount,
      items: lineItems,
      subtotal,
    });

    discountAmount = result.amount;
    freeShipping = result.freeShipping;
  }

  // ============================================
  // Step 5: Calculate shipping and tax
  //
  // One shared implementation (`services/pricing.service.js`) so the amount
  // charged, the amount recorded on the order and the amount shown to the
  // customer can never disagree. The rules come from the store's settings.
  // ============================================
  const requiresShipping = lineItems.some((item) => item.requiresShipping);

  const totals = calculateTotals({
    store,
    subtotal,
    discountAmount,
    freeShipping,
    requiresShipping,
    currency: store.currency || 'USD',
  });

  const { shippingCost, taxAmount, total: totalAmount } = totals;
  const currency = totals.currency;
  const stripeAmount = toStripeAmount(totalAmount, currency);

  // Minimum charge for Stripe (50 cents in USD)
  if (stripeAmount < 50) {
    throw new ApiError(
      400,
      'Order total is too small to process',
      'AMOUNT_TOO_SMALL'
    );
  }

  // ============================================
  // Step 6: Snapshot the checkout on OUR side
  // ============================================
  // Stripe's webhook can tell us "this payment succeeded", but Stripe has no
  // idea what was in the cart. If we do not keep a copy of the verified cart,
  // the customer and the address, then a webhook arriving after the browser
  // closed would have no way to build the order.
  //
  // This CheckoutSession is that copy — and it doubles as the idempotency key
  // that guarantees one payment produces exactly one order.
  const checkoutSession = new CheckoutSession({
    store: store._id,
    status: 'pending',
    items: lineItems.map((item) => ({
      product: item.productId,
      title: item.title,
      sku: item.sku,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.lineTotal,
      weight: item.weight,
      requiresShipping: item.requiresShipping,
    })),
    customer: {
      firstName: customer.firstName || shippingAddress.firstName,
      lastName: customer.lastName || shippingAddress.lastName,
      email: customer.email.toLowerCase(),
      phone: customer.phone || shippingAddress.phone,
      acceptsMarketing: Boolean(customer.acceptsMarketing),
    },
    shippingAddress: {
      firstName: shippingAddress.firstName || customer.firstName,
      lastName: shippingAddress.lastName || customer.lastName,
      line1: shippingAddress.line1,
      line2: shippingAddress.line2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state || '',
      country: shippingAddress.country || 'US',
      zipCode: shippingAddress.zipCode,
      phone: shippingAddress.phone || customer.phone,
    },
    billingAddress: billingAddress
      ? {
          firstName: billingAddress.firstName || customer.firstName,
          line1: billingAddress.line1,
          line2: billingAddress.line2 || '',
          city: billingAddress.city,
          state: billingAddress.state || '',
          country: billingAddress.country || 'US',
          zipCode: billingAddress.zipCode,
          sameAsShipping: false,
        }
      : undefined,
    pricing: {
      subtotal: totals.subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total: totalAmount,
      currency,
    },
    discount: discount
      ? {
          code: discount.code,
          discountId: discount._id,
          type: discount.type,
          value: discount.value,
          amountSaved: discountAmount,
        }
      : undefined,
    notes: notes || '',
    channel: 'online',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  await checkoutSession.save();

  // ============================================
  // Step 7: Create Stripe Payment Intent
  // ============================================
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        storeId: store._id.toString(),
        storeSlug: store.slug,
        // Points the webhook back at the cart it belongs to
        checkoutSessionId: checkoutSession._id.toString(),
        customerEmail: customer.email,
        itemCount: items.length,
        subtotal: totals.subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        tax: taxAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        discountCode: discount?.code || '',
      },
      receipt_email: customer.email,
      description: `Order from ${store.name}`,
      shipping: {
        name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
        phone: shippingAddress.phone || customer.phone,
        address: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state || undefined,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country || 'US',
        },
      },
    });
  } catch (error) {
    // Stripe refused the intent — do not leave a live cart behind
    checkoutSession.markFailed(
      'payment_intent_failed',
      error.message || 'Could not create the payment intent'
    );
    await checkoutSession.save();
    throw error;
  }

  // Link the session to the payment intent (both directions now exist)
  checkoutSession.paymentIntentId = paymentIntent.id;
  await checkoutSession.save();

  // ============================================
  // Step 8: Return clientSecret to frontend
  // ============================================
  return res.status(200).json(
    ApiResponse.success('Payment intent created', {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      checkoutSessionId: checkoutSession._id.toString(),
      amount: totalAmount,
      currency: currency,
      breakdown: {
        subtotal: totals.subtotal,
        discount: discountAmount,
        shipping: shippingCost,
        tax: taxAmount,
        total: totalAmount,
      },
      discount: discount
        ? {
            code: discount.code,
            type: discount.type,
            amountSaved: discountAmount,
          }
        : null,
      items: lineItems,
    })
  );
});

/**
 * @route   POST /api/v1/storefront/:storeSlug/payment/verify
 * @desc    Verify a payment was successful (called after Stripe.js confirms)
 * @access  Public
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(500, 'Stripe not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    throw new ApiError(400, 'Payment intent ID is required', 'NO_PAYMENT_INTENT');
  }

  // Fetch the payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return res.status(200).json(
    ApiResponse.success('Payment verified', {
      status: paymentIntent.status,
      // Not a blind /100 — zero-decimal currencies (JPY, KRW...) have no cents
      amount: fromStripeAmount(paymentIntent.amount, paymentIntent.currency),
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    })
  );
});