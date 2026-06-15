import mongoose from 'mongoose';

/**
 * Role Schema
 *
 * Defines a role that can be assigned to staff members within a store.
 * Each store has its own roles (Owner, Manager, Staff, Viewer by default).
 *
 * Permissions follow the pattern: "resource:action"
 * Examples:
 *   - "products:create"
 *   - "orders:read"
 *   - "customers:delete"
 */
const RoleSchema = new mongoose.Schema(
  {
    // ============================================
    // ROLE IDENTITY
    // ============================================
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },

    // Slug version: "Store Manager" → "store-manager"
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },

    // ============================================
    // STORE SCOPE
    // ============================================
    // The store this role belongs to
    // null = platform-level role (e.g., super admin)
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },

    // ============================================
    // SYSTEM vs CUSTOM ROLES
    // ============================================
    // Default roles (Owner, Manager, Staff, Viewer) cannot be deleted
    // Custom roles can be created and modified by store owners
    isSystem: {
      type: Boolean,
      default: false,
    },

    // The default system role this is based on (for system roles)
    systemRoleType: {
      type: String,
      enum: ['owner', 'manager', 'staff', 'viewer', null],
      default: null,
    },

    // ============================================
    // PERMISSIONS
    // ============================================
    // Array of permission strings: ["products:create", "orders:read", ...]
    permissions: [
      {
        type: String,
        required: true,
      },
    ],

    // ============================================
    // METADATA
    // ============================================
    // The user who created this role (for custom roles)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
RoleSchema.index({ store: 1, slug: 1 }, { unique: true }); // Unique per store
RoleSchema.index({ isSystem: 1 });

// ============================================
// METHOD: Check if role has a specific permission
// ============================================
RoleSchema.methods.hasPermission = function (permission) {
  // Owner role has all permissions implicitly
  if (this.systemRoleType === 'owner') return true;

  // Check explicit permissions
  return this.permissions.includes(permission);
};

// ============================================
// METHOD: Check if role has ANY of the given permissions
// ============================================
RoleSchema.methods.hasAnyPermission = function (permissions) {
  if (this.systemRoleType === 'owner') return true;
  return permissions.some((p) => this.permissions.includes(p));
};

// ============================================
// METHOD: Check if role has ALL of the given permissions
// ============================================
RoleSchema.methods.hasAllPermissions = function (permissions) {
  if (this.systemRoleType === 'owner') return true;
  return permissions.every((p) => this.permissions.includes(p));
};

const Role = mongoose.model('Role', RoleSchema);

export default Role;