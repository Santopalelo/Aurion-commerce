import mongoose from 'mongoose';

/**
 * Inventory Schema
 *
 * Tracks stock for products and variants.
 *
 * Why a separate schema?
 * Even though Product/Variant have inventoryQuantity fields,
 * we need a dedicated inventory model for:
 * 1. Multi-location support (warehouses, physical stores)
 * 2. Reserved stock (items in active carts)
 * 3. Incoming stock (purchase orders)
 * 4. Audit trail (via InventoryLog)
 *
 * For MVP we use a single "default" location per store.
 * Future: merchants can add multiple locations.
 */
const InventorySchema = new mongoose.Schema(
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
    // WHAT IS BEING TRACKED
    // ============================================
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    // null if product has no variants
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      default: null,
    },

    // ============================================
    // LOCATION (for multi-location support)
    // ============================================
    // For MVP, every store has one "default" location
    location: {
      name: { type: String, default: 'Default Location' },
      type: {
        type: String,
        enum: ['warehouse', 'store', 'fulfillment_center', 'default'],
        default: 'default',
      },
      address: {
        line1: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },

    // ============================================
    // STOCK LEVELS
    // ============================================
    // Total stock currently in this location
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stock reserved for pending orders (in cart, awaiting payment)
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stock incoming (on order from supplier)
    incoming: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============================================
    // ALERTS
    // ============================================
    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    // Notify merchant when stock drops below threshold
    lowStockAlertEnabled: { type: Boolean, default: true },
    lastLowStockAlertAt: { type: Date },

    // ============================================
    // SKU (for quick lookup)
    // ============================================
    sku: { type: String },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
InventorySchema.index({ store: 1, product: 1, variant: 1 }, { unique: true });
InventorySchema.index({ store: 1, sku: 1 });

// ============================================
// VIRTUAL: Available stock (quantity minus reserved)
// ============================================
InventorySchema.virtual('available').get(function () {
  return Math.max(0, this.quantity - this.reserved);
});

// ============================================
// VIRTUAL: Is low stock?
// ============================================
InventorySchema.virtual('isLowStock').get(function () {
  return this.available <= this.lowStockThreshold;
});

// ============================================
// VIRTUAL: Is out of stock?
// ============================================
InventorySchema.virtual('isOutOfStock').get(function () {
  return this.available <= 0;
});

InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', InventorySchema);

export default Inventory;