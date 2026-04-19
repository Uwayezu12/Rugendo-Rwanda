import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  handleCreateBooking,
  handleGetMyBookings,
  handleGetBookingById,
  handleCancelBooking,
  handleGetOperatorCompanyBookings,
  handleAdminListBookings,
  handleAdminGetBooking,
} from './bookings.controller.js';
import {
  validateAdminListBookings,
  validateBookingIdParam,
} from './bookings.validator.js';

const router = Router();

// ── Named sub-paths (must be before /:id wildcard) ───────────────────────────

// Passenger: list own bookings
router.get('/my', authenticate, requireRole('PASSENGER'), handleGetMyBookings);

// Operator: list all bookings for operator's company
router.get('/operator-company', authenticate, requireRole('OPERATOR'), handleGetOperatorCompanyBookings);

// Admin: list all bookings with filters + pagination
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validateAdminListBookings, handleAdminListBookings);

// Admin: get single booking detail
router.get('/admin/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), validateBookingIdParam, handleAdminGetBooking);

// ── Wildcard / mutation routes ────────────────────────────────────────────────

// Passenger: cancel a PENDING booking
router.patch('/:id/cancel', authenticate, requireRole('PASSENGER'), handleCancelBooking);

// Authenticated: get booking by id (ownership enforced in controller for passengers)
router.get('/:id', authenticate, handleGetBookingById);

// Passenger: create a booking
router.post('/', authenticate, requireRole('PASSENGER'), handleCreateBooking);

export default router;
