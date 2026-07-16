import Customer from '../../models/customers/Customer.model.js';
import Order from '../../models/orders/Order.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers for current store
 * @access  Private (customers:read)
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const { store } = req;
  const {
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  const query = { store: store._id };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Customer.countDocuments(query),
  ]);

  // Aggregate stats
  const stats = await Customer.aggregate([
    { $match: { store: store._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalSpent: { $sum: '$stats.totalSpent' },
        registered: {
          $sum: { $cond: [{ $eq: ['$isGuest', false] }, 1, 0] },
        },
        guests: {
          $sum: { $cond: [{ $eq: ['$isGuest', true] }, 1, 0] },
        },
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Customers retrieved', customers, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      stats: stats[0] || {
        total: 0,
        totalSpent: 0,
        registered: 0,
        guests: 0,
      },
    })
  );
});

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get single customer with orders
 * @access  Private (customers:read)
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const customer = await Customer.findOne({
    _id: id,
    store: store._id,
  }).select('-password');

  if (!customer) {
    throw new ApiError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
  }

  // Get their orders
  const orders = await Order.find({
    store: store._id,
    customer: customer._id,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('orderNumber status paymentStatus pricing items createdAt')
    .lean();

  return res.status(200).json(
    ApiResponse.success('Customer retrieved', {
      customer,
      orders,
    })
  );
});