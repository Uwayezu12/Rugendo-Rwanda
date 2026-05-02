import { z } from 'zod';

const NOTIFICATION_STATUSES = ['UNREAD', 'READ', 'ARCHIVED'];
const NOTIFICATION_TYPES    = ['BOOKING', 'PAYMENT', 'SCHEDULE', 'BOARDING', 'ACCOUNT', 'COMPANY', 'SYSTEM', 'SECURITY'];

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors:  result.error.flatten().fieldErrors,
  });
}

// ── Query params for GET /notifications ──────────────────────────────────────

const listNotificationsSchema = z.object({
  page:   z.coerce.number().int().min(1).optional().default(1),
  limit:  z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(NOTIFICATION_STATUSES).optional(),
  ),
  type: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(NOTIFICATION_TYPES).optional(),
  ),
});

export function validateListNotifications(req, res, next) {
  const result = listNotificationsSchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

// ── Route param :id ──────────────────────────────────────────────────────────

const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export function validateNotificationIdParam(req, res, next) {
  const result = notificationIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}
