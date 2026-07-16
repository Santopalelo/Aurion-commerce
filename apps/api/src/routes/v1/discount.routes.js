import express from 'express';
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../../controllers/merchant/discount.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createDiscountSchema,
  updateDiscountSchema,
} from '../../validators/discount.validator.js';

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requirePermission('discounts:read'), getDiscounts);
router.post(
  '/',
  requirePermission('discounts:create'),
  validate(createDiscountSchema),
  createDiscount
);
router.put(
  '/:id',
  requirePermission('discounts:update'),
  validate(updateDiscountSchema),
  updateDiscount
);
router.delete('/:id', requirePermission('discounts:delete'), deleteDiscount);

export default router;