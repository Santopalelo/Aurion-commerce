import mongoose from 'mongoose';

/**
 * Payment Schema
 *
 * Records every payment transaction.
 *
 * One order can have MULTIPLE payments:
 * - Initial payment
 * - Partial refunds
 * - Additional charges
 *
 * This provides a complete financial audit trail per order.
 */
const PaymentSchema = new mongoose.Schema(
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
    // RELATED ORDER
    // ============================================
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    // ============================================
    // CUSTOMER
    // ============================================
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },

    // ============================================
    // PAYMENT IDENTITY
    // ============================================
    // Unique payment reference (auto-generated)
    paymentNumber: {
      type: String,
      required: true,
    },

    // ============================================
    // PAYMENT TYPE
    // ============================================
    type: {
      type: String,
      enum: ['charge', 'refund', 'partial_refund', 'authorization', 'capture', 'void'],
      required: true,
      default: 'charge',
    },

    // ============================================
    // PAYMENT METHOD
    // ============================================
    method: {
      type: String,
      enum: [
        'stripe',
        'paypal',
        'cash_on_delivery',
        'bank_transfer',
        'manual',
        'wallet',
      ],
      required: true,
    },

    // Card details (for display only — masked)
    cardBrand: { type: String },     // visa, mastercard, amex
    cardLast4: { type: String },     // Last 4 digits only
    cardExpMonth: { type: Number },
    cardExpYear: { type: Number },

    // ============================================
    // AMOUNTS
    // ============================================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'USD',
    },

    // Platform fee Aurion takes from merchant
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stripe processing fee
    processingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Net amount to merchant (amount - fees)
    netAmount: {
      type: Number,
      min: 0,
    },

    // ============================================
    // STATUS
    // ============================================
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'succeeded',
        'failed',
        'cancelled',
        'refunded',
        'requires_action',
      ],
      default: 'pending',
      required: true,
    },

    // ============================================
    // STRIPE-SPECIFIC FIELDS
    // ============================================
    stripe: {
      paymentIntentId: { type: String, index: true },
      chargeId: { type: String },
      customerId: { type: String },
      paymentMethodId: { type: String },
      refundId: { type: String },

      // Stripe response details
      receiptUrl: { type: String },
      receiptEmail: { type: String },
    },

    // ============================================
    // REFUND DETAILS (if type is refund)
    // ============================================
    refund: {
      originalPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
      },
      reason: {
        type: String,
        enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'product_unavailable', 'other'],
      },
      reasonDetails: { type: String },
    },

    // ============================================
    // FAILURE DETAILS
    // ============================================
    failure: {
      code: { type: String },
      message: { type: String },
      declineCode: { type: String },
    },

    // ============================================
    // TIMESTAMPS
    // ============================================
    paidAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    cancelledAt: { type: Date },

    // ============================================
    // METADATA
    // ============================================
    description: { type: String },

    // IP and user agent at time of payment
    ipAddress: { type: String },
    userAgent: { type: String },

    // Who processed this payment (null = customer self-checkout)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Notes for merchant/admin
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
PaymentSchema.index({ store: 1, paymentNumber: 1 }, { unique: true });
PaymentSchema.index({ store: 1, order: 1 });
PaymentSchema.index({ store: 1, status: 1 });
PaymentSchema.index({ store: 1, customer: 1 });
PaymentSchema.index({ store: 1, createdAt: -1 });
PaymentSchema.index({ 'stripe.paymentIntentId': 1 });
PaymentSchema.index({ 'stripe.chargeId': 1 });

// ============================================
// PRE-SAVE: Generate payment number
// ============================================
PaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentNumber) {
    try {
      const count = await mongoose.model('Payment').countDocuments({
        store: this.store,
      });
      this.paymentNumber = `PAY-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }

  // Calculate net amount
  if (this.amount && this.isModified('amount')) {
    this.netAmount = this.amount - (this.platformFee || 0) - (this.processingFee || 0);
  }

  next();
});

// ============================================
// VIRTUAL: Is successful?
// ============================================
PaymentSchema.virtual('isSuccessful').get(function () {
  return this.status === 'succeeded';
});

// ============================================
// VIRTUAL: Is refund?
// ============================================
PaymentSchema.virtual('isRefund').get(function () {
  return ['refund', 'partial_refund'].includes(this.type);
});

PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;