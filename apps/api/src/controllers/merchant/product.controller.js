import Product from '../../models/catalog/Product.model.js';
import Category from '../../models/catalog/Category.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { generateUniqueSlug } from '../../utils/slugify.js';
import {
  uploadProductImage,
  deleteFile,
  deleteFiles,
} from '../../services/storage.service.js';

// Helper: parse fields that might come as JSON strings from form-data
const parseField = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

// Helper: parse tags (could be string, array, or JSON string)
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.toLowerCase().trim());
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((t) => t.toLowerCase().trim());
    } catch {
      // Treat as comma-separated string
      return tags.split(',').map((t) => t.toLowerCase().trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * @route   GET /api/v1/products
 * @desc    Get all products for current store
 * @access  Private (products:read)
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { store } = req;
  const {
    search,
    status,
    category,
    isFeatured,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

  // Build query
  const query = { store: store._id };

  if (status) query.status = status;
  if (category) query.category = category;
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
  if (inStock === 'true') query.inventoryQuantity = { $gt: 0 };
  if (inStock === 'false') query.inventoryQuantity = { $lte: 0 };

  if (search) {
    // Use text search if available, otherwise regex
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { vendor: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  // Calculate aggregate stats
  const stats = await Product.aggregate([
    { $match: { store: store._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
        outOfStock: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$trackInventory', true] }, { $lte: ['$inventoryQuantity', 0] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return res.status(200).json(
    ApiResponse.success('Products retrieved successfully', products, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      stats: stats[0] || { total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0 },
    })
  );
});

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get a single product by ID
 * @access  Private (products:read)
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, store: store._id })
    .populate('category', 'name slug')
    .populate('collections', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  return res.status(200).json(
    ApiResponse.success('Product retrieved successfully', { product })
  );
});

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private (products:create)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const body = req.body;

  // ============================================
  // Validate category if provided
  // ============================================
  if (body.category) {
    const category = await Category.findOne({
      _id: body.category,
      store: store._id,
    });
    if (!category) {
      throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
    }
  }

  // ============================================
  // Generate unique slug
  // ============================================
  const slug = await generateUniqueSlug(body.title, Product, 'slug', {
    store: store._id,
  });

  // ============================================
  // Build product data
  // ============================================
  const productData = {
    store: store._id,
    title: body.title,
    slug,
    description: body.description || '',
    shortDescription: body.shortDescription || '',

    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
    costPerItem: body.costPerItem ? Number(body.costPerItem) : undefined,
    taxable: body.taxable !== undefined ? body.taxable === true || body.taxable === 'true' : true,

    sku: body.sku || '',
    barcode: body.barcode || '',
    trackInventory: body.trackInventory !== undefined ? body.trackInventory === true || body.trackInventory === 'true' : true,
    inventoryQuantity: Number(body.inventoryQuantity || 0),
    allowBackorder: body.allowBackorder === true || body.allowBackorder === 'true',
    lowStockThreshold: Number(body.lowStockThreshold || 5),

    isPhysical: body.isPhysical !== undefined ? body.isPhysical === true || body.isPhysical === 'true' : true,

    category: body.category || undefined,
    collections: parseField(body.collections) || [],
    tags: parseTags(body.tags),
    vendor: body.vendor || '',
    productType: body.productType || '',

    status: body.status || 'draft',
    isFeatured: body.isFeatured === true || body.isFeatured === 'true',

    createdBy: user._id,
    updatedBy: user._id,
  };

  // Parse complex fields
  if (body.weight) productData.weight = parseField(body.weight);
  if (body.dimensions) productData.dimensions = parseField(body.dimensions);
  if (body.seo) productData.seo = parseField(body.seo);

  // Set publishedAt if status is active
  if (productData.status === 'active') {
    productData.publishedAt = new Date();
  }

  // ============================================
  // Create the product first (need _id for image folder)
  // ============================================
  const product = await Product.create(productData);

  // ============================================
  // Handle image uploads (if any)
  // ============================================
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file, index) =>
      uploadProductImage(file.buffer, store._id, product._id).then((uploaded) => ({
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: product.title,
        isPrimary: index === 0,
        order: index,
      }))
    );

    const uploadedImages = await Promise.all(uploadPromises);
    product.images = uploadedImages;
    await product.save();
  }

  return res.status(201).json(
    ApiResponse.success('Product created successfully', { product })
  );
});

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update a product
 * @access  Private (products:update)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const body = req.body;

  const product = await Product.findOne({ _id: id, store: store._id });
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  // ============================================
  // Validate category if changed
  // ============================================
  if (body.category && body.category !== product.category?.toString()) {
    const category = await Category.findOne({
      _id: body.category,
      store: store._id,
    });
    if (!category) {
      throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
    }
  }

  // ============================================
  // Update simple fields
  // ============================================
  const simpleFields = [
    'title', 'description', 'shortDescription', 'sku', 'barcode',
    'vendor', 'productType',
  ];
  simpleFields.forEach((field) => {
    if (body[field] !== undefined) product[field] = body[field];
  });

  // Numeric fields
  if (body.price !== undefined) product.price = Number(body.price);
  if (body.compareAtPrice !== undefined) {
    product.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : undefined;
  }
  if (body.costPerItem !== undefined) {
    product.costPerItem = body.costPerItem ? Number(body.costPerItem) : undefined;
  }
  if (body.inventoryQuantity !== undefined) {
    product.inventoryQuantity = Number(body.inventoryQuantity);
  }
  if (body.lowStockThreshold !== undefined) {
    product.lowStockThreshold = Number(body.lowStockThreshold);
  }

  // Boolean fields
  const boolFields = ['taxable', 'trackInventory', 'allowBackorder', 'isPhysical', 'isFeatured'];
  boolFields.forEach((field) => {
    if (body[field] !== undefined) {
      product[field] = body[field] === true || body[field] === 'true';
    }
  });

  // Reference fields
  if (body.category !== undefined) {
    product.category = body.category || undefined;
  }
  if (body.collections !== undefined) {
    product.collections = parseField(body.collections) || [];
  }
  if (body.tags !== undefined) {
    product.tags = parseTags(body.tags);
  }

  // Complex fields
  if (body.weight !== undefined) product.weight = parseField(body.weight);
  if (body.dimensions !== undefined) product.dimensions = parseField(body.dimensions);
  if (body.seo !== undefined) product.seo = parseField(body.seo);

  // Status — set publishedAt when becoming active for the first time
  if (body.status !== undefined && body.status !== product.status) {
    product.status = body.status;
    if (body.status === 'active' && !product.publishedAt) {
      product.publishedAt = new Date();
    }
  }

  product.updatedBy = user._id;

  // ============================================
  // Handle image deletions (if any specified)
  // ============================================
  if (body.imagesToDelete) {
    const toDelete = parseField(body.imagesToDelete);
    if (Array.isArray(toDelete) && toDelete.length > 0) {
      const publicIds = product.images
        .filter((img) => toDelete.includes(img.publicId))
        .map((img) => img.publicId);

      if (publicIds.length > 0) {
        await deleteFiles(publicIds);
        product.images = product.images.filter(
          (img) => !toDelete.includes(img.publicId)
        );
      }
    }
  }

  // ============================================
  // Handle new image uploads
  // ============================================
  if (req.files && req.files.length > 0) {
    const startOrder = product.images.length;
    const uploadPromises = req.files.map((file, index) =>
      uploadProductImage(file.buffer, store._id, product._id).then((uploaded) => ({
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: product.title,
        isPrimary: product.images.length === 0 && index === 0,
        order: startOrder + index,
      }))
    );

    const newImages = await Promise.all(uploadPromises);
    product.images.push(...newImages);
  }

  await product.save();

  return res.status(200).json(
    ApiResponse.success('Product updated successfully', { product })
  );
});

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product
 * @access  Private (products:delete)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, store: store._id });
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  // ============================================
  // Delete all images from Cloudinary
  // ============================================
  if (product.images && product.images.length > 0) {
    const publicIds = product.images.map((img) => img.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      await deleteFiles(publicIds);
    }
  }

  await product.deleteOne();

  return res.status(200).json(
    ApiResponse.success('Product deleted successfully')
  );
});

