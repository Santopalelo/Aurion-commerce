import Category from '../../models/catalog/Category.model.js';
import Product from '../../models/catalog/Product.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

const PUBLIC_CATEGORY_FIELDS = 'name slug description image parent level path displayOrder';

/**
 * @route   GET /api/v1/storefront/:storeSlug/categories
 * @desc    Get all active categories for a store
 * @access  Public
 */
export const getStorefrontCategories = asyncHandler(async (req, res) => {
  const { store } = req;

  const categories = await Category.find({
    store: store._id,
    isActive: true,
  })
    .select(PUBLIC_CATEGORY_FIELDS)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  // Add product count to each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        store: store._id,
        category: cat._id,
        status: 'active',
      });
      return { ...cat, productCount };
    })
  );

  return res.status(200).json(
    ApiResponse.success('Categories retrieved', categoriesWithCounts)
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/categories/:categorySlug
 * @desc    Get a single category with its products
 * @access  Public
 */
export const getStorefrontCategory = asyncHandler(async (req, res) => {
  const { store } = req;
  const { categorySlug } = req.params;
  const { page = 1, limit = 24, sortBy = 'newest' } = req.query;

  // Find the category
  const category = await Category.findOne({
    store: store._id,
    slug: categorySlug.toLowerCase(),
    isActive: true,
  })
    .select(PUBLIC_CATEGORY_FIELDS)
    .populate('parent', 'name slug')
    .lean();

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // Get products in this category
  let sort = { publishedAt: -1 };
  switch (sortBy) {
    case 'price_asc': sort = { price: 1 }; break;
    case 'price_desc': sort = { price: -1 }; break;
    case 'best_selling': sort = { totalSold: -1 }; break;
    case 'name_asc': sort = { title: 1 }; break;
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find({
      store: store._id,
      category: category._id,
      status: 'active',
    })
      .select('title slug description price compareAtPrice images rating totalSold')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments({
      store: store._id,
      category: category._id,
      status: 'active',
    }),
  ]);

  // Get subcategories
  const subcategories = await Category.find({
    store: store._id,
    parent: category._id,
    isActive: true,
  })
    .select(PUBLIC_CATEGORY_FIELDS)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return res.status(200).json(
    ApiResponse.success('Category retrieved', {
      category,
      products,
      subcategories,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});