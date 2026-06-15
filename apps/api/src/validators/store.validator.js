import Joi from 'joi';

/**
 * Validation schemas for store endpoints
 */

// ============================================
// CREATE STORE
// ============================================
export const createStoreSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Store name is required',
      'string.min': 'Store name must be at least 2 characters',
      'string.max': 'Store name cannot exceed 100 characters',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(''),

  currency: Joi.string()
    .trim()
    .uppercase()
    .length(3)
    .default('USD')
    .optional(),

  language: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(5)
    .default('en')
    .optional(),

  timezone: Joi.string().trim().optional().default('UTC'),

  business: Joi.object({
    type: Joi.string()
      .valid('retail', 'wholesale', 'digital', 'service', 'other')
      .optional(),
    category: Joi.string().trim().optional(),
  }).optional(),

  contact: Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).optional(),
    phone: Joi.string().trim().optional(),
    address: Joi.object({
      line1: Joi.string().trim().optional(),
      line2: Joi.string().trim().optional().allow(''),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional().allow(''),
      country: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
    }).optional(),
  }).optional(),
});

// ============================================
// UPDATE STORE
// ============================================
export const updateStoreSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  currency: Joi.string().trim().uppercase().length(3).optional(),
  currencySymbol: Joi.string().trim().max(5).optional(),
  language: Joi.string().trim().lowercase().min(2).max(5).optional(),
  timezone: Joi.string().trim().optional(),
  weightUnit: Joi.string().valid('kg', 'lb').optional(),

  business: Joi.object({
    type: Joi.string().valid('retail', 'wholesale', 'digital', 'service', 'other').optional(),
    category: Joi.string().trim().optional(),
    registrationNumber: Joi.string().trim().optional(),
    taxNumber: Joi.string().trim().optional(),
  }).optional(),

  contact: Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).optional(),
    phone: Joi.string().trim().optional(),
    address: Joi.object({
      line1: Joi.string().trim().optional(),
      line2: Joi.string().trim().optional().allow(''),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional().allow(''),
      country: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
    }).optional(),
  }).optional(),

  social: Joi.object({
    instagram: Joi.string().trim().optional().allow(''),
    facebook: Joi.string().trim().optional().allow(''),
    twitter: Joi.string().trim().optional().allow(''),
    tiktok: Joi.string().trim().optional().allow(''),
    youtube: Joi.string().trim().optional().allow(''),
    pinterest: Joi.string().trim().optional().allow(''),
  }).optional(),

  policies: Joi.object({
    refund: Joi.string().optional().allow(''),
    privacy: Joi.string().optional().allow(''),
    terms: Joi.string().optional().allow(''),
    shipping: Joi.string().optional().allow(''),
  }).optional(),

  seo: Joi.object({
    metaTitle: Joi.string().trim().max(60).optional().allow(''),
    metaDescription: Joi.string().trim().max(160).optional().allow(''),
    metaKeywords: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
}).min(1); // At least one field required for update