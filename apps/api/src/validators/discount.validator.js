import Joi from 'joi';

export const createDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).required(),
  title: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  type: Joi.string()
    .valid('percentage', 'fixed_amount', 'free_shipping')
    .required(),
  value: Joi.number().min(0).when('type', {
    is: 'free_shipping',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  conditions: Joi.object({
    minimumOrderAmount: Joi.number().min(0).optional().allow(null, ''),
    minimumQuantity: Joi.number().integer().min(1).optional().allow(null, ''),
  }).optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null, ''),
  usageLimitPerCustomer: Joi.number().integer().min(1).default(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null, ''),
  isActive: Joi.boolean().default(true),
});

export const updateDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).optional(),
  title: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  type: Joi.string()
    .valid('percentage', 'fixed_amount', 'free_shipping')
    .optional(),
  value: Joi.number().min(0).optional(),
  conditions: Joi.object().optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null, ''),
  usageLimitPerCustomer: Joi.number().integer().min(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
}).min(1);