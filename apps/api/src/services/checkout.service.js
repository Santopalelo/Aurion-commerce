import mongoose from 'mongoose';
import Order from '../models/orders/Order.model.js';
import Product from '../models/catalog/Product.model.js';
import Customer from '../models/customers/Customer.model.js';
import Payment from '../models/payments/Payment.model.js';
import InventoryLog from '../models/inventory/InventoryLog.model.js';
import CheckoutSession from '../models/checkout/CheckoutSession.model.js';
import Store from '../models/tenant/Store.model.js';
import ApiError from '../utils/ApiError.js';
import { toStripeAmount } from '../utils/currency.js';
import { recordDiscountUsage } from './discount.service.js';

/**
 * Checkout Service
 *
 * Turns a paid checkout into an Order + a Payment record and deducts stock.
 *
 * WHY A SERVICE AND NOT A CONTROLLER
 * ---------------------------------
 * Two different callers need to do the exact same thing:
 *
 *   1. The browser, right after Stripe.js confirms the payment.
 *   2. The Stripe webhook, when Stripe tells us the money landed.
 *
 * If those lived in two places they would drift, and worse, they could both
 * run for the same payment and create two orders. This module is the ONE
 * implementation both call, and it is written to be safely re-entrant.
 *
 * IDEMPOTENCY
 * -----------
 * Stripe retries webhooks until it gets a 2xx, and the browser may call
 * `orders/create` at the same moment the webhook arrives. Both paths can
 * therefore run for the same payment. The guards below make that harmless:
 *
 *   1. If the session already points at an order, return that order.
 *   2. If an order already exists for this payment intent, return that order.
 *   3. A unique index on `payment.stripePaymentIntentId` makes a double
 *      insert impossible at the database level — we catch the duplicate key
 *      error and return the order the other caller won with.
 *
 * The result: one payment always produces exactly one order.
 */

/**
 * Find the checkout session that belongs to a Stripe payment intent.
 *
 * @param {string} paymentIntentId - e.g. "pi_123abc"
 * @returns {Promise<object|null>}
 */
export const findSessionByPaymentIntent = async (paymentIntentId) => {
  if (!paymentIntentId) return null;
  return CheckoutSession.findOne({ paymentIntentId });
};

/**
 * Find the checkout session referenced by a Stripe PaymentIntent's metadata.
 *
 * @param {object} paymentIntent - Stripe PaymentIntent object
 * @returns {Promise<object|null>}
 */
export const findSessionByMetadata = async (paymentIntent) => {
  const sessionId = paymentIntent?.metadata?.checkoutSessionId;
  if (!sessionId) return null;
  return CheckoutSession.findById(sessionId);
};

/**
 * Find or create the customer for a checkout session.
 *
 * Customers are scoped per store, so the same email can be a customer in
 * several stores without them being the same person.
 */
const upsertCustomer = async (checkoutSession, store, dbSession) => {
  const email = checkoutSession.customer.email.toLowerCase();

  const customer = await Customer.findOne({
    store: store._id,
    email,
  });

  const total = checkoutSession.pricing.total;

  if (customer) {
    // Returning customer — update the denormalized stats
    customer.stats.totalOrders += 1;
    customer.stats.totalSpent += total;
    customer.stats.averageOrderValue =
      customer.stats.totalSpent / customer.stats.totalOrders;
    customer.stats.lastOrderAt = new Date();
    await customer.save({ session: dbSession });
    return customer;
  }

  const newCustomer = new Customer({
    store: store._id,
    firstName: checkoutSession.customer.firstName,
    lastName: checkoutSession.customer.lastName,
    email,
    phone: checkoutSession.customer.phone,
    isGuest: true,
    source: 'checkout',
    addresses: [
      {
        label: 'home',
        firstName: checkoutSession.shippingAddress.firstName,
        lastName: checkoutSession.shippingAddress.lastName,
        line1: checkoutSession.shippingAddress.line1,
        line2: checkoutSession.shippingAddress.line2 || '',
        city: checkoutSession.shippingAddress.city,
        state: checkoutSession.shippingAddress.state || '',
        country: checkoutSession.shippingAddress.country,
        zipCode: checkoutSession.shippingAddress.zipCode,
        phone: checkoutSession.shippingAddress.phone,
        isDefault: true,
      },
    ],
    stats: {
      totalOrders: 1,
      totalSpent: total,
      averageOrderValue: total,
      firstOrderAt: new Date(),
      lastOrderAt: new Date(),
    },
    acceptsMarketing: checkoutSession.customer.acceptsMarketing || false,
  });

  await newCustomer.save({ session: dbSession });
  return newCustomer;
};

