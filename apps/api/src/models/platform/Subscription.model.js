import mongoose from 'mongoose';

/**
 * Subscription Schema
 *
 * Tracks a store's subscription to Aurion Commerce platform.
 * This is DIFFERENT from customer-merchant transactions.
 *
 * Flow:
 * 1. Merchant signs up → Free plan created automatically
 * 2. Merchant upgrades → New Stripe subscription created
 * 3. Stripe sends webhooks to update subscription status
 * 4. Subscription expires/canceled → Plan downgrades to free
 *
 * Each store has ONE active subscription.
 */
const SubscriptionSchema = new mongoose.Schema(
  {
    // ============================================
    // TENANT
    // ============================================
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      unique: true, // One subscription per store
    },

    // The merchant who owns this subscription
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ============================================
    // PLAN DETAILS
    // ============================================
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro', 'enterprise'],
      default: 'free',
      required: true,
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },

    // ============================================
    // PRICING
    // ============================================
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },

    // ============================================
    // PLAN LIMITS
    // (denormalized — copied from plan config when subscription created)
    // ============================================
    limits: {
      products: { type: Number, default: 10 },           // Max products
      staff: { type: Number, default: 1 },               // Max staff members
      storageMB: { type: Number, default: 500 },         // Cloudinary storage limit
      transactionFeePercent: { type: Number, default: 2 }, // % Aurion takes per sale

      // Feature flags
      customDomain: { type: Boolean, default: false },
      removeAurionBranding: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      multiCurrency: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },

    // ============================================
    // CURRENT USAGE (tracked over time)
    // ============================================
    usage: {
      products: { type: Number, default: 0 },
      staff: { type: Number, default: 0 },
      storageMB: { type: Number, default: 0 },

      // Reset monthly
      ordersThisMonth: { type: Number, default: 0 },
      revenueThisMonth: { type: Number, default: 0 },
      lastUsageReset: { type: Date, default: Date.now },
    },

    // ============================================
    // STRIPE INTEGRATION
    // ============================================
    stripe: {
      customerId: { type: String, index: true },
      subscriptionId: { type: String, index: true },
      priceId: { type: String },
      productId: { type: String },
      paymentMethodId: { type: String },

      // Latest invoice
      latestInvoiceId: { type: String },
      upcomingInvoiceAmount: { type: Number },
      upcomingInvoiceDate: { type: Date },
    },

    // ============================================
    // STATUS
    // ============================================
    status: {
      type: String,
      enum: [
        'trialing',          // In free trial period
        'active',            // Paying customer
        'past_due',          // Payment failed, retrying
        'canceled',          // Canceled by user
        'unpaid',            // Multiple payment failures
        'incomplete',        // Initial payment failed
        'incomplete_expired',// Initial payment expired
      ],
      default: 'trialing',
      required: true,
    },

    // ============================================
    // TRIAL PERIOD
    // ============================================
    trialStartedAt: { type: Date },
    trialEndsAt: { type: Date },

    // ============================================
    // BILLING PERIOD
    // ============================================
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },

    // ============================================
    // CANCELLATION
    // ============================================
    canceledAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelReason: { type: String },

    // When this subscription becomes inactive after cancellation
    endsAt: { type: Date },

    // ============================================
    // HISTORY
    // ============================================
    // Track all plan changes
    planHistory: [
      {
        plan: {
          type: String,
          enum: ['free', 'starter', 'growth', 'pro', 'enterprise'],
        },
        billingCycle: {
          type: String,
          enum: ['monthly', 'annual'],
        },
        price: Number,
        startedAt: { type: Date, default: Date.now },
        endedAt: Date,
        reason: {
          type: String,
          enum: ['upgrade', 'downgrade', 'initial', 'renewal', 'cancellation'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // ============================================
    // METADATA
    // ============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
SubscriptionSchema.index({ owner: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

// ============================================
// VIRTUAL: Is in trial?
// ============================================
SubscriptionSchema.virtual('isInTrial').get(function () {
  if (this.status !== 'trialing') return false;
  if (!this.trialEndsAt) return false;
  return this.trialEndsAt > new Date();
});

// ============================================
// VIRTUAL: Days left in trial
// ============================================
SubscriptionSchema.virtual('trialDaysLeft').get(function () {
  if (!this.isInTrial) return 0;
  const diff = this.trialEndsAt - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// ============================================
// VIRTUAL: Is subscription active?
// ============================================
SubscriptionSchema.virtual('isActive').get(function () {
  return ['trialing', 'active'].includes(this.status);
});

// ============================================
// METHOD: Check if a limit is reached
// ============================================
SubscriptionSchema.methods.hasReachedLimit = function (limitName) {
  const limit = this.limits[limitName];
  const usage = this.usage[limitName];

  if (limit === Infinity || limit === null) return false;
  return usage >= limit;
};

// ============================================
// METHOD: Check if a feature is enabled
// ============================================
SubscriptionSchema.methods.hasFeature = function (featureName) {
  return this.limits[featureName] === true;
};

SubscriptionSchema.set('toJSON', { virtuals: true });
SubscriptionSchema.set('toObject', { virtuals: true });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;