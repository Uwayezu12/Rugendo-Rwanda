import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  handleGetMyNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleMarkAllRead,
  handleArchiveNotification,
} from './notifications.controller.js';
import {
  validateListNotifications,
  validateNotificationIdParam,
} from './notifications.validator.js';

const router = Router();

// All notification routes require authentication.
// No role restriction — ownership is enforced in the service layer.

// ── Named sub-paths (must be before /:id wildcard) ───────────────────────────

// GET /api/notifications?page=&limit=&status=&type=
router.get('/', authenticate, validateListNotifications, handleGetMyNotifications);

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, handleGetUnreadCount);

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, handleMarkAllRead);

// ── Wildcard param routes ─────────────────────────────────────────────────────

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, validateNotificationIdParam, handleMarkAsRead);

// PATCH /api/notifications/:id/archive
router.patch('/:id/archive', authenticate, validateNotificationIdParam, handleArchiveNotification);

export default router;