/**
 * Deduct stock and write the inventory audit trail.
 *
 * WHY THIS IS AN ATOMIC CONDITIONAL UPDATE
 * -----------------------------------------
 * The old code read the quantity, subtracted, and clamped at zero:
 *
 *     const quantityBefore = product.inventoryQuantity;
 *     const newQuantity = Math.max(0, quantityBefore - item.quantity);
 *
 * Two problems. It is a read-modify-write, so two concurrent orders
 * overwrite each other. And `Math.max(0, …)` silently swallows the
 * shortfall — the last item can be sold twice and the ledger still says the
 * stock is zero, as if nothing was oversold.
 *
 * The update below only fires when there is genuinely enough stock:
 *
 *     Product.updateOne(
 *       { _id, inventoryQuantity: { $gte: quantity } },
 *       { $inc: { inventoryQuantity: -quantity, totalSold: quantity } }
 *     )
 *
 * If `matchedCount` is 0 the stock was gone. The money has already been
 * taken, so the order is still created — but it is put on hold and the
 * shortfall is recorded, instead of being quietly swallowed.
 *
 * @returns {Promise<{ shortages: Array<{ product: string, title: string, requested: number, available: number }> }>}
 */
const deductInventory = async (checkoutSession, order, dbSession) => {
  const productIds = checkoutSession.items.map((item) => item.product);
  const products = await Product.find({
    _id: { $in: productIds },
    store: order.store,
  }).session(dbSession);

  const shortages = [];

  for (const item of checkoutSession.items) {
    const product = products.find((p) => p._id.toString() === item.product.toString());
    if (!product || !product.trackInventory) continue;

    const quantityBefore = product.inventoryQuantity;

    const result = await Product.updateOne(
      {
        _id: product._id,
        inventoryQuantity: { $gte: item.quantity },
      },
      {
        $inc: {
          inventoryQuantity: -item.quantity,
          totalSold: item.quantity,
        },
      },
      { session: dbSession }
    );

    if (result.matchedCount === 0) {
      // Not enough stock left. The payment already went through, so the
      // order stands — but the merchant has to know.
      const available = await Product.findById(product._id)
        .session(dbSession)
        .select('inventoryQuantity');

      shortages.push({
        product: product._id.toString(),
        title: item.title,
        requested: item.quantity,
        available: available?.inventoryQuantity ?? 0,
      });

      // Take whatever IS left, and record the true movement.
      const taken = Math.min(available?.inventoryQuantity ?? 0, item.quantity);
      if (taken > 0) {
        await Product.updateOne(
          { _id: product._id },
          {
            $inc: {
              inventoryQuantity: -taken,
              totalSold: taken,
            },
          },
          { session: dbSession }
        );
      }

      const inventoryLog = new InventoryLog({
        store: order.store,
        inventory: product._id, // Using product ID since we don't have separate inventory docs
        product: product._id,
        type: 'order_paid',
        quantityChange: -taken,
        quantityBefore,
        quantityAfter: Math.max(0, quantityBefore - taken),
        referenceType: 'order',
        referenceId: order._id,
        referenceModel: 'Order',
        note: `Order ${order.orderNumber} — oversold: ${item.quantity} ordered, ${taken} available`,
      });
      await inventoryLog.save({ session: dbSession });

      continue;
    }

    const inventoryLog = new InventoryLog({
      store: order.store,
      inventory: product._id, // Using product ID since we don't have separate inventory docs
      product: product._id,
      type: 'order_paid',
      quantityChange: -item.quantity,
      quantityBefore,
      quantityAfter: Math.max(0, quantityBefore - item.quantity),
      referenceType: 'order',
      referenceId: order._id,
      referenceModel: 'Order',
      note: `Order ${order.orderNumber}`,
    });
    await inventoryLog.save({ session: dbSession });
  }

  return { shortages };
};

/**
 * Mark a checkout session as completed and link it to its order.
 */
const completeSession = async (checkoutSession, orderId, dbSession = null) => {
  checkoutSession.status = 'completed';
  checkoutSession.order = orderId;
  checkoutSession.completedAt = checkoutSession.completedAt || new Date();
  await checkoutSession.save(dbSession ? { session: dbSession } : undefined);
};

