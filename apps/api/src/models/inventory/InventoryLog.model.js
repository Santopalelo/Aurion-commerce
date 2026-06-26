import mongoose from 'mongoose';

/**
 * InventoryLog Schema
 *
 * Records every change to inventory levels.
 * This is an immutable audit trail — once written, never modified.
 */
const InventoryLogSchema = new mongoose.Schema(
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
    // WHAT CHANGED
    // ============================================
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
    },

    // ============================================
    // CHANGE DETAILS
    // ============================================
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_paid',
        'order_cancelled',
        'order_refunded',
        'manual_adjustment',
        'restock',
        'damaged',
        'lost',
        'returned',
        'initial',
      ],
      required: true,
    },

    quantityChange: {
      type: Number,
      required: true,
    },

    quantityBefore: {
      type: Number,
      required: true,
    },

    quantityAfter: {
      type: Number,
      required: true,
    },

    // ============================================
    // REFERENCE
    // ============================================
    referenceType: {
      type: String,
      enum: ['order', 'manual', 'system', 'import'],
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },

    referenceModel: {
      type: String,
      enum: ['Order', 'User', null],
    },

    // ============================================
    // METADATA
    // ============================================
    note: { type: String },

    performedBy: {
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
InventoryLogSchema.index({ store: 1, inventory: 1, createdAt: -1 });
InventoryLogSchema.index({ store: 1, product: 1, createdAt: -1 });
InventoryLogSchema.index({ store: 1, type: 1 });
InventoryLogSchema.index({ referenceId: 1 });

const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);

export default InventoryLog;