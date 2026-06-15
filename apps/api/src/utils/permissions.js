/**
 * Permission Constants
 *
 * All RBAC permissions in the system.
 * Format: "resource:action"
 *
 * Use these everywhere instead of raw strings.
 * Example: PERMISSIONS.PRODUCTS_CREATE (not "products:create")
 */

export const PERMISSIONS = {
  // ===== PRODUCTS =====
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // ===== CATEGORIES =====
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // ===== INVENTORY =====
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',

  // ===== ORDERS =====
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_FULFILL: 'orders:fulfill',
  ORDERS_REFUND: 'orders:refund',
  ORDERS_DELETE: 'orders:delete',

  // ===== CUSTOMERS =====
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // ===== DISCOUNTS =====
  DISCOUNTS_CREATE: 'discounts:create',
  DISCOUNTS_READ: 'discounts:read',
  DISCOUNTS_UPDATE: 'discounts:update',
  DISCOUNTS_DELETE: 'discounts:delete',

  // ===== EMPLOYEES =====
  EMPLOYEES_INVITE: 'employees:invite',
  EMPLOYEES_MANAGE: 'employees:manage',
  EMPLOYEES_DELETE: 'employees:delete',

  // ===== SETTINGS =====
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
  SETTINGS_BILLING: 'settings:billing',

  // ===== ANALYTICS =====
  ANALYTICS_READ: 'analytics:read',

  // ===== STORE =====
  STORE_MANAGE: 'store:manage',
  STORE_DELETE: 'store:delete',
};

/**
 * Default Role Permissions
 * Defines which permissions each system role has
 */
export const ROLE_PERMISSIONS = {
  // Owner has ALL permissions (handled implicitly in Role model)
  owner: Object.values(PERMISSIONS),

  // Manager: Everything except billing, employee management, store deletion
  manager: [
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_FULFILL,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.DISCOUNTS_CREATE,
    PERMISSIONS.DISCOUNTS_READ,
    PERMISSIONS.DISCOUNTS_UPDATE,
    PERMISSIONS.DISCOUNTS_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  // Staff: Daily operations
  staff: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_FULFILL,
    PERMISSIONS.CUSTOMERS_READ,
  ],

  // Viewer: Read-only access
  viewer: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.DISCOUNTS_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
};

/**
 * Get all permissions as an array (for seeding the database)
 */
export const getAllPermissions = () => Object.values(PERMISSIONS);

/**
 * Check if a string is a valid permission
 */
export const isValidPermission = (permission) => {
  return Object.values(PERMISSIONS).includes(permission);
};