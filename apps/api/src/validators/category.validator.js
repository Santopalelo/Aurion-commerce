import Joi from 'joi';
import mongoose from 'mongoose';

// Helper: validate MongoDB ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation').messages({
  'any.invalid': 'Invalid ID format',
});

// ============================================
// CREATE CATEGORY
// ============================================
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(''),

  parent: objectId.optional().allow(null, ''),

  displayOrder: Joi.number().integer().min(0).default(0).optional(),

  isActive: Joi.boolean().default(true).optional(),
  isFeatured: Joi.boolean().default(false).optional(),

  seo: Joi.object({
    metaTitle: Joi.string().trim().max(60).optional().allow(''),
    metaDescription: Joi.string().trim().max(160).optional().allow(''),
    metaKeywords: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
});

// ============================================
// UPDATE CATEGORY
// ============================================
export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  parent: objectId.optional().allow(null, ''),
  displayOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),

  seo: Joi.object({
    metaTitle: Joi.string().trim().max(60).optional().allow(''),
    metaDescription: Joi.string().trim().max(160).optional().allow(''),
    metaKeywords: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
}).min(1); // Require at least one field to update /*//////////////////////////////////////////////////////

export default {    createCategorySchema,
  updateCategorySchema,
};