import mongoose from 'mongoose';

/**
 * Order Schema
 *
 * THE most critical schema in the e-commerce system.
 * An order represents a customer's purchase from a store.
 *
 * Key design principles:
 * 1. SNAPSHOTS: Order captures product data at time of purchase
 *    (so if price changes later, order keeps original price)
 *
 * 2. AUDIT TRAIL: Every status change is logged in statusHistory[]
 *
 * 3. THREE STATUS TYPES (track independently):
 *    - status: Overall order state
 *    - paymentStatus: Payment lifecycle
 *    - fulfillmentStatus: Shipping lifecycle
 *
 * 4. ORDER NUMBER: Auto-generated per store (AUR-00001, AUR-00002...)
 */
const OrderSchema = new mongoose.Schema(
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
    // ORDER IDENTITY
    // ============================================
    // Auto-generated like "AUR-00001" — unique per store
    orderNumber: {
      type: String,
      required: true,
    },

    // ============================================
    // CUSTOMER
    // ============================================
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },

    // Snapshot of customer data at time of order
    // This protects historical orders if customer changes info or is deleted
    customerSnapshot: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },

    isGuestOrder: { type: Boolean, default: false },

    // ============================================
    // LINE ITEMS (Order Items)
    // ============================================
    // Each item is a snapshot — even if the product is deleted,
    // the order still has all the info needed to display the history
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
        },

        // SNAPSHOT FIELDS — Captured at order time
        title: { type: String, required: true },
        variantTitle: { type: String }, // e.g., "Red / Small"
        sku: { type: String },
        image: { type: String },

        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },

        // Tax & discount for this specific line item
        taxAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },

        // Properties from the variant
        weight: { type: Number },
        requiresShipping: { type: Boolean, default: true },

        // Fulfillment for this specific item
        fulfillmentStatus: {
          type: String,
          enum: ['unfulfilled', 'fulfilled', 'partial', 'restocked'],
          default: 'unfulfilled',
        },
        fulfilledQuantity: { type: Number, default: 0 },
      },
    ],

    // ============================================
    // PRICING BREAKDOWN
    // ============================================
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      shippingCost: { type: Number, default: 0, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
    },

    // ============================================
    // DISCOUNT APPLIED
    // ============================================
    discount: {
      code: { type: String, uppercase: true },
      discountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
      },
      value: { type: Number },
      amountSaved: { type: Number, default: 0 },
    },

    // ============================================
    // SHIPPING ADDRESS
    // ============================================
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      company: String,
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      phone: String,
    },

    // ============================================
    // BILLING ADDRESS
    // ============================================
    billingAddress: {
      firstName: String,
      lastName: String,
      company: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      sameAsShipping: { type: Boolean, default: true },
    },

    // ============================================
    // ORDER STATUS (overall state)
    // ============================================
    status: {
      type: String,
      enum: [
        'pending',     // Just placed, not yet confirmed
        'confirmed',   // Payment confirmed
        'processing',  // Being prepared/packed
        'shipped',     // On the way
        'delivered',   // Successfully delivered
        'cancelled',   // Cancelled by customer or merchant
        'refunded',    // Money returned to customer
        'on_hold',     // Held for review (fraud, inventory, etc)
      ],
      default: 'pending',
      required: true,
    },

    // ============================================
    // PAYMENT STATUS (independent from order status)
    // ============================================
    paymentStatus: {
      type: String,
      enum: [
        'pending',              // Awaiting payment
        'paid',                 // Fully paid
        'partially_paid',       // Partial payment received
        'refunded',             // Fully refunded
        'partially_refunded',   // Partially refunded
        'failed',               // Payment failed
        'voided',               // Payment voided
      ],
      default: 'pending',
    },

    // ============================================
    // FULFILLMENT STATUS (independent)
    // ============================================
    fulfillmentStatus: {
      type: String,
      enum: ['unfulfilled', 'partial', 'fulfilled', 'restocked'],
      default: 'unfulfilled',
    },

    // ============================================
    // PAYMENT DETAILS
    // ============================================
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'paypal', 'cash_on_delivery', 'bank_transfer', 'manual'],
      },

      // Stripe-specific fields
      stripePaymentIntentId: { type: String },
      stripeChargeId: { type: String },
      stripeCustomerId: { type: String },

      // Generic transaction info
      transactionId: { type: String },
      paidAmount: { type: Number, default: 0 },
      refundedAmount: { type: Number, default: 0 },

      paidAt: { type: Date },
      failedAt: { type: Date },
      failureReason: { type: String },
    },

    // ============================================
    // SHIPPING DETAILS
    // ============================================
    shipping: {
      method: { type: String }, // "Standard", "Express", etc
      carrier: { type: String }, // "FedEx", "UPS", "DHL"
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },

    // ============================================
    // STATUS HISTORY (audit trail)
    // ============================================
    statusHistory: [
      {
        type: {
          type: String,
          enum: ['status', 'payment', 'fulfillment', 'note'],
        },
        from: String,
        to: String,
        note: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ============================================
    // NOTES
    // ============================================
    customerNote: { type: String }, // Customer's note at checkout
    merchantNotes: [
      {
        note: { type: String, required: true },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ============================================
    // METADATA
    // ============================================
    // Order source / sales channel
    channel: {
      type: String,
      enum: ['online', 'pos', 'manual', 'api', 'marketplace'],
      default: 'online',
    },

    // Custom tags for filtering/searching
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // IP and user agent of customer at checkout
    ipAddress: { type: String },
    userAgent: { type: String },

    // Cancellation info
    cancelledAt: { type: Date },
    cancelledReason: { type: String },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
OrderSchema.index({ store: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ store: 1, status: 1 });
OrderSchema.index({ store: 1, paymentStatus: 1 });
OrderSchema.index({ store: 1, fulfillmentStatus: 1 });
OrderSchema.index({ store: 1, customer: 1 });
OrderSchema.index({ store: 1, createdAt: -1 });
OrderSchema.index({ 'customerSnapshot.email': 1 });
OrderSchema.index({ 'payment.stripePaymentIntentId': 1 });

// ============================================
// PRE-SAVE: Auto-generate order number per store
// ============================================
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      // Count existing orders for this store
      const count = await mongoose.model('Order').countDocuments({
        store: this.store,
      });

      // Generate sequential order number: AUR-00001
      this.orderNumber = `AUR-${String(count + 1).padStart(5, '0')}`;

      // Add initial status to history
      this.statusHistory.push({
        type: 'status',
        from: null,
        to: this.status,
        note: 'Order created',
        changedAt: new Date(),
      });
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// ============================================
// METHOD: Add status change to history
// ============================================
OrderSchema.methods.addStatusChange = function (type, from, to, note, userId) {
  this.statusHistory.push({
    type,
    from,
    to,
    note,
    changedBy: userId,
    changedAt: new Date(),
  });
};

// ============================================
// VIRTUAL: Total item count
// ============================================
OrderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ============================================
// VIRTUAL: Is order fully paid?
// ============================================
OrderSchema.virtual('isPaid').get(function () {
  return this.paymentStatus === 'paid';
});

// ============================================
// VIRTUAL: Is order fully fulfilled?
// ============================================
OrderSchema.virtual('isFulfilled').get(function () {
  return this.fulfillmentStatus === 'fulfilled';
});

OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', OrderSchema);

export default Order;