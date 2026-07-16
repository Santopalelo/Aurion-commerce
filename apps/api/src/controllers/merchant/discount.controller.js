import Discount from '../../models/marketing/Discount.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/discounts
 * @desc    Get all discounts
 * @access  Private (discounts:read)
 */
export const getDiscounts = asyncHandler(async (req, res) => {
  const { store } = req;
  const { search, isActive, page = 1, limit = 20 } = req.query;

  const query = { store: store._id };
  if (search) query.code = { $regex: search, $options: 'i' };
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [discounts, total] = await Promise.all([
    Discount.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Discount.countDocuments(query),
  ]);

  return res.status(200).json(
    ApiResponse.success('Discounts retrieved', discounts, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

/**
 * @route   POST /api/v1/discounts
 * @desc    Create a discount
 * @access  Private (discounts:create)
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const body = req.body;

  // Check if code already exists for this store
  const existing = await Discount.findOne({
    store: store._id,
    code: body.code,
  });

  if (existing) {
    throw new ApiError(
      409,
      `Discount code "${body.code}" already exists`,
      'DUPLICATE_CODE'
    );
  }

  const discount = await Discount.create({
    ...body,
    store: store._id,
    createdBy: user._id,
  });

  return res.status(201).json(
    ApiResponse.success('Discount created', { discount })
  );
});

/**
 * @route   PUT /api/v1/discounts/:id
 * @desc    Update a discount
 * @access  Private (discounts:update)
 */
export const updateDiscount = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const discount = await Discount.findOne({ _id: id, store: store._id });

  if (!discount) {
    throw new ApiError(404, 'Discount not found', 'DISCOUNT_NOT_FOUND');
  }

  // If code is being changed, check for duplicates
  if (req.body.code && req.body.code !== discount.code) {
    const existing = await Discount.findOne({
      store: store._id,
      code: req.body.code,
    });
    if (existing) {
      throw new ApiError(
        409,
        `Discount code "${req.body.code}" already exists`,
        'DUPLICATE_CODE'
      );
    }
  }

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      discount[key] = req.body[key];
    }
  });

  await discount.save();

  return res.status(200).json(
    ApiResponse.success('Discount updated', { discount })
  );
});

/**
 * @route   DELETE /api/v1/discounts/:id
 * @desc    Delete a discount
 * @access  Private (discounts:delete)
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const discount = await Discount.findOne({ _id: id, store: store._id });

  if (!discount) {
    throw new ApiError(404, 'Discount not found', 'DISCOUNT_NOT_FOUND');
  }

  await discount.deleteOne();

  return res.status(200).json(
    ApiResponse.success('Discount deleted')
  );
});