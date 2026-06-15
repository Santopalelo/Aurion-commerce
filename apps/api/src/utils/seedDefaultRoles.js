import Role from '../models/auth/Role.model.js';
import { ROLE_PERMISSIONS } from './permissions.js';

/**
 * Create default roles for a new store
 *
 * Every new store gets 4 system roles:
 * - Owner   (all permissions, cannot be deleted)
 * - Manager (most permissions)
 * - Staff   (basic operations)
 * - Viewer  (read-only)
 *
 * @param {ObjectId} storeId - The store to create roles for
 * @param {ObjectId} createdBy - The user creating the store
 * @param {object} session - Optional MongoDB session for transactions
 * @returns {Promise<{owner, manager, staff, viewer}>} Created role documents
 */
export const seedDefaultRoles = async (storeId, createdBy, session = null) => {
  const rolesToCreate = [
    {
      name: 'Owner',
      slug: 'owner',
      description: 'Full access to all store features and settings',
      store: storeId,
      isSystem: true,
      systemRoleType: 'owner',
      permissions: ROLE_PERMISSIONS.owner,
      createdBy,
    },
    {
      name: 'Manager',
      slug: 'manager',
      description: 'Manage products, orders, and customers',
      store: storeId,
      isSystem: true,
      systemRoleType: 'manager',
      permissions: ROLE_PERMISSIONS.manager,
      createdBy,
    },
    {
      name: 'Staff',
      slug: 'staff',
      description: 'Handle daily operations like orders and inventory',
      store: storeId,
      isSystem: true,
      systemRoleType: 'staff',
      permissions: ROLE_PERMISSIONS.staff,
      createdBy,
    },
    {
      name: 'Viewer',
      slug: 'viewer',
      description: 'Read-only access to view store data',
      store: storeId,
      isSystem: true,
      systemRoleType: 'viewer',
      permissions: ROLE_PERMISSIONS.viewer,
      createdBy,
    },
  ];

  const options = session ? { session } : {};
  const roles = await Role.create(rolesToCreate, options);

  return {
    owner: roles[0],
    manager: roles[1],
    staff: roles[2],
    viewer: roles[3],
  };
};

export default seedDefaultRoles;