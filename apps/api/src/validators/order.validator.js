import Joi from 'joi';

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'on_hold')
    .required(),
  note: Joi.string().trim().max(500).optional().allow(''),
});

export const updateFulfillmentSchema = Joi.object({
  fulfillmentStatus: Joi.string()
    .valid('unfulfilled', 'partial', 'fulfilled', 'restocked')
    .optional(),
  carrier: Joi.string().trim().optional().allow(''),
  trackingNumber: Joi.string().trim().optional().allow(''),
  trackingUrl: Joi.string().trim().uri().optional().allow(''),
  estimatedDelivery: Joi.date().optional().allow(null),
  shippingMethod: Joi.string().trim().optional().allow(''),
  note: Joi.string().trim().max(500).optional().allow(''),
});

export const addOrderNoteSchema = Joi.object({
  note: Joi.string().trim().min(1).max(1000).required(),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional().allow(''),
  restockItems: Joi.boolean().default(true),
});