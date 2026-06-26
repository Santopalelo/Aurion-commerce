import mongoose from 'mongoose';
import Order from '../../models/orders/Order.model.js';
import Product from '../../models/catalog/Product.model.js';
import InventoryLog from '../../models/inventory/InventoryLog.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders for the current store
 * @access  Private (orders:read)
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { store } = req;
  const {
    search,
    status,
    paymentStatus,
    fulfillmentStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  // Build query
  const query = { store: store._id };

  if (status && status !== 'all') query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (fulfillmentStatus) query.fulfillmentStatus = fulfillmentStatus;

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customerSnapshot.email': { $regex: search, $options: 'i' } },
      { 'customerSnapshot.firstName': { $regex: search, $options: 'i' } },
      { 'customerSnapshot.lastName': { $regex: search, $options: 'i' } },
    ];
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'email firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query),
  ]);

  // Calculate aggregate stats
  const stats = await Order.aggregate([
    { $match: { store: store._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        processing: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
        },
        shipped: {
          $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        unfulfilled: {
          $sum: {
            $cond: [{ $eq: ['$fulfillmentStatus', 'unfulfilled'] }, 1, 0],
          },
        },
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Orders retrieved successfully', orders, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      stats: stats[0] || {
        total: 0,
        totalRevenue: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        unfulfilled: 0,
      },
    })
  );
});

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get single order by ID
 * @access  Private (orders:read)
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const order = await Order.findOne({
    _id: id,
    store: store._id,
  })
    .populate('customer', 'email firstName lastName phone addresses stats')
    .populate('items.product', 'title slug images sku')
    .populate('statusHistory.changedBy', 'firstName lastName email')
    .populate('merchantNotes.author', 'firstName lastName email');

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  return res.status(200).json(
    ApiResponse.success('Order retrieved successfully', { order })
  );
});

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (orders:update)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await Order.findOne({ _id: id, store: store._id });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  const previousStatus = order.status;

  // Don't allow updating cancelled or refunded orders back
  if (['cancelled', 'refunded'].includes(previousStatus) && status !== previousStatus) {
    throw new ApiError(
      400,
      `Cannot change status of ${previousStatus} orders`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  order.status = status;

  // Add to status history
  order.statusHistory.push({
    type: 'status',
    from: previousStatus,
    to: status,
    note: note || '',
    changedBy: user._id,
    changedAt: new Date(),
  });

  // Auto-update related fields based on status
  if (status === 'shipped' && !order.shipping?.shippedAt) {
    order.shipping = order.shipping || {};
    order.shipping.shippedAt = new Date();
  }
  if (status === 'delivered' && !order.shipping?.deliveredAt) {
    order.shipping = order.shipping || {};
    order.shipping.deliveredAt = new Date();
    if (!order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date();
    }
  }

  await order.save();

  return res.status(200).json(
    ApiResponse.success('Order status updated', { order })
  );
});

/**
 * @route   PUT /api/v1/orders/:id/fulfillment
 * @desc    Update fulfillment info (tracking, carrier, etc.)
 * @access  Private (orders:update)
 */
export const updateFulfillment = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const {
    fulfillmentStatus,
    carrier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    shippingMethod,
    note,
  } = req.body;

  const order = await Order.findOne({ _id: id, store: store._id });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  // Update shipping info
  order.shipping = order.shipping || {};
  if (carrier !== undefined) order.shipping.carrier = carrier;
  if (trackingNumber !== undefined) order.shipping.trackingNumber = trackingNumber;
  if (trackingUrl !== undefined) order.shipping.trackingUrl = trackingUrl;
  if (estimatedDelivery !== undefined) order.shipping.estimatedDelivery = estimatedDelivery;
  if (shippingMethod !== undefined) order.shipping.method = shippingMethod;

  // Update fulfillment status
  if (fulfillmentStatus) {
    const previousFulfillment = order.fulfillmentStatus;
    order.fulfillmentStatus = fulfillmentStatus;

    // If marking as fulfilled, set shipped date and update order status
    if (fulfillmentStatus === 'fulfilled') {
      if (!order.shipping.shippedAt) {
        order.shipping.shippedAt = new Date();
      }

      // Auto-progress order status
      if (order.status === 'confirmed' || order.status === 'processing') {
        order.statusHistory.push({
          type: 'status',
          from: order.status,
          to: 'shipped',
          note: 'Auto-updated when fulfillment marked complete',
          changedBy: user._id,
          changedAt: new Date(),
        });
        order.status = 'shipped';
      }
    }

    order.statusHistory.push({
      type: 'fulfillment',
      from: previousFulfillment,
      to: fulfillmentStatus,
      note: note || '',
      changedBy: user._id,
      changedAt: new Date(),
    });
  }

  await order.save();

  return res.status(200).json(
    ApiResponse.success('Fulfillment updated', { order })
  );
});

/**
 * @route   POST /api/v1/orders/:id/notes
 * @desc    Add a merchant note to an order
 * @access  Private (orders:update)
 */
export const addOrderNote = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const { note } = req.body;

  const order = await Order.findOne({ _id: id, store: store._id });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  order.merchantNotes.push({
    note,
    author: user._id,
    createdAt: new Date(),
  });

  await order.save();

  // Reload with populated notes
  await order.populate('merchantNotes.author', 'firstName lastName email');

  return res.status(200).json(
    ApiResponse.success('Note added', {
      notes: order.merchantNotes,
    })
  );
});

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel an order (optionally restock inventory)
 * @access  Private (orders:update)
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const { reason, restockItems = true } = req.body;

  const order = await Order.findOne({ _id: id, store: store._id });

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Order is already cancelled', 'ALREADY_CANCELLED');
  }

  if (order.status === 'delivered') {
    throw new ApiError(
      400,
      'Cannot cancel a delivered order. Process a refund instead.',
      'CANNOT_CANCEL_DELIVERED'
    );
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousStatus = order.status;

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledReason = reason || '';
    order.cancelledBy = user._id;

    order.statusHistory.push({
      type: 'status',
      from: previousStatus,
      to: 'cancelled',
      note: reason || 'Order cancelled by merchant',
      changedBy: user._id,
      changedAt: new Date(),
    });

    // Restock inventory if requested
    if (restockItems) {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product).session(session);

          if (product && product.trackInventory) {
            const quantityBefore = product.inventoryQuantity;
            const newQuantity = quantityBefore + item.quantity;

            product.inventoryQuantity = newQuantity;
            product.totalSold = Math.max(
              0,
              (product.totalSold || 0) - item.quantity
            );
            await product.save({ session });

            // Log inventory change
            const inventoryLog = new InventoryLog({
              store: store._id,
              inventory: product._id,
              product: product._id,
              type: 'order_cancelled',
              quantityChange: item.quantity,
              quantityBefore,
              quantityAfter: newQuantity,
              referenceType: 'order',
              referenceId: order._id,
              referenceModel: 'Order',
              note: `Order ${order.orderNumber} cancelled - inventory restored`,
              performedBy: user._id,
            });
            await inventoryLog.save({ session });
          }
        }
      }

      order.fulfillmentStatus = 'restocked';
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      ApiResponse.success('Order cancelled successfully', {
        order,
        inventoryRestored: restockItems,
      })
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @route   GET /api/v1/orders/stats/overview
 * @desc    Get order stats for dashboard overview
 * @access  Private (orders:read)
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const { store } = req;
  const { period = '30d' } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  const stats = await Order.aggregate([
    {
      $match: {
        store: store._id,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        totalItems: {
          $sum: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.quantity'] },
            },
          },
        },
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Stats retrieved', {
      period,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalItems: 0,
      },
    })
  );
});