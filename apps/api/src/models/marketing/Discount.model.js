import mongoose from 'mongoose';

/**
 * Discount Schema
 *
 * Represents promotional codes and offers merchants can create.
 *
 * Types supported:
 * - percentage: 20% off
 * - fixed_amount: $10 off
 * - free_shipping: Free shipping
 * - buy_x_get_y: Buy 2 get 1 free
 *
 * Discounts can have conditions:
 * - Minimum order amount
 * - Specific products/categories only
 * - Usage limits (total and per customer)
 * - Date range
 */
const DiscountSchema = new mongoose.Schema(
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
    // CODE
    // ============================================
    // The coupon code customers enter at checkout
    // Example: "SUMMER20", "WELCOME10"
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Code cannot exceed 50 characters'],
    },

    // Optional human-readable title (for merchant view)
    title: {
      type: String,
      trim: true,
      maxlength: [100],
    },

    description: {
      type: String,
      maxlength: [500],
    },

    // ============================================
    // DISCOUNT TYPE & VALUE
    // ============================================
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'],
      required: true,
    },

    // For percentage: the % off (e.g., 20 = 20%)
    // For fixed_amount: the amount off (e.g., 10 = $10 off)
    // For free_shipping: not used
    // For buy_x_get_y: the discount on the Y items
    value: {
      type: Number,
      min: 0,
      required: function () {
        return this.type !== 'free_shipping';
      },
    },

    // ============================================
    // BUY X GET Y CONFIGURATION
    // ============================================
    buyXGetY: {
      buyQuantity: { type: Number, min: 1 },
      getQuantity: { type: Number, min: 1 },
      // Discount on the "Y" items (0-100% for percentage, or fixed amount)
      getDiscountType: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'free'],
      },
      getDiscountValue: { type: Number },
    },

    // ============================================
    // CONDITIONS
    // ============================================
    conditions: {
      // Minimum order subtotal required
      minimumOrderAmount: { type: Number, min: 0 },

      // Minimum quantity of items required
      minimumQuantity: { type: Number, min: 1 },

      // What products this applies to
      appliesTo: {
        type: String,
        enum: ['all_products', 'specific_products', 'specific_categories', 'specific_collections'],
        default: 'all_products',
      },

      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],

      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],

      collections: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Collection',
        },
      ],

      // Customer eligibility
      customerEligibility: {
        type: String,
        enum: ['all_customers', 'specific_customers', 'first_time_only'],
        default: 'all_customers',
      },

      eligibleCustomers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Customer',
        },
      ],
    },

    // ============================================
    // USAGE LIMITS
    // ============================================
    // Maximum total uses (null = unlimited)
    usageLimit: {
      type: Number,
      min: 1,
    },

    // Max uses per individual customer
    usageLimitPerCustomer: {
      type: Number,
      min: 1,
      default: 1,
    },

    // Current usage count (incremented when discount is used)
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============================================
    // VALIDITY PERIOD
    // ============================================
    startsAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
    },

    // ============================================
    // STATUS
    // ============================================
    isActive: {
      type: Boolean,
      default: true,
    },

    // ============================================
    // COMBINATION RULES
    // ============================================
    // Can this discount be combined with other discounts?
    canCombineWithProductDiscounts: { type: Boolean, default: false },
    canCombineWithShippingDiscounts: { type: Boolean, default: true },

    // ============================================
    // METADATA
    // ============================================
    createdBy: {
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
// Code is unique per store
DiscountSchema.index({ store: 1, code: 1 }, { unique: true });
DiscountSchema.index({ store: 1, isActive: 1 });
DiscountSchema.index({ store: 1, expiresAt: 1 });

// ============================================
// VIRTUAL: Is the discount currently valid?
// ============================================
DiscountSchema.virtual('isValid').get(function () {
  if (!this.isActive) return false;

  const now = new Date();
  if (this.startsAt && this.startsAt > now) return false;
  if (this.expiresAt && this.expiresAt < now) return false;

  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;

  return true;
});

// ============================================
// VIRTUAL: Is the discount expired?
// ============================================
DiscountSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// ============================================
// VIRTUAL: Has reached usage limit?
// ============================================
DiscountSchema.virtual('isMaxedOut').get(function () {
  if (!this.usageLimit) return false;
  return this.usageCount >= this.usageLimit;
});

// ============================================
// METHOD: Check if a customer can use this discount
// ============================================
DiscountSchema.methods.canBeUsedBy = async function (customerId) {
  // Not active or expired
  if (!this.isValid) return { allowed: false, reason: 'Discount is not valid' };

  // Check customer eligibility
  if (this.conditions.customerEligibility === 'specific_customers') {
    const isEligible = this.conditions.eligibleCustomers.some(
      (id) => id.toString() === customerId.toString()
    );
    if (!isEligible) {
      return { allowed: false, reason: 'Not eligible for this discount' };
    }
  }

  // Note: Per-customer usage limit and first_time_only checks
  // are done in the controller (require Order model lookup)

  return { allowed: true };
};

DiscountSchema.set('toJSON', { virtuals: true });
DiscountSchema.set('toObject', { virtuals: true });

const Discount = mongoose.model('Discount', DiscountSchema);

export default Discount;