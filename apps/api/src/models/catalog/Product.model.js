import mongoose from 'mongoose';

/**
 * Product Schema
 *
 * The main product entity. A product can have:
 * - Simple structure (one price, one SKU, one stock count)
 * - Or variants (multiple SKUs with different prices, sizes, colors, etc)
 *
 * When a product has variants, the price/inventory/sku at the top level
 * is ignored — variants take over.
 */
const ProductSchema = new mongoose.Schema(
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
    // BASIC INFO
    // ============================================
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      // Can hold rich HTML from the editor
    },

    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },

    // ============================================
    // MEDIA — Cloudinary images
    // ============================================
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        altText: { type: String },
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],

    // Optional video URL (e.g., YouTube embed or Cloudinary video)
    videoUrl: { type: String },

    // ============================================
    // PRICING (used when product has NO variants)
    // ============================================
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Original price (shown crossed out for sale items)
    compareAtPrice: {
      type: Number,
      min: 0,
    },

    // Internal cost (for profit calculations — not shown to customers)
    costPerItem: {
      type: Number,
      min: 0,
    },

    // Currency override (otherwise uses store currency)
    currency: { type: String, uppercase: true },

    // Tax handling
    taxable: { type: Boolean, default: true },
    taxCode: { type: String },

    // ============================================
    // VARIANTS
    // ============================================
    hasVariants: { type: Boolean, default: false },

    // Product options that create variants
    // Example: [
    //   { name: 'Color', values: ['Red', 'Blue', 'Green'] },
    //   { name: 'Size', values: ['S', 'M', 'L'] }
    // ]
    options: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        values: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],

    // References to variant documents
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
      },
    ],

    // ============================================
    // INVENTORY (used when product has NO variants)
    // ============================================
    sku: {
      type: String,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
    },

    trackInventory: { type: Boolean, default: true },
    inventoryQuantity: { type: Number, default: 0, min: 0 },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5 },

    // ============================================
    // SHIPPING
    // ============================================
    isPhysical: { type: Boolean, default: true },

    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' },
    },

    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },

    // ============================================
    // CATEGORIZATION
    // ============================================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },

    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    vendor: {
      type: String,
      trim: true,
    },

    // Custom product type (e.g., "T-Shirt", "Sneaker")
    productType: {
      type: String,
      trim: true,
    },

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
    // STATUS
    // ============================================
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'draft',
    },

    publishedAt: { type: Date },
    isFeatured: { type: Boolean, default: false },

    // ============================================
    // STATS (denormalized for performance)
    // ============================================
    totalSold: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // ============================================
    // METADATA
    // ============================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
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
// Slug must be unique per store (two stores CAN have the same slug)
ProductSchema.index({ store: 1, slug: 1 }, { unique: true });
ProductSchema.index({ store: 1, status: 1 });
ProductSchema.index({ store: 1, category: 1 });
ProductSchema.index({ store: 1, collections: 1 });
ProductSchema.index({ store: 1, isFeatured: 1 });
ProductSchema.index({ store: 1, createdAt: -1 });

// Full-text search index for product search
ProductSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  vendor: 'text',
});

// ============================================
// VIRTUAL: Is the product on sale?
// ============================================
ProductSchema.virtual('isOnSale').get(function () {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

// ============================================
// VIRTUAL: Discount percentage
// ============================================
ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(
    ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
  );
});

// ============================================
// VIRTUAL: Is product in stock?
// ============================================
ProductSchema.virtual('isInStock').get(function () {
  if (!this.trackInventory) return true;
  if (this.allowBackorder) return true;
  return this.inventoryQuantity > 0;
});

// ============================================
// VIRTUAL: Primary image
// ============================================
ProductSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  return this.images.find((img) => img.isPrimary) || this.images[0];
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', ProductSchema);

export default Product;