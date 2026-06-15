import ApiError from '../utils/ApiError.js';
import { isValidPermission } from '../utils/permissions.js';

/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Checks if the user has the required permission(s) for an action.
 * Must run AFTER authMiddleware and tenantMiddleware.
 *
 * Usage in routes:
 *   router.post('/products',
 *     authMiddleware,
 *     tenantMiddleware,
 *     requirePermission('products:create'),
 *     productController.create
 *   );
 *
 * Or with multiple permissions:
 *   requirePermission('products:create', 'inventory:update')  // Need ANY
 *   requireAllPermissions('products:create', 'inventory:update')  // Need ALL
 */

/**
 * Require user to have at least ONE of the specified permissions
 *
 * @param  {...string} permissions - Permission strings (e.g., 'products:create')
 */
export const requirePermission = (...permissions) => {
  // Validate permission names at startup (catches typos)
  permissions.forEach((p) => {
    if (!isValidPermission(p)) {
      throw new Error(
        `Invalid permission: "${p}". Check utils/permissions.js for valid permissions.`
      );
    }
  });

  return (req, res, next) => {
    if (!req.userRole) {
      throw new ApiError(
        403,
        'Role context required. Make sure tenantMiddleware runs first.',
        'NO_ROLE_CONTEXT'
      );
    }

    // Owner role has ALL permissions implicitly
    if (req.userRole.systemRoleType === 'owner') {
      return next();
    }

    // Check if user has at least ONE of the required permissions
    const hasPermission = permissions.some((permission) =>
      req.userRole.permissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ApiError(
        403,
        `You do not have permission to perform this action. Required: ${permissions.join(' or ')}`,
        'INSUFFICIENT_PERMISSIONS',
        {
          required: permissions,
          userRole: req.userRole.name,
        }
      );
    }

    next();
  };
};

/**
 * Require user to have ALL of the specified permissions
 *
 * @param  {...string} permissions - Permission strings
 */
export const requireAllPermissions = (...permissions) => {
  permissions.forEach((p) => {
    if (!isValidPermission(p)) {
      throw new Error(`Invalid permission: "${p}"`);
    }
  });

  return (req, res, next) => {
    if (!req.userRole) {
      throw new ApiError(
        403,
        'Role context required',
        'NO_ROLE_CONTEXT'
      );
    }

    if (req.userRole.systemRoleType === 'owner') {
      return next();
    }

    const hasAll = permissions.every((permission) =>
      req.userRole.permissions.includes(permission)
    );

    if (!hasAll) {
      throw new ApiError(
        403,
        `You do not have permission. Required ALL of: ${permissions.join(', ')}`,
        'INSUFFICIENT_PERMISSIONS',
        {
          required: permissions,
          userRole: req.userRole.name,
        }
      );
    }

    next();
  };
};

/**
 * Restrict to specific role types (Owner, Manager, Staff, Viewer)
 *
 * Usage:
 *   router.delete('/store', restrictToRoles('owner'), handler);
 */
export const restrictToRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      throw new ApiError(
        403,
        'Role context required',
        'NO_ROLE_CONTEXT'
      );
    }

    if (!allowedRoles.includes(req.userRole.systemRoleType)) {
      throw new ApiError(
        403,
        `Only ${allowedRoles.join(' or ')} can perform this action`,
        'ROLE_NOT_ALLOWED',
        {
          required: allowedRoles,
          userRole: req.userRole.systemRoleType,
        }
      );
    }

    next();
  };
};

/**
 * Owner only — shortcut for restrictToRoles('owner')
 */
export const ownerOnly = restrictToRoles('owner');