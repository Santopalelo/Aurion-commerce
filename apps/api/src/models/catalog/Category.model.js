import mongoose from 'mongoose';

/**
 * Category Schema
 *
 * Categories organize products in a hierarchical structure.
 * Example: Clothing > Shirts > T-Shirts
 *
 * Each category belongs to ONE store (multi-tenant).
 */
const CategorySchema = new mongoose.Schema(
  {
    // ============================================
    // TENANT — Which store this category belongs to
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
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // ============================================
    // HIERARCHY — Parent/child relationships
    // ============================================
    // null = top-level category (root)
    // Otherwise = subcategory of another category
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Cached path for fast breadcrumb generation
    // Example: "clothing/shirts/t-shirts"
    path: { type: String },

    // Nesting level (0 = root, 1 = subcategory, etc)
    level: { type: Number, default: 0 },

    // ============================================
    // VISUAL
    // ============================================
    image: {
      url: { type: String },
      publicId: { type: String },
    },

    icon: { type: String }, // For category navigation icons

    // ============================================
    // DISPLAY ORDER
    // ============================================
    displayOrder: { type: Number, default: 0 },

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

    // ============================================
    // STATS (denormalized for performance)
    // ============================================
    productCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES — Slug unique per store (not globally)
// ============================================
CategorySchema.index({ store: 1, slug: 1 }, { unique: true });
CategorySchema.index({ store: 1, parent: 1 });
CategorySchema.index({ store: 1, isActive: 1 });

const Category = mongoose.model('Category', CategorySchema);

export default Category;