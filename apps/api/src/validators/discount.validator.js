import Joi from 'joi';

export const createDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).required(),
  title: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  type: Joi.string()
    .valid('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')
    .required(),
  value: Joi.number().min(0).when('type', {
    is: Joi.string().valid('free_shipping', 'buy_x_get_y'),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  buyXGetY: Joi.object({
    buyQuantity: Joi.number().integer().min(1).required(),
    getQuantity: Joi.number().integer().min(1).required(),
    getDiscountType: Joi.string()
      .valid('percentage', 'fixed_amount', 'free')
      .default('free'),
    getDiscountValue: Joi.number().min(0).default(0),
  })
    .when('type', {
      is: 'buy_x_get_y',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  conditions: Joi.object({
    minimumOrderAmount: Joi.number().min(0).optional().allow(null, ''),
    minimumQuantity: Joi.number().integer().min(1).optional().allow(null, ''),
    appliesTo: Joi.string()
      .valid('all_products', 'specific_products', 'specific_categories', 'specific_collections')
      .optional(),
    products: Joi.array().items(Joi.string()).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    collections: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null, ''),
  usageLimitPerCustomer: Joi.number().integer().min(1).default(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null, ''),
  isActive: Joi.boolean().default(true),
  canCombineWithProductDiscounts: Joi.boolean().optional(),
  canCombineWithShippingDiscounts: Joi.boolean().optional(),
});

export const updateDiscountSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).optional(),
  title: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  type: Joi.string()
    .valid('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y')
    .optional(),
  value: Joi.number().min(0).optional(),
  buyXGetY: Joi.object({
    buyQuantity: Joi.number().integer().min(1).optional(),
    getQuantity: Joi.number().integer().min(1).optional(),
    getDiscountType: Joi.string()
      .valid('percentage', 'fixed_amount', 'free')
      .optional(),
    getDiscountValue: Joi.number().min(0).optional(),
  }).optional(),
  conditions: Joi.object().optional(),
  usageLimit: Joi.number().integer().min(1).optional().allow(null, ''),
  usageLimitPerCustomer: Joi.number().integer().min(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  canCombineWithProductDiscounts: Joi.boolean().optional(),
  canCombineWithShippingDiscounts: Joi.boolean().optional(),
}).min(1);