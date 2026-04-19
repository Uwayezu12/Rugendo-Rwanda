import { Router } from 'express';
import {
  getMe, updateMe, deleteMe,
  listUsersHandler, updateUserRoleHandler, updateUserStatusHandler,
} from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.get('/me',    authenticate, getMe);
router.patch('/me',  authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);

// Super-admin: user management
router.get('/',                 authenticate, requireRole('SUPER_ADMIN'), listUsersHandler);
router.patch('/:id/role',       authenticate, requireRole('SUPER_ADMIN'), updateUserRoleHandler);
router.patch('/:id/status',     authenticate, requireRole('SUPER_ADMIN'), updateUserStatusHandler);

export default router;
