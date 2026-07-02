import ApiError from '../utils/ApiError.js';

/**
 * Platform Admin Middleware
 *
 * Restricts access to platform admins only.
 * Must run AFTER authMiddleware.
 *
 * Usage:
 *   router.get('/admin/stats', authMiddleware, adminOnly, handler);
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', 'NO_USER');
  }

  if (req.user.platformRole !== 'platform_admin') {
    throw new ApiError(
      403,
      'Platform admin access required',
      'ADMIN_ONLY'
    );
  }

  next();
};

/**
 * Admin OR Support middleware
 * Allows both platform_admin and support roles
 */
export const adminOrSupport = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', 'NO_USER');
  }

  if (!['platform_admin', 'support'].includes(req.user.platformRole)) {
    throw new ApiError(
      403,
      'Admin or support access required',
      'ADMIN_OR_SUPPORT_ONLY'
    );
  }

  next();
};