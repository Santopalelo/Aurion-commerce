import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Customer Schema
 *
 * Represents a shopper who buys from a specific merchant's store.
 *
 * IMPORTANT: Customers are scoped PER STORE.
 * The same email can exist as a customer in multiple stores
 * (just like the same email can have separate accounts on
 * different Shopify stores).
 *
 * Customers can be:
 * - Registered (have account with password)
 * - Guest (just placed an order without signing up)
 */
const CustomerSchema = new mongoose.Schema(
  {
    // ============================================
    // TENANT — Customers are isolated per store
    // ============================================
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    // ============================================
    // IDENTITY
    // ============================================
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },

    // ============================================
    // AUTHENTICATION (for registered customers only)
    // ============================================
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    // Guest customers have no password
    isGuest: {
      type: Boolean,
      default: false,
    },

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // ============================================
    // PASSWORD RESET
    // ============================================
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ============================================
    // ADDRESSES — Customer can have multiple
    // ============================================
    addresses: [
      {
        label: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'home',
        },
        firstName: String,
        lastName: String,
        company: String,
        line1: { type: String, required: true },
        line2: String,
        city: { type: String, required: true },
        state: String,
        country: { type: String, required: true },
        zipCode: { type: String, required: true },
        phone: String,
        isDefault: { type: Boolean, default: false },
      },
    ],

    // ============================================
    // STATS (denormalized for performance)
    // Updated when orders are placed/cancelled
    // ============================================
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      lastOrderAt: { type: Date },
      firstOrderAt: { type: Date },
    },

    // ============================================
    // MARKETING
    // ============================================
    acceptsMarketing: { type: Boolean, default: false },
    acceptsSmsMarketing: { type: Boolean, default: false },

    // Merchant tags for customer segmentation
    // Example: ["vip", "wholesale", "newsletter-subscriber"]
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Private merchant notes about the customer
    note: { type: String },

    // ============================================
    // STATUS
    // ============================================
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },

    // ============================================
    // TRACKING
    // ============================================
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },

    // Where the customer signed up from
    source: {
      type: String,
      enum: ['storefront', 'checkout', 'import', 'pos', 'admin'],
      default: 'storefront',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
// Email is unique PER STORE (not globally)
CustomerSchema.index({ store: 1, email: 1 }, { unique: true });
CustomerSchema.index({ store: 1, status: 1 });
CustomerSchema.index({ store: 1, createdAt: -1 });

// ============================================
// PRE-SAVE: Hash password
// ============================================
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next(); // Guest customers have no password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ============================================
// PRE-SAVE: Ensure only one default address
// ============================================
CustomerSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter((a) => a.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the first one as default
      this.addresses.forEach((addr, i) => {
        if (addr.isDefault && this.addresses.indexOf(defaultAddresses[0]) !== i) {
          addr.isDefault = false;
        }
      });
    }
  }
  next();
});

// ============================================
// METHOD: Compare password
// ============================================
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// VIRTUAL: Full name
// ============================================
CustomerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ============================================
// VIRTUAL: Default address
// ============================================
CustomerSchema.virtual('defaultAddress').get(function () {
  if (!this.addresses || this.addresses.length === 0) return null;
  return this.addresses.find((a) => a.isDefault) || this.addresses[0];
});

CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

const Customer = mongoose.model('Customer', CustomerSchema);

export default Customer;