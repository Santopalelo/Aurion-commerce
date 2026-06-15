import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 *
 * Represents anyone who logs into the Aurion platform:
 * - Merchants (people who own stores)
 * - Staff (people invited to help manage stores)
 * - Platform admins (Aurion employees)
 *
 * IMPORTANT: A single user can have access to MULTIPLE stores
 * via the storeAccess[] array. This supports cases like:
 * - An agency managing multiple client stores
 * - A staff member working at multiple shops
 */
const UserSchema = new mongoose.Schema(
  {
    // ============================================
    // IDENTITY
    // ============================================
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Email is unique GLOBALLY (across the platform)
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },

    // ============================================
    // AUTHENTICATION
    // ============================================
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries unless explicitly requested
    },

    // OAuth (future)
    googleId: { type: String },

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // ============================================
    // PASSWORD RESET
    // ============================================
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: { type: Date },

    // ============================================
    // LOGIN TRACKING
    // ============================================
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    loginCount: { type: Number, default: 0 },

    // ============================================
    // PLATFORM ROLE
    // ============================================
    // This is for PLATFORM-level access (not store-specific)
    // Most users will be 'merchant'
    // 'platform_admin' = Aurion staff with super admin access
    platformRole: {
      type: String,
      enum: ['merchant', 'platform_admin', 'support'],
      default: 'merchant',
    },

    // ============================================
    // STORE MEMBERSHIPS
    // ============================================
    // A user can have access to multiple stores
    // Each entry represents membership in one store with a specific role
    storeAccess: [
      {
        store: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Store',
          required: true,
        },
        role: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Role',
          required: true,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['active', 'pending', 'suspended'],
          default: 'pending',
        },
        invitedAt: { type: Date, default: Date.now },
        joinedAt: { type: Date },
      },
    ],

    // ============================================
    // USER PREFERENCES
    // ============================================
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        newOrder: { type: Boolean, default: true },
        lowStock: { type: Boolean, default: true },
        newCustomer: { type: Boolean, default: false },
        marketing: { type: Boolean, default: false },
      },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
    },

    // ============================================
    // ACCOUNT STATUS
    // ============================================
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },
    suspendedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
UserSchema.index({ 'storeAccess.store': 1 });
UserSchema.index({ platformRole: 1 });

// ============================================
// PRE-SAVE: Hash password before saving
// ============================================
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified (or new)
  if (!this.isModified('password')) return next();

  // Hash with bcrypt (12 rounds = strong but reasonable)
  this.password = await bcrypt.hash(this.password, 12);

  // Track when password was changed (for token invalidation)
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }

  next();
});

// ============================================
// METHOD: Compare passwords during login
// ============================================
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// METHOD: Check if user has access to a specific store
// ============================================
UserSchema.methods.hasStoreAccess = function (storeId) {
  return this.storeAccess.some(
    (access) =>
      access.store.toString() === storeId.toString() &&
      access.status === 'active'
  );
};

// ============================================
// METHOD: Get user's role in a specific store
// ============================================
UserSchema.methods.getStoreRole = function (storeId) {
  const access = this.storeAccess.find(
    (a) => a.store.toString() === storeId.toString() && a.status === 'active'
  );
  return access ? access.role : null;
};

// ============================================
// VIRTUAL: Full name
// ============================================
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', UserSchema);

export default User;