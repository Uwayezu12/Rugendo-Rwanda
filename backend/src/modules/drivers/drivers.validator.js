import { z } from 'zod';

const rwandaPhone = z
  .string()
  .regex(/^07(2|3|8|9)\d{7}$/, 'Phone must be a valid Rwanda number (e.g. 0781234567)');

const driverIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listDriversQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional().default(''),
  companyId: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  status: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(['active', 'inactive']).optional(),
  ),
});

const createDriverSchema = z.object({
  name: z.string().trim().min(2).max(100),
  licenseNo: z.string().trim().min(3).max(50),
  phone: rwandaPhone.optional().or(z.literal('')),
  companyId: z.coerce.number().int().positive(),
});

const updateDriverSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  licenseNo: z.string().trim().min(3).max(50).optional(),
  phone: rwandaPhone.optional().or(z.literal('')),
  companyId: z.coerce.number().int().positive().optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: 'At least one field is required',
    path: ['name'],
  },
);

const updateDriverStatusSchema = z.object({
  isActive: z.boolean(),
});

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

export function validateListDrivers(req, res, next) {
  const result = listDriversQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateCreateDriver(req, res, next) {
  const result = createDriverSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateUpdateDriver(req, res, next) {
  const result = updateDriverSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateDriverIdParam(req, res, next) {
  const result = driverIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateDriverStatus(req, res, next) {
  const result = updateDriverStatusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
