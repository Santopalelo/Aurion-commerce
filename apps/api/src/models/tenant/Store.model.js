import mongoose from 'mongoose';

/**
 * Store Schema — The Tenant
 *
 * Each store represents one merchant's business on Aurion Commerce.
 * Every product, order, customer, etc. in the database belongs to a Store.
 *
 * This is the heart of our multi-tenant architecture.
 */
const StoreSchema = new mongoose.Schema(
  {
    // ============================================
    // IDENTITY
    // ============================================
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      minlength: [2, 'Store name must be at least 2 characters'],
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },

    // Slug is used in URLs: johns-store.aurioncommerce.com
    // Must be unique across the entire platform
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        'Slug can only contain lowercase letters, numbers, and hyphens',
      ],
    },

    // 3-letter (or up to 5) order-number prefix, derived from the store slug.
    // Used as `${orderPrefix}-${sequence}` for order numbers.
    orderPrefix: {
      type: String,
      uppercase: true,
      trim: true,
      maxlength: 5,
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ============================================
    // BRANDING (Cloudinary URLs)
    // ============================================
    logo: {
      url: { type: String },
      publicId: { type: String }, // Cloudinary public_id for deletion
    },
    favicon: {
      url: { type: String },
      publicId: { type: String },
    },
    banner: {
      url: { type: String },
      publicId: { type: String },
    },

    // ============================================
    // OWNERSHIP
    // ============================================
    // The User who created and owns this store
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ============================================
    // DOMAIN
    // ============================================
    domain: {
      // Default subdomain: {slug}.aurioncommerce.com
      subdomain: { type: String },

      // Custom domain (e.g., shop.example.com) — optional
      customDomain: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        lowercase: true,
        trim: true,
      },
      customDomainVerified: { type: Boolean, default: false },
    },

    // ============================================
    // CONTACT INFO
    // ============================================
    contact: {
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: { type: String },
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },

    // ============================================
    // BUSINESS INFO
    // ============================================
    business: {
      type: {
        type: String,
        enum: ['retail', 'wholesale', 'digital', 'service', 'other'],
        default: 'retail',
      },
      category: { type: String }, // e.g., "Fashion", "Electronics"
      registrationNumber: { type: String },
      taxNumber: { type: String },
    },

    // ============================================
    // CURRENCY & LOCALIZATION
    // ============================================
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    currencySymbol: { type: String, default: '$' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg',
    },

    // ============================================
    // TAX
    // ============================================
    // Per-store tax. The rate is a fraction (0.16 = 16%), not a percentage,
    // so it can be multiplied straight into the amount.
    //
    // The default of 0.08 reproduces the flat 8% that used to be hardcoded
    // in the checkout controller, so no store's pricing changes on deploy.
    // Every store SHOULD set its own rate — 8% is a US state sales tax, not
    // a world default.
    tax: {
      rate: { type: Number, default: 0.08, min: 0, max: 1 },
      // When true the price already includes the tax, so it is not added on
      // top. (European display prices, for example.)
      inclusive: { type: Boolean, default: false },
      label: { type: String, default: 'Tax' },
    },

    // ============================================
    // SHIPPING
    // ============================================
    // Flat-rate shipping for now. Multiple rates and zones come later.
    shipping: {
      // Orders at or above this subtotal ship free (0 = never free).
      freeShippingThreshold: { type: Number, default: 50, min: 0 },
      // The flat amount charged below the threshold. Set it to 0 for
      // "always free shipping".
      flatRate: { type: Number, default: 5, min: 0 },
      // Whether the free-shipping threshold is applied at all. With it off,
      // every order pays the flat rate.
      freeOverThreshold: { type: Boolean, default: true },
    },

    // ============================================
    // SUBSCRIPTION PLAN
    // ============================================
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro', 'enterprise'],
      default: 'free',
    },
    planStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'suspended'],
      default: 'trialing',
    },
    planExpiresAt: { type: Date },

    // Stripe references for billing
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    // ============================================
    // THEME & APPEARANCE
    // ============================================
    activeTheme: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Custom theme settings (colors, fonts, layout)
    themeSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ============================================
    // STORE STATUS
    // ============================================
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'setup'],
      default: 'setup', // New stores start in setup mode
    },

    // Password protection (e.g., for stores in development)
    isPasswordProtected: { type: Boolean, default: false },
    storePassword: { type: String, select: false }, // Hidden by default

    // ============================================
    // SEO
    // ============================================
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
      ogImage: String,
    },

    // ============================================
    // SOCIAL MEDIA
    // ============================================
    social: {
      instagram: String,
      facebook: String,
      twitter: String,
      tiktok: String,
      youtube: String,
      pinterest: String,
    },

    // ============================================
    // LEGAL POLICIES
    // ============================================
    policies: {
      refund: String,
      privacy: String,
      terms: String,
      shipping: String,
    },

    // ============================================
    // ONBOARDING TRACKING
    // ============================================
    onboarding: {
      hasAddedProduct: { type: Boolean, default: false },
      hasSetupPayments: { type: Boolean, default: false },
      hasSetupShipping: { type: Boolean, default: false },
      hasCustomizedTheme: { type: Boolean, default: false },
      completedAt: { type: Date },
    },
  },
  {
    timestamps: true, // Auto adds createdAt and updatedAt
  }
);

// ============================================
// INDEXES — For fast queries
// ============================================
StoreSchema.index({ owner: 1 });
StoreSchema.index({ status: 1 });

// ============================================
// VIRTUAL: Full storefront URL
// ============================================
StoreSchema.virtual('storefrontUrl').get(function () {
  if (this.domain?.customDomain && this.domain.customDomainVerified) {
    return `https://${this.domain.customDomain}`;
  }
  return `https://${this.slug}.aurioncommerce.com`;
});

// Include virtuals when converting to JSON
StoreSchema.set('toJSON', { virtuals: true });
StoreSchema.set('toObject', { virtuals: true });

// Derive orderPrefix from slug if not explicitly set
StoreSchema.pre('validate', function (next) {
  if (!this.orderPrefix && this.slug) {
    // Take first 3 letters of the first slug segment, uppercased
    const segment = this.slug.split('-')[0] || this.slug;
    this.orderPrefix = segment.slice(0, 3).toUpperCase() || 'STR';
  }
  next();
});

const Store = mongoose.model('Store', StoreSchema);

export default Store;
