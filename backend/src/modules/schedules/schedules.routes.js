import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  validateCreateSchedule,
  validateListSchedules,
  validateScheduleIdParam,
  validateSearchSchedules,
  validateUpdateSchedule,
} from './schedules.validator.js';
import {
  handleCancelSchedule,
  handleCreateSchedule,
  handleGetScheduleById,
  handleGetScheduleByIdAdmin,
  handleListSchedulesAdmin,
  handleSearchSchedules,
  handleUpdateSchedule,
} from './schedules.controller.js';

const router = Router();

// Public: search available schedules by route and date
// Must be registered before /:id to avoid Express matching 'search' as an ID
router.get('/search', validateSearchSchedules, handleSearchSchedules);

// ── Admin routes (authenticate + role guard) ──────────────────────────────────
// Registered before public GET /:id so admin GET / is not shadowed by the wildcard

router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateListSchedules,
  handleListSchedulesAdmin,
);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateCreateSchedule,
  handleCreateSchedule,
);

router.get(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateScheduleIdParam,
  handleGetScheduleByIdAdmin,
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateScheduleIdParam,
  validateUpdateSchedule,
  handleUpdateSchedule,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validateScheduleIdParam,
  handleCancelSchedule,
);

// Public: get a single schedule by ID (used by booking summary page)
// Registered last so admin routes above are matched first
router.get('/:id', handleGetScheduleById);

export default router;