/**
 * Finalize a paid checkout: create the Order, the Payment, deduct stock.
 *
 * Safe to call more than once for the same payment — see the idempotency
 * notes at the top of this file.
 *
 * @param {object} options
 * @param {object} options.checkoutSession - The CheckoutSession to finalize
 * @param {object} options.paymentIntent - The (succeeded) Stripe PaymentIntent
 * @param {string} [options.ipAddress] - Customer IP
 * @param {string} [options.userAgent] - Customer user agent
 * @returns {Promise<object>} The Order document
 */
export const finalizeCheckout = async ({
  checkoutSession,
  paymentIntent,
  ipAddress,
  userAgent,
}) => {
  if (!checkoutSession) {
    throw new ApiError(
      404,
      'Checkout session not found',
      'CHECKOUT_SESSION_NOT_FOUND'
    );
  }

  if (checkoutSession.status === 'failed') {
    throw new ApiError(
      400,
      'This checkout session has already failed',
      'CHECKOUT_SESSION_FAILED'
    );
  }

  // ---------------------------------------------------------------
  // IDEMPOTENCY GATE 1 — this session already produced an order
  // ---------------------------------------------------------------
  if (checkoutSession.order) {
    const existing = await Order.findById(checkoutSession.order);
    if (existing) return existing;
  }

  // ---------------------------------------------------------------
  // IDEMPOTENCY GATE 2 — an order already exists for this payment intent
  // ---------------------------------------------------------------
  const existingByIntent = await Order.findOne({
    'payment.stripePaymentIntentId': paymentIntent.id,
  });
  if (existingByIntent) {
    await completeSession(checkoutSession, existingByIntent._id);
    return existingByIntent;
  }

  const store = await Store.findById(checkoutSession.store);
  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  const currency = checkoutSession.pricing.currency || store.currency || 'USD';

  // ---------------------------------------------------------------
  // INTEGRITY CHECK — the money Stripe took must match our snapshot
  // ---------------------------------------------------------------
  const expectedAmount = toStripeAmount(checkoutSession.pricing.total, currency);
  if (paymentIntent.amount !== expectedAmount) {
    throw new ApiError(
      400,
      'Payment amount does not match the checkout total',
      'PAYMENT_AMOUNT_MISMATCH'
    );
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Re-check inside the transaction — the browser and the webhook can race
    const raceWinner = await Order.findOne({
      'payment.stripePaymentIntentId': paymentIntent.id,
    });
    if (raceWinner) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      await completeSession(checkoutSession, raceWinner._id);
      return raceWinner;
    }

    // ---------------------------------------------------------------
    // Customer
    // ---------------------------------------------------------------
    const customer = await upsertCustomer(checkoutSession, store, dbSession);

    // ---------------------------------------------------------------
    // Order
    // ---------------------------------------------------------------
    const order = new Order({
      store: store._id,
      customer: customer._id,
      customerSnapshot: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
      isGuestOrder: customer.isGuest,
      items: checkoutSession.items.map((item) => ({
        product: item.product,
        title: item.title,
        sku: item.sku || '',
        image: item.image || '',
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        weight: item.weight || 0,
        requiresShipping: item.requiresShipping !== false,
        fulfillmentStatus: 'unfulfilled',
      })),
      pricing: {
        subtotal: checkoutSession.pricing.subtotal,
        shippingCost: checkoutSession.pricing.shippingCost,
        taxAmount: checkoutSession.pricing.taxAmount,
        discountAmount: checkoutSession.pricing.discountAmount,
        total: checkoutSession.pricing.total,
        currency,
      },
      // The discount that was applied, copied from the server-side session.
      // The amount is the one we calculated, never one sent by the browser.
      discount: checkoutSession.discount?.code
        ? {
            code: checkoutSession.discount.code,
            discountId: checkoutSession.discount.discountId,
            type: checkoutSession.discount.type,
            value: checkoutSession.discount.value,
            amountSaved: checkoutSession.discount.amountSaved,
          }
        : undefined,
      shippingAddress: {
        firstName: checkoutSession.shippingAddress.firstName,
        lastName: checkoutSession.shippingAddress.lastName,
        line1: checkoutSession.shippingAddress.line1,
        line2: checkoutSession.shippingAddress.line2 || '',
        city: checkoutSession.shippingAddress.city,
        state: checkoutSession.shippingAddress.state || '',
        country: checkoutSession.shippingAddress.country,
        zipCode: checkoutSession.shippingAddress.zipCode,
        phone: checkoutSession.shippingAddress.phone,
      },
      billingAddress: checkoutSession.billingAddress?.line1
        ? {
            firstName: checkoutSession.billingAddress.firstName,
            line1: checkoutSession.billingAddress.line1,
            line2: checkoutSession.billingAddress.line2 || '',
            city: checkoutSession.billingAddress.city,
            state: checkoutSession.billingAddress.state || '',
            country: checkoutSession.billingAddress.country,
            zipCode: checkoutSession.billingAddress.zipCode,
            sameAsShipping: false,
          }
        : {
            firstName: checkoutSession.shippingAddress.firstName,
            lastName: checkoutSession.shippingAddress.lastName,
            line1: checkoutSession.shippingAddress.line1,
            line2: checkoutSession.shippingAddress.line2 || '',
            city: checkoutSession.shippingAddress.city,
            state: checkoutSession.shippingAddress.state || '',
            country: checkoutSession.shippingAddress.country,
            zipCode: checkoutSession.shippingAddress.zipCode,
            sameAsShipping: true,
          },
      status: 'confirmed',
      paymentStatus: 'paid',
      fulfillmentStatus: 'unfulfilled',
      payment: {
        method: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge,
        stripeCustomerId: paymentIntent.customer || undefined,
        paidAmount: checkoutSession.pricing.total,
        paidAt: new Date(),
      },
      customerNote: checkoutSession.notes || '',
      channel: checkoutSession.channel || 'online',
      ipAddress: ipAddress || checkoutSession.ipAddress,
      userAgent: userAgent || checkoutSession.userAgent,
    });

    await order.save({ session: dbSession });

    // ---------------------------------------------------------------
    // Inventory
    //
    // Runs after the order exists because the audit trail references the
    // order number. If the stock turned out to be gone, the order is put on
    // hold rather than the shortfall being swallowed — the money has already
    // been taken, so the order stands, but the merchant has to know.
    // ---------------------------------------------------------------
    const { shortages } = await deductInventory(checkoutSession, order, dbSession);

    if (shortages.length > 0) {
      const summary = shortages
        .map((s) => `${s.title}: ${s.requested} ordered, ${s.available} available`)
        .join('; ');

      for (const shortage of shortages) {
        const item = order.items.find(
          (i) => i.product.toString() === shortage.product
        );
        if (item) item.fulfillmentStatus = 'partial';
      }

      order.status = 'on_hold';
      order.addStatusChange(
        'status',
        'confirmed',
        'on_hold',
        `Insufficient stock at order time — ${summary}`
      );
      order.merchantNotes.push({
        note: `Oversold at checkout — ${summary}. The customer has already paid, so this order was held for review instead of being dropped.`,
      });

      await order.save({ session: dbSession });
    }

    // ---------------------------------------------------------------
    // Payment record
    // ---------------------------------------------------------------
    const payment = new Payment({
      store: store._id,
      order: order._id,
      customer: customer._id,
      type: 'charge',
      method: 'stripe',
      amount: checkoutSession.pricing.total,
      currency,
      status: 'succeeded',
      stripe: {
        paymentIntentId: paymentIntent.id,
        chargeId: paymentIntent.latest_charge,
        customerId: paymentIntent.customer || null,
        receiptEmail: paymentIntent.receipt_email,
        receiptUrl: paymentIntent.receipt_url || undefined,
      },
      description: `Order ${order.orderNumber}`,
      paidAt: new Date(),
      ipAddress: ipAddress || checkoutSession.ipAddress,
      userAgent: userAgent || checkoutSession.userAgent,
    });

    await payment.save({ session: dbSession });

    // ---------------------------------------------------------------
    // Discount usage
    //
    // Counted here — after the order exists — so a payment that fails never
    // burns one of the merchant's uses.
    // ---------------------------------------------------------------
    if (checkoutSession.discount?.discountId) {
      await recordDiscountUsage(checkoutSession.discount.discountId);
    }

    // ---------------------------------------------------------------
    // Link the session to the order
    // ---------------------------------------------------------------
    await completeSession(checkoutSession, order._id, dbSession);

    await dbSession.commitTransaction();
    dbSession.endSession();

    return order;
  } catch (error) {
    // The unique index on payment.stripePaymentIntentId rejected a duplicate.
    // That means the other caller (browser or webhook) won the race — return
    // their order instead of failing.
    if (error.code === 11000) {
      await dbSession.abortTransaction();
      dbSession.endSession();

      const winner = await Order.findOne({
        'payment.stripePaymentIntentId': paymentIntent.id,
      });
      if (winner) {
        await completeSession(checkoutSession, winner._id);
        return winner;
      }
    }

    await dbSession.abortTransaction();
    dbSession.endSession();
    throw error;
  }
};
