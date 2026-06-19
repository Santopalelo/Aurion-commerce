import Category from '../../models/catalog/Category.model.js';
import Product from '../../models/catalog/Product.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { generateUniqueSlug } from '../../utils/slugify.js';
import {
  uploadCategoryImage,
  deleteFile,
} from '../../services/storage.service.js';

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories for the current store
 * @access  Private (categories:read)
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { store } = req;
  const { search, parent, isActive, limit = 100, page = 1 } = req.query;

  // Build query — ALWAYS include storeId
  const query = { store: store._id };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (parent !== undefined) {
    query.parent = parent === 'null' || parent === '' ? null : parent;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [categories, total] = await Promise.all([
    Category.find(query)
      .populate('parent', 'name slug')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Category.countDocuments(query),
  ]);

  return res.status(200).json(
    ApiResponse.success('Categories retrieved successfully', categories, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    })
  );
});

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get a single category by ID
 * @access  Private (categories:read)
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const category = await Category.findOne({
    _id: id,
    store: store._id,
  }).populate('parent', 'name slug');

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // Get product count for this category
  const productCount = await Product.countDocuments({
    store: store._id,
    category: category._id,
  });

  // Get child categories
  const children = await Category.find({
    store: store._id,
    parent: category._id,
  }).select('name slug image isActive');

  return res.status(200).json(
    ApiResponse.success('Category retrieved successfully', {
      category,
      productCount,
      children,
    })
  );
});

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (categories:create)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { store, user } = req;
  const { name, description, parent, displayOrder, isActive, isFeatured, seo } = req.body;

  // ============================================
  // Validate parent exists (if provided)
  // ============================================
  let parentDoc = null;
  if (parent) {
    parentDoc = await Category.findOne({
      _id: parent,
      store: store._id,
    });
    if (!parentDoc) {
      throw new ApiError(404, 'Parent category not found', 'PARENT_NOT_FOUND');
    }
  }

  // ============================================
  // Generate unique slug (within this store)
  // ============================================
  const slug = await generateUniqueSlug(name, Category, 'slug', {
    store: store._id,
  });

  // ============================================
  // Build category data
  // ============================================
  const categoryData = {
    store: store._id,
    name,
    slug,
    description,
    parent: parent || null,
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured || false,
  };

  // Calculate level and path based on parent
  if (parentDoc) {
    categoryData.level = (parentDoc.level || 0) + 1;
    categoryData.path = parentDoc.path
      ? `${parentDoc.path}/${slug}`
      : `${parentDoc.slug}/${slug}`;
  } else {
    categoryData.level = 0;
    categoryData.path = slug;
  }

  if (seo) categoryData.seo = seo;

  // ============================================
  // Handle image upload (if provided)
  // ============================================
  if (req.file) {
    const uploaded = await uploadCategoryImage(req.file.buffer, store._id);
    categoryData.image = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  // ============================================
  // Create the category
  // ============================================
  const category = await Category.create(categoryData);

  return res.status(201).json(
    ApiResponse.success('Category created successfully', { category })
  );
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update a category
 * @access  Private (categories:update)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const category = await Category.findOne({
    _id: id,
    store: store._id,
  });

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // ============================================
  // Prevent setting itself as parent
  // ============================================
  if (req.body.parent && req.body.parent === id) {
    throw new ApiError(
      400,
      'A category cannot be its own parent',
      'INVALID_PARENT'
    );
  }

  // ============================================
  // Validate new parent if changed
  // ============================================
  if (req.body.parent && req.body.parent !== category.parent?.toString()) {
    const newParent = await Category.findOne({
      _id: req.body.parent,
      store: store._id,
    });
    if (!newParent) {
      throw new ApiError(404, 'Parent category not found', 'PARENT_NOT_FOUND');
    }

    // Update level and path
    category.level = (newParent.level || 0) + 1;
    category.path = newParent.path
      ? `${newParent.path}/${category.slug}`
      : `${newParent.slug}/${category.slug}`;
  }

  // ============================================
  // Update allowed fields
  // ============================================
  const allowedFields = [
    'name', 'description', 'parent', 'displayOrder',
    'isActive', 'isFeatured', 'seo',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      category[field] = req.body[field] === '' && field === 'parent' ? null : req.body[field];
    }
  });

  // ============================================
  // Handle new image upload
  // ============================================
  if (req.file) {
    // Delete old image if exists
    if (category.image?.publicId) {
      await deleteFile(category.image.publicId);
    }

    const uploaded = await uploadCategoryImage(req.file.buffer, store._id);
    category.image = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
  }

  await category.save();

  return res.status(200).json(
    ApiResponse.success('Category updated successfully', { category })
  );
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category
 * @access  Private (categories:delete)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const category = await Category.findOne({
    _id: id,
    store: store._id,
  });

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  // ============================================
  // Check if category has products
  // ============================================
  const productCount = await Product.countDocuments({
    store: store._id,
    category: category._id,
  });

  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. It has ${productCount} product(s). Move them to another category first.`,
      'CATEGORY_HAS_PRODUCTS',
      { productCount }
    );
  }

  // ============================================
  // Check if category has children
  // ============================================
  const childCount = await Category.countDocuments({
    store: store._id,
    parent: category._id,
  });

  if (childCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. It has ${childCount} subcategory(ies). Delete or reassign them first.`,
      'CATEGORY_HAS_CHILDREN',
      { childCount }
    );
  }

  // ============================================
  // Delete image from Cloudinary
  // ============================================
  if (category.image?.publicId) {
    await deleteFile(category.image.publicId);
  }

  // ============================================
  // Delete the category
  // ============================================
  await category.deleteOne();

  return res.status(200).json(
    ApiResponse.success('Category deleted successfully')
  );
});

/**
 * @route   DELETE /api/v1/categories/:id/image
 * @desc    Delete just the category image
 * @access  Private (categories:update)
 */
export const deleteCategoryImage = asyncHandler(async (req, res) => {
  const { store } = req;
  const { id } = req.params;

  const category = await Category.findOne({
    _id: id,
    store: store._id,
  });

  if (!category) {
    throw new ApiError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  if (category.image?.publicId) {
    await deleteFile(category.image.publicId);
    category.image = { url: undefined, publicId: undefined };
    await category.save();
  }

  return res.status(200).json(
    ApiResponse.success('Category image removed successfully', { category })
  );
});