import mongoose from 'mongoose';

/**
 * Collection Schema
 *
 * Collections are marketing groupings of products.
 * Unlike categories (which are hierarchical), collections are flat.
 *
 * Examples: "Summer Sale", "New Arrivals", "Featured Products"
 *
 * A product can belong to MANY collections.
 * Collections can be MANUAL (you pick products) or AUTOMATIC (rule-based).
 */
const CollectionSchema = new mongoose.Schema(
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
    // IDENTITY
    // ============================================
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [100, 'Collection name cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: [500],
    },

    // ============================================
    // VISUAL
    // ============================================
    image: {
      url: { type: String },
      publicId: { type: String },
    },

    banner: {
      url: { type: String },
      publicId: { type: String },
    },

    // ============================================
    // TYPE — Manual or Automatic
    // ============================================
    type: {
      type: String,
      enum: ['manual', 'automatic'],
      default: 'manual',
    },

    // For automatic collections — rules that determine which products belong
    // Example: { field: 'tags', operator: 'includes', value: 'summer' }
    rules: [
      {
        field: {
          type: String,
          enum: ['title', 'tags', 'vendor', 'price', 'category', 'productType'],
        },
        operator: {
          type: String,
          enum: [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'starts_with',
            'ends_with',
            'greater_than',
            'less_than',
            'includes',
          ],
        },
        value: mongoose.Schema.Types.Mixed,
      },
    ],

    // Match ALL rules or ANY rule
    rulesMatch: {
      type: String,
      enum: ['all', 'any'],
      default: 'all',
    },

    // ============================================
    // PRODUCTS (for manual collections)
    // ============================================
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    // ============================================
    // DISPLAY
    // ============================================
    displayOrder: { type: Number, default: 0 },
    sortBy: {
      type: String,
      enum: ['manual', 'newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'best_selling'],
      default: 'manual',
    },

    // ============================================
    // SEO
    // ============================================
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },

    // ============================================
    // STATUS
    // ============================================
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },

    // ============================================
    // STATS
    // ============================================
    productCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
CollectionSchema.index({ store: 1, slug: 1 }, { unique: true });
CollectionSchema.index({ store: 1, isActive: 1 });
CollectionSchema.index({ store: 1, type: 1 });

const Collection = mongoose.model('Collection', CollectionSchema);

export default Collection;