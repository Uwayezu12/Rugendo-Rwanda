import { z } from 'zod';

const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional().default(''),
  status: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(['active', 'inactive']).optional(),
  ),
});

const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(100),
  licenseNo: z.string().trim().max(100).optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  licenseNo: z.string().trim().max(100).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
}).refine(
  (data) => data.name !== undefined || data.licenseNo !== undefined || data.isActive !== undefined,
  {
    message: 'At least one field is required.',
    path: ['name'],
  },
);

const updateCompanyStatusSchema = z.object({
  isActive: z.boolean(),
});

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

export function validateListCompanies(req, res, next) {
  const result = listCompaniesQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateCreateCompany(req, res, next) {
  const result = createCompanySchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateCompanyIdParam(req, res, next) {
  const result = companyIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateUpdateCompany(req, res, next) {
  const result = updateCompanySchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateCompanyStatus(req, res, next) {
  const result = updateCompanyStatusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
