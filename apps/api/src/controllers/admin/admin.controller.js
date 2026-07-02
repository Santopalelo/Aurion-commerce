import Store from '../../models/tenant/Store.model.js';
import User from '../../models/auth/User.model.js';
import Customer from '../../models/customers/Customer.model.js';
import Product from '../../models/catalog/Product.model.js';
import Order from '../../models/orders/Order.model.js';
import Subscription from '../../models/platform/Subscription.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get platform-wide dashboard stats
 * @access  Platform Admin
 */
export const getDashboard = asyncHandler(async (req, res) => {
  // Run all queries in parallel for performance
  const [
    totalStores,
    activeStores,
    totalMerchants,
    totalCustomers,
    totalProducts,
    totalOrders,
    revenueData,
    recentStores,
    recentOrders,
  ] = await Promise.all([
    Store.countDocuments(),
    Store.countDocuments({ status: 'active' }),
    User.countDocuments({ platformRole: 'merchant' }),
    Customer.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
        },
      },
    ]),
    Store.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name slug status plan createdAt')
      .populate('owner', 'firstName lastName email')
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('store', 'name slug')
      .select('orderNumber pricing status createdAt')
      .lean(),
  ]);

  // Calculate stores by status
  const storesByStatus = await Store.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate stores by plan
  const storesByPlan = await Store.aggregate([
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Dashboard data retrieved', {
      stats: {
        totalStores,
        activeStores,
        totalMerchants,
        totalCustomers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        averageOrderValue: revenueData[0]?.averageOrderValue || 0,
      },
      storesByStatus: storesByStatus.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      storesByPlan: storesByPlan.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      recentStores,
      recentOrders,
    })
  );
});

/**
 * @route   GET /api/v1/admin/stores
 * @desc    List all stores with filters
 * @access  Platform Admin
 */
export const getAllStores = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    plan,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;
  if (plan) query.plan = plan;

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [stores, total] = await Promise.all([
    Store.find(query)
      .populate('owner', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Store.countDocuments(query),
  ]);

  // Add stats for each store
  const storesWithStats = await Promise.all(
    stores.map(async (store) => {
      const [productCount, orderCount, revenue] = await Promise.all([
        Product.countDocuments({ store: store._id }),
        Order.countDocuments({ store: store._id }),
        Order.aggregate([
          { $match: { store: store._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$pricing.total' } } },
        ]),
      ]);

      return {
        ...store,
        stats: {
          productCount,
          orderCount,
          revenue: revenue[0]?.total || 0,
        },
      };
    })
  );

  return res.status(200).json(
    ApiResponse.success('Stores retrieved', storesWithStats, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

/**
 * @route   GET /api/v1/admin/stores/:id
 * @desc    Get detailed store info
 * @access  Platform Admin
 */
export const getStoreDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const store = await Store.findById(id).populate(
    'owner',
    'firstName lastName email phone createdAt'
  );

  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  const [
    subscription,
    productCount,
    activeProductCount,
    orderCount,
    revenue,
    customerCount,
    staffCount,
  ] = await Promise.all([
    Subscription.findOne({ store: store._id }),
    Product.countDocuments({ store: store._id }),
    Product.countDocuments({ store: store._id, status: 'active' }),
    Order.countDocuments({ store: store._id }),
    Order.aggregate([
      { $match: { store: store._id, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        },
      },
    ]),
    Customer.countDocuments({ store: store._id }),
    User.countDocuments({ 'storeAccess.store': store._id }),
  ]);

  return res.status(200).json(
    ApiResponse.success('Store details retrieved', {
      store,
      subscription,
      stats: {
        productCount,
        activeProductCount,
        orderCount,
        totalRevenue: revenue[0]?.total || 0,
        totalOrders: revenue[0]?.count || 0,
        customerCount,
        staffCount,
      },
    })
  );
});

/**
 * @route   PUT /api/v1/admin/stores/:id/status
 * @desc    Update store status (suspend, reactivate, etc.)
 * @access  Platform Admin
 */
export const updateStoreStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'inactive', 'suspended', 'setup'].includes(status)) {
    throw new ApiError(400, 'Invalid status', 'INVALID_STATUS');
  }

  const store = await Store.findById(id);
  if (!store) {
    throw new ApiError(404, 'Store not found', 'STORE_NOT_FOUND');
  }

  const previousStatus = store.status;
  store.status = status;
  await store.save();

  return res.status(200).json(
    ApiResponse.success('Store status updated', {
      store,
      previousStatus,
      newStatus: status,
      reason: reason || null,
    })
  );
});

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all platform users (merchants + admins)
 * @access  Platform Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    search,
    platformRole,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (platformRole) query.platformRole = platformRole;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  return res.status(200).json(
    ApiResponse.success('Users retrieved', users, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

/**
 * @route   PUT /api/v1/admin/users/:id/suspend
 * @desc    Suspend a user
 * @access  Platform Admin
 */
export const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  if (user.platformRole === 'platform_admin') {
    throw new ApiError(
      403,
      'Cannot suspend platform admins',
      'CANNOT_SUSPEND_ADMIN'
    );
  }

  user.isSuspended = true;
  user.suspendedReason = reason || 'Suspended by admin';
  user.suspendedAt = new Date();
  await user.save();

  return res.status(200).json(
    ApiResponse.success('User suspended', { user })
  );
});

/**
 * @route   PUT /api/v1/admin/users/:id/unsuspend
 * @desc    Unsuspend a user
 * @access  Platform Admin
 */
export const unsuspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  user.isSuspended = false;
  user.suspendedReason = null;
  user.suspendedAt = null;
  await user.save();

  return res.status(200).json(
    ApiResponse.success('User unsuspended', { user })
  );
});

/**
 * @route   GET /api/v1/admin/analytics/revenue
 * @desc    Get platform-wide revenue analytics
 * @access  Platform Admin
 */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Revenue by day
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top stores by revenue
  const topStores = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$store',
        revenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'stores',
        localField: '_id',
        foreignField: '_id',
        as: 'store',
      },
    },
    { $unwind: '$store' },
    {
      $project: {
        storeName: '$store.name',
        storeSlug: '$store.slug',
        revenue: 1,
        orderCount: 1,
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Revenue analytics retrieved', {
      period,
      dailyRevenue,
      topStores,
    })
  );
});

/**
 * @route   POST /api/v1/admin/create-admin
 * @desc    Create another platform admin (super admin only action)
 * @access  Platform Admin
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'User with this email exists', 'EMAIL_EXISTS');
  }

  const admin = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    platformRole: 'platform_admin',
    isEmailVerified: true,
  });

  const adminData = admin.toObject();
  delete adminData.password;

  return res.status(201).json(
    ApiResponse.success('Admin created', { admin: adminData })
  );
});