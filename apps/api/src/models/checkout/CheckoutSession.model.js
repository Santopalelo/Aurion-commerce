import mongoose from 'mongoose';

/**
 * Checkout Session Schema
 *
 * A CheckoutSession is the SERVER-SIDE record of a shopping cart that is
 * waiting to be paid for.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Stripe webhook tells us "this payment succeeded" — but Stripe does not
 * know what was in the cart. That information only ever lived in the
 * customer's browser. Without a server-side copy, a webhook arriving after
 * the browser closed would have no way to build the Order.
 *
 * So `createPaymentIntent` snapshots the verified cart into a CheckoutSession
 * and puts its id in the PaymentIntent metadata. The webhook can then look
 * the session up and build the order from trusted, server-side data.
 *
 * This is also the idempotency key: the browser path and the webhook path
 * both finalize the SAME session, so a payment can only ever produce one
 * order no matter how many times Stripe retries the event.
 *
 * Sessions that are never paid for are removed automatically by the TTL
 * index on `expiresAt`.
 */
const CheckoutSessionSchema = new mongoose.Schema(
  {
    // ============================================
    // TENANT
    // ============================================
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    // ============================================
    // STRIPE LINKAGE
    // ============================================
    // Set right after the PaymentIntent is created.
    // Indexed below (unique + sparse) — one live session per payment intent.
    paymentIntentId: {
      type: String,
    },

    // ============================================
    // STATE
    // ============================================
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'expired'],
      default: 'pending',
      required: true,
    },

    // The order that was created from this session (set on completion)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },

    completedAt: {
      type: Date,
    },

    // ============================================
    // LINE ITEMS (snapshot of the verified cart)
    // ============================================
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        title: { type: String, required: true },
        sku: { type: String },
        image: { type: String },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true, min: 0 },
        weight: { type: Number, default: 0 },
        requiresShipping: { type: Boolean, default: true },
      },
    ],

    // ============================================
    // CUSTOMER
    // ============================================
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String },
      acceptsMarketing: { type: Boolean, default: false },
    },

    // ============================================
    // ADDRESSES
    // ============================================
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      phone: { type: String },
    },

    billingAddress: {
      firstName: { type: String },
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
      sameAsShipping: { type: Boolean, default: true },
    },

    // ============================================
    // PRICING (server-verified, mirrors the PaymentIntent)
    // ============================================
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      shippingCost: { type: Number, default: 0, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
    },

    // ============================================
    // EXTRAS
    // ============================================
    notes: { type: String },

    // Where the checkout was started from
    channel: {
      type: String,
      enum: ['online', 'pos', 'manual', 'api', 'marketplace'],
      default: 'online',
    },

    ipAddress: { type: String },
    userAgent: { type: String },

    // Set when the session fails (payment failed, expired, ...)
    failure: {
      code: { type: String },
      message: { type: String },
    },

    // Abandoned checkouts are auto-deleted by the TTL index below
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
// One live session per payment intent — prevents duplicate carts
CheckoutSessionSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });
CheckoutSessionSchema.index({ store: 1, status: 1 });
CheckoutSessionSchema.index({ store: 1, createdAt: -1 });

// TTL index — MongoDB removes abandoned sessions automatically after 24h
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// INSTANCE HELPERS
// ============================================

/**
 * Has this session already produced an order?
 */
CheckoutSessionSchema.methods.isCompleted = function () {
  return this.status === 'completed' && Boolean(this.order);
};

/**
 * Mark the session as failed, keeping the reason for debugging.
 */
CheckoutSessionSchema.methods.markFailed = function (code, message) {
  this.status = 'failed';
  this.failure = { code, message };
  return this;
};

CheckoutSessionSchema.set('toJSON', { virtuals: true });
CheckoutSessionSchema.set('toObject', { virtuals: true });

const CheckoutSession = mongoose.model('CheckoutSession', CheckoutSessionSchema);

export default CheckoutSession;
