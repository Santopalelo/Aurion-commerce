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
router.post('/login', validate(loginSchema), login);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken);

// ============================================
// PROTECTED ROUTES (require valid JWT)
// ============================================

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, logout);

// GET /api/v1/auth/me
router.get('/me', authMiddleware, getMe);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);

export default router;