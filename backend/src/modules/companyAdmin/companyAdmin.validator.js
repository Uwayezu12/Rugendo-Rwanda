import { z } from 'zod';

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const SCHEDULE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const BUS_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
const BUS_TOGGLE_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
const ACTIVE_STATUSES = ['active', 'inactive'];

const rwandaPhone = z
  .string()
  .regex(/^07(2|3|8|9)\d{7}$/, 'Phone must be a valid Rwanda number (e.g. 0781234567)');

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const bookingListSchema = pageQuerySchema.extend({
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(BOOKING_STATUSES).optional(),
  ),
  paymentStatus: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(PAYMENT_STATUSES).optional(),
  ),
  search: z.string().trim().max(50).optional().default(''),
});

const scheduleListSchema = pageQuerySchema.extend({
  routeId: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(SCHEDULE_STATUSES).optional(),
  ),
});

const scheduleCreateSchema = z.object({
  routeId: z.coerce.number().int().positive(),
  busId: z.coerce.number().int().positive(),
  driverId: z.coerce.number().int().positive(),
  departureTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid departure time'),
  arrivalTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid arrival time'),
  seatsTotal: z.coerce.number().int().min(1).max(200),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(SCHEDULE_STATUSES).optional(),
  ),
}).refine(
  (data) => new Date(data.departureTime) < new Date(data.arrivalTime),
  { message: 'Departure time must be before arrival time', path: ['arrivalTime'] },
);

const scheduleUpdateSchema = z.object({
  routeId: z.coerce.number().int().positive().optional(),
  busId: z.coerce.number().int().positive().optional(),
  driverId: z.coerce.number().int().positive().optional(),
  departureTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid departure time').optional(),
  arrivalTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid arrival time').optional(),
  seatsTotal: z.coerce.number().int().min(1).max(200).optional(),
  status: z.enum(SCHEDULE_STATUSES).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
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

const busListSchema = pageQuerySchema.extend({
  search: z.string().trim().max(100).optional().default(''),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(BUS_STATUSES).optional(),
  ),
});

const busCreateSchema = z.object({
  plateNumber: z.string().trim().min(3).max(30),
  model: z.string().trim().max(100).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(100),
  status: z.enum(BUS_STATUSES).optional().default('ACTIVE'),
});

const busUpdateSchema = z.object({
  plateNumber: z.string().trim().min(3).max(30).optional(),
  model: z.string().trim().max(100).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(BUS_STATUSES).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required', path: ['plateNumber'] },
);

const busStatusSchema = z.object({
  status: z.enum(BUS_TOGGLE_STATUSES),
});

const driverListSchema = pageQuerySchema.extend({
  search: z.string().trim().max(100).optional().default(''),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(ACTIVE_STATUSES).optional(),
  ),
});

const driverCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  licenseNo: z.string().trim().min(3).max(50),
  phone: rwandaPhone.optional().or(z.literal('')),
});

const driverUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  licenseNo: z.string().trim().min(3).max(50).optional(),
  phone: rwandaPhone.optional().or(z.literal('')),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required', path: ['name'] },
);

const activeStatusSchema = z.object({
  isActive: z.boolean(),
});

const operatorListSchema = pageQuerySchema.extend({
  search: z.string().trim().max(100).optional().default(''),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(ACTIVE_STATUSES).optional(),
  ),
});

const operatorCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: rwandaPhone.optional().or(z.literal('')),
  password: z.string().min(8).max(100),
}).superRefine((data, ctx) => {
  const hasEmail = data.email && data.email.trim() !== '';
  const hasPhone = data.phone && data.phone.trim() !== '';
  if (!hasEmail && !hasPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'At least one of email or phone number is required.',
    });
  }
});

const operatorUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: rwandaPhone.optional().or(z.literal('')),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required', path: ['name'] },
);

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

function validate(schema, source = 'body', target = 'validatedBody') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return handleValidationError(res, result);
    req[target] = result.data;
    return next();
  };
}

export const validateIdParam = validate(idParamSchema, 'params', 'validatedParams');
export const validateBookingList = validate(bookingListSchema, 'query', 'validatedQuery');
export const validateScheduleList = validate(scheduleListSchema, 'query', 'validatedQuery');
export const validateScheduleCreate = validate(scheduleCreateSchema);
export const validateScheduleUpdate = validate(scheduleUpdateSchema);
export const validateBusList = validate(busListSchema, 'query', 'validatedQuery');
export const validateBusCreate = validate(busCreateSchema);
export const validateBusUpdate = validate(busUpdateSchema);
export const validateBusStatus = validate(busStatusSchema);
export const validateDriverList = validate(driverListSchema, 'query', 'validatedQuery');
export const validateDriverCreate = validate(driverCreateSchema);
export const validateDriverUpdate = validate(driverUpdateSchema);
export const validateActiveStatus = validate(activeStatusSchema);
export const validateOperatorList = validate(operatorListSchema, 'query', 'validatedQuery');
export const validateOperatorCreate = validate(operatorCreateSchema);
export const validateOperatorUpdate = validate(operatorUpdateSchema);
