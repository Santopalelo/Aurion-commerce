import Joi from 'joi';
import mongoose from 'mongoose';

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation').messages({
  'any.invalid': 'Invalid ID format',
});

// Helper to parse stringified JSON in form data
const jsonString = Joi.string().custom((value, helpers) => {
  try {
    return JSON.parse(value);
  } catch {
    return helpers.error('any.invalid');
  }
});

// ============================================
// CREATE PRODUCT
// ============================================
export const createProductSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'Product title is required',
    'string.min': 'Title must be at least 2 characters',
  }),

  description: Joi.string().optional().allow(''),

  shortDescription: Joi.string().trim().max(300).optional().allow(''),

  // Pricing
  price: Joi.number().min(0).required().messages({
    'any.required': 'Price is required',
    'number.min': 'Price cannot be negative',
  }),
  compareAtPrice: Joi.number().min(0).optional().allow(null, ''),
  costPerItem: Joi.number().min(0).optional().allow(null, ''),
  taxable: Joi.boolean().default(true),

  // Inventory
  sku: Joi.string().trim().optional().allow(''),
  barcode: Joi.string().trim().optional().allow(''),
  trackInventory: Joi.boolean().default(true),
  inventoryQuantity: Joi.number().integer().min(0).default(0),
  allowBackorder: Joi.boolean().default(false),
  lowStockThreshold: Joi.number().integer().min(0).default(5),

  // Shipping
  isPhysical: Joi.boolean().default(true),
  weight: Joi.alternatives().try(
    Joi.object({
      value: Joi.number().min(0).optional(),
      unit: Joi.string().valid('kg', 'g', 'lb', 'oz').default('kg'),
    }),
    jsonString
  ).optional(),
  dimensions: Joi.alternatives().try(
    Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional(),
      unit: Joi.string().valid('cm', 'in').default('cm'),
    }),
    jsonString
  ).optional(),

  // Categorization
  category: objectId.optional().allow(null, ''),
  collections: Joi.alternatives().try(
    Joi.array().items(objectId),
    jsonString
  ).optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().lowercase()),
    jsonString,
    Joi.string()
  ).optional(),
  vendor: Joi.string().trim().optional().allow(''),
  productType: Joi.string().trim().optional().allow(''),

  // SEO
  seo: Joi.alternatives().try(
    Joi.object({
      metaTitle: Joi.string().trim().max(60).optional().allow(''),
      metaDescription: Joi.string().trim().max(160).optional().allow(''),
      metaKeywords: Joi.array().items(Joi.string().trim()).optional(),
    }),
    jsonString
  ).optional(),

  // Status
  status: Joi.string().valid('active', 'draft', 'archived').default('draft'),
  isFeatured: Joi.boolean().default(false),
});

// ============================================
// UPDATE PRODUCT
// ============================================
export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().optional().allow(''),
  shortDescription: Joi.string().trim().max(300).optional().allow(''),

  price: Joi.number().min(0).optional(),
  compareAtPrice: Joi.number().min(0).optional().allow(null, ''),
  costPerItem: Joi.number().min(0).optional().allow(null, ''),
  taxable: Joi.boolean().optional(),

  sku: Joi.string().trim().optional().allow(''),
  barcode: Joi.string().trim().optional().allow(''),
  trackInventory: Joi.boolean().optional(),
  inventoryQuantity: Joi.number().integer().min(0).optional(),
  allowBackorder: Joi.boolean().optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),

  isPhysical: Joi.boolean().optional(),
  weight: Joi.alternatives().try(Joi.object(), jsonString).optional(),
  dimensions: Joi.alternatives().try(Joi.object(), jsonString).optional(),

  category: objectId.optional().allow(null, ''),
  collections: Joi.alternatives().try(Joi.array().items(objectId), jsonString).optional(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), jsonString, Joi.string()).optional(),
  vendor: Joi.string().trim().optional().allow(''),
  productType: Joi.string().trim().optional().allow(''),

  seo: Joi.alternatives().try(Joi.object(), jsonString).optional(),

  status: Joi.string().valid('active', 'draft', 'archived').optional(),
  isFeatured: Joi.boolean().optional(),

  // Image management
  imagesToDelete: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    jsonString
  ).optional(),
}).min(1);