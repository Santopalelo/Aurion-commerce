import mongoose from 'mongoose';
import Order from '../../models/orders/Order.model.js';
import Product from '../../models/catalog/Product.model.js';
import Customer from '../../models/customers/Customer.model.js';
import Payment from '../../models/payments/Payment.model.js';
import InventoryLog from '../../models/inventory/InventoryLog.model.js';
import stripe from '../../config/stripe.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/storefront/:storeSlug/orders/create
 * @desc    Create an order after successful Stripe payment
 * @access  Public
 *
 * Body:
 *   paymentIntentId: string (from Stripe)
 *   items: [{ productId, quantity }]
 *   customer: { email, firstName, lastName, phone }
 *   shippingAddress: { ... }
 *   billingAddress: { ... } (optional, defaults to shipping)
 *   notes: string (optional)
 */
export const createOrder = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(500, 'Payment system not configured', 'STRIPE_NOT_CONFIGURED');
  }

  const { store } = req;
  const {
    paymentIntentId,
    items,
    customer: customerData,
    shippingAddress,
    billingAddress,
    notes,
  } = req.body;

  // ============================================
  // Step 1: Validate input
  // ============================================
  if (!paymentIntentId) {
    throw new ApiError(400, 'Payment intent ID is required', 'NO_PAYMENT_INTENT');
  }
  if (!items || items.length === 0) {
    throw new ApiError(400, 'No items provided', 'EMPTY_CART');
  }
  if (!customerData?.email) {
    throw new ApiError(400, 'Customer email is required', 'NO_EMAIL');
  }

  // ============================================
  // Step 2: Verify payment with Stripe
  // (CRITICAL: Always verify on server before creating order!)
  // ============================================
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }

  // Verify the payment belongs to this store
  if (paymentIntent.metadata?.storeId !== store._id.toString()) {
    throw new ApiError(403, 'Payment does not match this store', 'STORE_MISMATCH');
  }

  // Check payment status
  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(
      400,
      `Payment not completed. Status: ${paymentIntent.status}`,
      'PAYMENT_NOT_COMPLETED'
    );
  }

  // ============================================
  // Step 3: Check if order already exists for this payment
  // (Idempotency - prevent duplicate orders)
  // ============================================
  const existingOrder = await Order.findOne({
    'payment.stripePaymentIntentId': paymentIntentId,
  });

  if (existingOrder) {
    return res.status(200).json(
      ApiResponse.success('Order already exists', {
        order: {
          _id: existingOrder._id,
          orderNumber: existingOrder.orderNumber,
          status: existingOrder.status,
          total: existingOrder.pricing.total,
        },
      })
    );
  }

  // ============================================
  // Step 4: Load all products and verify inventory again
  // ============================================
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    store: store._id,
  });

  if (products.length !== items.length) {
    throw new ApiError(400, 'Some products no longer exist', 'PRODUCTS_NOT_FOUND');
  }

  // ============================================
  // Step 5: Start transaction to create everything atomically
  // ============================================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ============================================
    // Step 5a: Build order line items (snapshots)
    // ============================================
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId
      );

      const quantity = Number(cartItem.quantity);
      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      // Get primary image
      const primaryImage =
        product.images?.find((img) => img.isPrimary) || product.images?.[0];

      orderItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku || '',
        image: primaryImage?.url || '',
        price: product.price,
        quantity,
        totalPrice: itemTotal,
        weight: product.weight?.value || 0,
        requiresShipping: product.isPhysical !== false,
        fulfillmentStatus: 'unfulfilled',
      });
    }

    // ============================================
    // Step 5b: Calculate totals (match payment intent)
    // ============================================
    const shippingCost = subtotal >= 50 ? 0 : 5;
    const taxAmount = subtotal * 0.08;
    const totalAmount = subtotal + shippingCost + taxAmount;

    // ============================================
    // Step 5c: Find or create customer (guest checkout)
    // ============================================
    let customer = await Customer.findOne({
      store: store._id,
      email: customerData.email.toLowerCase(),
    });

    if (!customer) {
      customer = new Customer({
        store: store._id,
        firstName: customerData.firstName || shippingAddress.firstName,
        lastName: customerData.lastName || shippingAddress.lastName,
        email: customerData.email.toLowerCase(),
        phone: customerData.phone || shippingAddress.phone,
        isGuest: true,
        source: 'checkout',
        addresses: [
          {
            label: 'home',
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            country: shippingAddress.country,
            zipCode: shippingAddress.zipCode,
            phone: shippingAddress.phone || customerData.phone,
            isDefault: true,
          },
        ],
        stats: {
          totalOrders: 1,
          totalSpent: totalAmount,
          averageOrderValue: totalAmount,
          firstOrderAt: new Date(),
          lastOrderAt: new Date(),
        },
        acceptsMarketing: customerData.acceptsMarketing || false,
      });
      await customer.save({ session });
    } else {
      // Update stats for returning customer
      customer.stats.totalOrders += 1;
      customer.stats.totalSpent += totalAmount;
      customer.stats.averageOrderValue =
        customer.stats.totalSpent / customer.stats.totalOrders;
      customer.stats.lastOrderAt = new Date();
      await customer.save({ session });
    }

    // ============================================
    // Step 5d: Create the order
    // ============================================
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
      items: orderItems,
      pricing: {
        subtotal,
        shippingCost,
        taxAmount,
        discountAmount: 0,
        total: totalAmount,
        currency: store.currency || 'USD',
      },
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        country: shippingAddress.country,
        zipCode: shippingAddress.zipCode,
        phone: shippingAddress.phone || customerData.phone,
      },
      billingAddress: billingAddress || {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        country: shippingAddress.country,
        zipCode: shippingAddress.zipCode,
        sameAsShipping: !billingAddress,
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      fulfillmentStatus: 'unfulfilled',
      payment: {
        method: 'stripe',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: paymentIntent.latest_charge,
        paidAmount: totalAmount,
        paidAt: new Date(),
      },
      customerNote: notes || '',
      channel: 'online',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await order.save({ session });

    // ============================================
    // Step 5e: Create Payment record
    // ============================================
    const payment = new Payment({
      store: store._id,
      order: order._id,
      customer: customer._id,
      type: 'charge',
      method: 'stripe',
      amount: totalAmount,
      currency: store.currency || 'USD',
      status: 'succeeded',
      stripe: {
        paymentIntentId: paymentIntent.id,
        chargeId: paymentIntent.latest_charge,
        customerId: paymentIntent.customer || null,
        receiptEmail: paymentIntent.receipt_email,
      },
      paidAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await payment.save({ session });

    // ============================================
    // Step 5f: Deduct inventory
    // ============================================
    for (const cartItem of items) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId
      );

      if (product.trackInventory) {
        const quantityBefore = product.inventoryQuantity;
        const newQuantity = Math.max(0, quantityBefore - cartItem.quantity);

        product.inventoryQuantity = newQuantity;
        product.totalSold = (product.totalSold || 0) + cartItem.quantity;
        await product.save({ session });

        // Log inventory change
        const inventoryLog = new InventoryLog({
          store: store._id,
          inventory: product._id, // Using product ID since we don't have separate inventory docs
          product: product._id,
          type: 'order_paid',
          quantityChange: -cartItem.quantity,
          quantityBefore,
          quantityAfter: newQuantity,
          referenceType: 'order',
          referenceId: order._id,
          referenceModel: 'Order',
          note: `Order ${order.orderNumber}`,
        });
        await inventoryLog.save({ session });
      }
    }

    // ============================================
    // Step 6: Commit transaction
    // ============================================
    await session.commitTransaction();
    session.endSession();

    // ============================================
    // Step 7: Return order details
    // ============================================
    return res.status(201).json(
      ApiResponse.success('Order created successfully', {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.pricing.total,
          currency: order.pricing.currency,
          items: order.items.length,
          customerEmail: customer.email,
          createdAt: order.createdAt,
        },
      })
    );
  } catch (error) {
    // Rollback on any error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/orders/:orderNumber
 * @desc    Get order details by order number (for success page)
 * @access  Public (limited info)
 */
export const getOrderByNumber = asyncHandler(async (req, res) => {
  const { store } = req;
  const { orderNumber } = req.params;
  const { email } = req.query;

  if (!email) {
    throw new ApiError(400, 'Email is required to view order', 'NO_EMAIL');
  }

  const order = await Order.findOne({
    store: store._id,
    orderNumber: orderNumber.toUpperCase(),
    'customerSnapshot.email': email.toLowerCase(),
  });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  // Return public-safe order data
  return res.status(200).json(
    ApiResponse.success('Order retrieved', {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        items: order.items,
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        customerSnapshot: order.customerSnapshot,
        shipping: order.shipping,
        createdAt: order.createdAt,
      },
    })
  );
});