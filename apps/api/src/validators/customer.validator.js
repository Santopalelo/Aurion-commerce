import Joi from 'joi';

export const customerRegisterSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().optional().allow(''),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
  acceptsMarketing: Joi.boolean().default(false),
});

export const customerLoginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

export const customerUpdateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  phone: Joi.string().trim().optional().allow(''),
  acceptsMarketing: Joi.boolean().optional(),
}).min(1);

export const customerChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

export const customerAddAddressSchema = Joi.object({
  label: Joi.string().valid('home', 'work', 'other').default('home'),
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  line1: Joi.string().trim().required(),
  line2: Joi.string().trim().optional().allow(''),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().optional().allow(''),
  country: Joi.string().trim().required(),
  zipCode: Joi.string().trim().required(),
  phone: Joi.string().trim().optional().allow(''),
  isDefault: Joi.boolean().default(false),
});