/**
 * @route   POST /api/v1/products/:id/duplicate
 * @desc    Duplicate a product (without images)
 * @access  Private (products:create)
 */
export const duplicateProduct = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;

  const original = await Product.findOne({ _id: id, store: store._id });
  if (!original) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  const newTitle = `${original.title} (Copy)`;
  const newSlug = await generateUniqueSlug(newTitle, Product, 'slug', {
    store: store._id,
  });

  const duplicate = original.toObject();
  delete duplicate._id;
  delete duplicate.createdAt;
  delete duplicate.updatedAt;
  delete duplicate.publishedAt;

  duplicate.title = newTitle;
  duplicate.slug = newSlug;
  duplicate.status = 'draft';
  duplicate.images = []; // Don't copy images
  duplicate.totalSold = 0;
  duplicate.viewCount = 0;
  duplicate.rating = { average: 0, count: 0 };
  duplicate.createdBy = user._id;
  duplicate.updatedBy = user._id;

  const newProduct = await Product.create(duplicate);

  return res.status(201).json(
    ApiResponse.success('Product duplicated successfully', { product: newProduct })
  );
});

/**
 * @route   PUT /api/v1/products/:id/status
 * @desc    Quick status update (active/draft/archived)
 * @access  Private (products:update)
 */
export const updateProductStatus = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'draft', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid status', 'INVALID_STATUS');
  }

  const product = await Product.findOne({ _id: id, store: store._id });
  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
  }

  product.status = status;
  product.updatedBy = user._id;

  if (status === 'active' && !product.publishedAt) {
    product.publishedAt = new Date();
  }

  await product.save();

  return res.status(200).json(
    ApiResponse.success('Product status updated', { product })
  );
});