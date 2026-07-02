import express from 'express';
import rateLimit from 'express-rate-limit';
import { storefrontTenant } from '../../middleware/storefront.middleware.js';
import { customerAuthMiddleware } from '../../middleware/customerAuth.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  updateProfile,
  changePassword,
  getMyOrders,
  getMyAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../controllers/storefront/sf.customer.controller.js';
import {
  customerRegisterSchema,
  customerLoginSchema,
  customerUpdateProfileSchema,
  customerChangePasswordSchema,
  customerAddAddressSchema,
} from '../../validators/customer.validator.js';

const router = express.Router();

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 min
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

// ============================================
// PUBLIC ROUTES (require store context but not auth)
// ============================================
router.post(
  '/:storeSlug/customers/register',
  authLimiter,
  storefrontTenant,
  validate(customerRegisterSchema),
  registerCustomer
);

router.post(
  '/:storeSlug/customers/login',
  authLimiter,
  storefrontTenant,
  validate(customerLoginSchema),
  loginCustomer
);

// ============================================
// PROTECTED ROUTES (require customer auth)
// ============================================
router.get(
  '/:storeSlug/customers/me',
  storefrontTenant,
  customerAuthMiddleware,
  getMyProfile
);

router.put(
  '/:storeSlug/customers/me',
  storefrontTenant,
  customerAuthMiddleware,
  validate(customerUpdateProfileSchema),
  updateProfile
);

router.put(
  '/:storeSlug/customers/me/password',
  storefrontTenant,
  customerAuthMiddleware,
  validate(customerChangePasswordSchema),
  changePassword
);

router.get(
  '/:storeSlug/customers/me/orders',
  storefrontTenant,
  customerAuthMiddleware,
  getMyOrders
);

router.get(
  '/:storeSlug/customers/me/addresses',
  storefrontTenant,
  customerAuthMiddleware,
  getMyAddresses
);

router.post(
  '/:storeSlug/customers/me/addresses',
  storefrontTenant,
  customerAuthMiddleware,
  validate(customerAddAddressSchema),
  addAddress
);

router.delete(
  '/:storeSlug/customers/me/addresses/:addressId',
  storefrontTenant,
  customerAuthMiddleware,
  deleteAddress
);

router.put(
  '/:storeSlug/customers/me/addresses/:addressId/default',
  storefrontTenant,
  customerAuthMiddleware,
  setDefaultAddress
);

export default router;