import { z } from 'zod';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayLocalStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

const scheduleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ── Public validators ─────────────────────────────────────────────────────────

export const searchSchedulesSchema = z.object({
  from:  z.string().min(1, 'Origin is required').trim(),
  to:    z.string().min(1, 'Destination is required').trim(),
  date:  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
    .optional()
    .default(() => todayLocalStr()),
  seats: z.coerce.number().int().min(1, 'At least 1 seat required').max(20).optional().default(1),
}).refine(
  (data) => data.from.trim().toLowerCase() !== data.to.trim().toLowerCase(),
  { message: 'Origin and destination cannot be the same', path: ['to'] }
);

export function validateSearchSchedules(req, res, next) {
  const result = searchSchedulesSchema.safeParse(req.query);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.validated = result.data;
  return next();
}

// ── Admin validators ──────────────────────────────────────────────────────────

const SCHEDULE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const listSchedulesQuerySchema = z.object({
  page:    z.coerce.number().int().min(1).optional().default(1),
  limit:   z.coerce.number().int().min(1).max(100).optional().default(20),
  routeId: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  status:  z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(SCHEDULE_STATUSES).optional(),
  ),
});

const createScheduleSchema = z.object({
  routeId:       z.coerce.number().int().positive(),
  busId:         z.coerce.number().int().positive(),
  driverId:      z.coerce.number().int().positive(),
  companyId:     z.coerce.number().int().positive(),
  departureTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid departure time'),
  arrivalTime:   z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid arrival time'),
  price:         z.coerce.number().positive('Price must be greater than 0'),
  seatsTotal:    z.coerce.number().int().min(1, 'Must have at least 1 seat').max(200),
  status:        z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(SCHEDULE_STATUSES).optional(),
  ),
}).refine(
  (data) => new Date(data.departureTime) < new Date(data.arrivalTime),
  { message: 'Departure time must be before arrival time', path: ['arrivalTime'] },
);

const updateScheduleSchema = z.object({
  routeId:       z.coerce.number().int().positive().optional(),
  busId:         z.coerce.number().int().positive().optional(),
  driverId:      z.coerce.number().int().positive().optional(),
  companyId:     z.coerce.number().int().positive().optional(),
  departureTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid departure time').optional(),
  arrivalTime:   z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid arrival time').optional(),
  price:         z.coerce.number().positive('Price must be greater than 0').optional(),
  seatsTotal:    z.coerce.number().int().min(1).max(200).optional(),
  status:        z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(SCHEDULE_STATUSES).optional(),
  ),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field is required', path: ['routeId'] },
).refine(
  (data) => {
    if (data.departureTime && data.arrivalTime) {
      return new Date(data.departureTime) < new Date(data.arrivalTime);
    }
    return true;
  },
  { message: 'Departure time must be before arrival time', path: ['arrivalTime'] },
);

export function validateListSchedules(req, res, next) {
  const result = listSchedulesQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateScheduleIdParam(req, res, next) {
  const result = scheduleIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateCreateSchedule(req, res, next) {
  const result = createScheduleSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateUpdateSchedule(req, res, next) {
  const result = updateScheduleSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
