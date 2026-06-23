import Product from '../../models/catalog/Product.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * PUBLIC-SAFE FIELDS
 * These are the only fields we expose to customers.
 * NEVER expose: costPerItem, internal notes, low stock thresholds, etc.
 */
const PUBLIC_PRODUCT_FIELDS =
  'title slug description shortDescription images price compareAtPrice ' +
  'sku tags vendor productType category collections weight dimensions ' +
  'inventoryQuantity trackInventory allowBackorder isFeatured ' +
  'rating totalSold viewCount publishedAt seo isPhysical';

/**
 * @route   GET /api/v1/storefront/:storeSlug/products
 * @desc    Browse products (public)
 * @access  Public
 */
export const getStorefrontProducts = asyncHandler(async (req, res) => {
  const { store } = req;
  const {
    search,
    category,
    minPrice,
    maxPrice,
    tag,
    sortBy = 'newest',
    page = 1,
    limit = 24,
  } = req.query;

  // ============================================
  // Build query
  // CRITICAL: Always filter by store AND status=active
  // ============================================
  const query = {
    store: store._id,
    status: 'active', // Customers ONLY see active products
  };

  // Search by title or tags
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Filter by tag
  if (tag) {
    query.tags = tag.toLowerCase();
  }

  // ============================================
  // Sorting
  // ============================================
  let sort = {};
  switch (sortBy) {
    case 'newest':
      sort = { publishedAt: -1, createdAt: -1 };
      break;
    case 'oldest':
      sort = { publishedAt: 1 };
      break;
    case 'price_asc':
      sort = { price: 1 };
      break;
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'best_selling':
      sort = { totalSold: -1 };
      break;
    case 'name_asc':
      sort = { title: 1 };
      break;
    case 'name_desc':
      sort = { title: -1 };
      break;
    default:
      sort = { publishedAt: -1 };
  }

  // ============================================
  // Pagination
  // ============================================
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit))); // Cap at 100
  const skip = (pageNum - 1) * limitNum;

  // ============================================
  // Execute query
  // ============================================
  const [products, total] = await Promise.all([
    Product.find(query)
      .select(PUBLIC_PRODUCT_FIELDS)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  return res.status(200).json(
    ApiResponse.success('Products retrieved', products, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

/**
 * @route   GET /api/v1/storefront/:storeSlug/products/:productSlug
 * @desc    Get a single product by slug (public)
 * @access  Public
 */
export const getStorefrontProduct = asyncHandler(async (req, res) => {
  const { store } = req;
  const { productSlug } = req.params;

  // Find by slug + must be active + must belong to this store
  const product = await Product.findOne({
    store: store._id,
    slug: productSlug.toLowerCase(),
    status: 'active',
  })
    .select(PUBLIC_PRODUCT_FIELDS)
    .populate('category', 'name slug')
    .populate('collections', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  // Increment view count (fire and forget — don't block response)
  Product.updateOne(
    { _id: product._id },
    { $inc: { viewCount: 1 } }
  ).catch(() => {
    // Silently ignore view count errors
  });

  // Get related products (same category, excluding this one)
  let relatedProducts = [];
  if (product.category) {
    relatedProducts = await Product.find({
      store: store._id,
      status: 'active',
      category: product.category._id || product.category,
      _id: { $ne: product._id },
    })
      .select('title slug price compareAtPrice images')
      .limit(4)
      .lean();
  }

  return res.status(200).json(
    ApiResponse.success('Product retrieved', {
      product,
      relatedProducts,
    })
  );
});