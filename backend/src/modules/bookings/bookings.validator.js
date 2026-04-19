import { z } from 'zod';

const createBookingSchema = z.object({
  scheduleId: z.number().int().positive('scheduleId must be a positive integer'),
  seats:      z.number().int().min(1).max(10, 'Maximum 10 seats per booking'),
});

export function validateCreateBooking(data) {
  return createBookingSchema.safeParse(data);
}

// ── Admin validators ──────────────────────────────────────────────────────────

const BOOKING_STATUSES  = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAYMENT_STATUSES  = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors:  result.error.flatten().fieldErrors,
  });
}

const listBookingsAdminSchema = z.object({
  page:          z.coerce.number().int().min(1).optional().default(1),
  limit:         z.coerce.number().int().min(1).max(100).optional().default(20),
  status:        z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(BOOKING_STATUSES).optional(),
  ),
  paymentStatus: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(PAYMENT_STATUSES).optional(),
  ),
  routeId:       z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  scheduleId:    z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  userId:        z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  date:          z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  ),
});

const bookingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export function validateAdminListBookings(req, res, next) {
  const result = listBookingsAdminSchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateBookingIdParam(req, res, next) {
  const result = bookingIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}
