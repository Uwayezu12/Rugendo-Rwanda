import { z } from 'zod';

const BUS_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
const BUS_TOGGLE_STATUSES = ['ACTIVE', 'INACTIVE'];

const busIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listBusesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional().default(''),
  companyId: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  status: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(BUS_STATUSES).optional(),
  ),
});

const createBusSchema = z.object({
  plateNumber: z.string().trim().min(3).max(30),
  model: z.string().trim().max(100).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(100),
  companyId: z.coerce.number().int().positive(),
  status: z.enum(BUS_STATUSES).optional().default('ACTIVE'),
});

const updateBusSchema = z.object({
  plateNumber: z.string().trim().min(3).max(30).optional(),
  model: z.string().trim().max(100).optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(100).optional(),
  companyId: z.coerce.number().int().positive().optional(),
  status: z.enum(BUS_STATUSES).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: 'At least one field is required',
    path: ['plateNumber'],
  },
);

const updateBusStatusSchema = z.object({
  status: z.enum(BUS_TOGGLE_STATUSES),
});

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

export function validateListBuses(req, res, next) {
  const result = listBusesQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateCreateBus(req, res, next) {
  const result = createBusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateUpdateBus(req, res, next) {
  const result = updateBusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateBusIdParam(req, res, next) {
  const result = busIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateBusStatus(req, res, next) {
  const result = updateBusStatusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
