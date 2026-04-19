import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  getMe,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register',         register);
router.post('/login',            login);
router.post('/refresh',          refresh);
router.post('/logout',           authenticate, logout);
router.post('/forgot-password',  forgotPassword);
router.post('/reset-password',   resetPassword);
router.post('/google',           googleAuth);

// /api/me lives on the auth router for clarity
router.get('/me', authenticate, getMe);

export default router;
