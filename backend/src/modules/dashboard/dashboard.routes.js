import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  adminStatsHandler,
  adminTimeseriesHandler,
  operatorDashboardHandler,
} from './dashboard.controller.js';

const router = Router();

// Admin/super-admin KPIs
router.get(
  '/stats',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  adminStatsHandler
);

// Admin/super-admin timeseries (bookings + revenue over time, status distribution)
router.get(
  '/timeseries',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  adminTimeseriesHandler
);

// Operator company dashboard
router.get(
  '/operator',
  authenticate,
  requireRole('OPERATOR'),
  operatorDashboardHandler
);

export default router;
