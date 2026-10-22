import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,      
  resetPassword,       
  verifyResetToken,    
} from '../../controllers/auth/auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireTrustedOrigin } from '../../middleware/csrf.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
} from '../../validators/auth.validator.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/v1/auth/login
// Origin-guarded: the refresh cookie is SameSite=None, so without this a
// malicious page could log a victim into the attacker's account.
router.post('/login', requireTrustedOrigin, validate(loginSchema), login);

// POST /api/v1/auth/refresh-token
// Origin-guarded: this route reads the refresh cookie.
router.post('/refresh-token', requireTrustedOrigin, refreshToken);

// ============================================
// PROTECTED ROUTES (require valid JWT)
// ============================================

// POST /api/v1/auth/logout
// Origin-guarded: this route clears the refresh cookie.
router.post('/logout', requireTrustedOrigin, authMiddleware, logout);

// GET /api/v1/auth/me
router.get('/me', authMiddleware, getMe);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);

export default router;