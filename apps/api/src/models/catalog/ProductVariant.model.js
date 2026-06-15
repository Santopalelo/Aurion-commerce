import mongoose from 'mongoose';

/**
 * ProductVariant Schema
 *
 * Represents a specific variation of a product.
 * Example: A T-Shirt product might have variants like:
 *   - Red / Small  (price: $20, stock: 10)
 *   - Red / Medium (price: $20, stock: 5)
 *   - Blue / Small (price: $22, stock: 8)
 *
 * Each variant has its own SKU, price, and inventory.
 */
const ProductVariantSchema = new mongoose.Schema(
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
    // PARENT PRODUCT
    // ============================================
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    // ============================================
    // VARIANT IDENTITY
    // ============================================
    // Auto-generated title from option values
    // Example: "Red / Small"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // The actual option combination
    // Example: [{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'Small' }]
    options: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],

    // ============================================
    // PRICING
    // ============================================
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    costPerItem: {
      type: Number,
      min: 0,
    },

    // ============================================
    // INVENTORY
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

    // ============================================
    // VARIANT-SPECIFIC IMAGE (optional)
    // ============================================
    // Some variants have unique images (e.g., red shirt vs blue shirt)
    image: {
      url: { type: String },
      publicId: { type: String },
    },

    // ============================================
    // SHIPPING (overrides product-level if set)
    // ============================================
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'] },
    },

    // ============================================
    // STATUS
    // ============================================
    isActive: { type: Boolean, default: true },

    // ============================================
    // DISPLAY ORDER
    // ============================================
    position: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
ProductVariantSchema.index({ store: 1, product: 1 });
ProductVariantSchema.index({ store: 1, sku: 1 });

// ============================================
// VIRTUAL: Is variant on sale?
// ============================================
ProductVariantSchema.virtual('isOnSale').get(function () {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

// ============================================
// VIRTUAL: Is variant in stock?
// ============================================
ProductVariantSchema.virtual('isInStock').get(function () {
  if (!this.trackInventory) return true;
  if (this.allowBackorder) return true;
  return this.inventoryQuantity > 0;
});

ProductVariantSchema.set('toJSON', { virtuals: true });
ProductVariantSchema.set('toObject', { virtuals: true });

const ProductVariant = mongoose.model('ProductVariant', ProductVariantSchema);

export default ProductVariant;