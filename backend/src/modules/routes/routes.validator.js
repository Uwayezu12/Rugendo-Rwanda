import { z } from 'zod';

const routeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const routeDistanceSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.coerce.number().positive().max(2000), z.null()]).optional(),
);

const routeDurationSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.coerce.number().int().positive().max(2880), z.null()]).optional(),
);

const listRoutesQuerySchema = z.object({
  scope: z.preprocess(
    (value) => (value === '' || value === undefined ? 'public' : value),
    z.enum(['public', 'admin']),
  ),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional().default(''),
  status: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(['active', 'inactive']).optional(),
  ),
});

const createRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(2).max(100),
  distanceKm: routeDistanceSchema,
  durationMin: routeDurationSchema,
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => data.origin.trim().toLowerCase() !== data.destination.trim().toLowerCase(),
  {
    message: 'Origin and destination must be different',
    path: ['destination'],
  },
);

const updateRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100).optional(),
  distanceKm: routeDistanceSchema,
  durationMin: routeDurationSchema,
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: 'At least one field is required',
    path: ['origin'],
  },
);

const updateRouteStatusSchema = z.object({
  isActive: z.boolean(),
});

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

export function validateListRoutes(req, res, next) {
  const result = listRoutesQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateCreateRoute(req, res, next) {
  const result = createRouteSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateUpdateRoute(req, res, next) {
  const result = updateRouteSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateRouteIdParam(req, res, next) {
  const result = routeIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateRouteStatus(req, res, next) {
  const result = updateRouteStatusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
