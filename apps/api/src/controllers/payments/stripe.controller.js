import Product from '../../models/catalog/Product.model.js';
import Store from '../../models/tenant/Store.model.js';
import stripe from '../../config/stripe.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Convert dollars/major currency unit to cents/minor unit
 * Stripe works in the smallest currency unit (cents for USD)
 */
const toStripeAmount = (amount, currency = 'USD') => {
  // Currencies without decimal places (e.g., JPY, KRW)
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }

  // Convert to cents (multiply by 100)
  return Math.round(amount * 100);
};

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
  const { items, customer, shippingAddress } = req.body;

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

    lineItems.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity,
      lineTotal: itemTotal,
    });
  }

  // ============================================
  // Step 4: Calculate shipping and tax
  // (For MVP, simple flat rates. Later we can make this configurable.)
  // ============================================
  const shippingCost = subtotal >= 50 ? 0 : 5;
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // ============================================
  // Step 5: Create Stripe Payment Intent
  // ============================================
  const currency = store.currency || 'USD';
  const stripeAmount = toStripeAmount(totalAmount, currency);

  // Minimum charge for Stripe (50 cents in USD)
  if (stripeAmount < 50) {
    throw new ApiError(
      400,
      'Order total is too small to process',
      'AMOUNT_TOO_SMALL'
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      storeId: store._id.toString(),
      storeSlug: store.slug,
      customerEmail: customer.email,
      itemCount: items.length,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      tax: taxAmount.toFixed(2),
      total: totalAmount.toFixed(2),
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

  // ============================================
  // Step 6: Return clientSecret to frontend
  // ============================================
  return res.status(200).json(
    ApiResponse.success('Payment intent created', {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: currency,
      breakdown: {
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total: totalAmount,
      },
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
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    })
  );
});