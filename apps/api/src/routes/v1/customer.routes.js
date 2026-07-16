import express from 'express';
import {
  getCustomers,
  getCustomerById,
} from '../../controllers/merchant/customer.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requirePermission('customers:read'), getCustomers);
router.get('/:id', requirePermission('customers:read'), getCustomerById);

export default router;