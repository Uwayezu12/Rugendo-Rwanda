import { z } from 'zod';

const rwandaPhone = z
  .string()
  .regex(/^07(2|3|8|9)\d{7}$/, 'Phone must be a valid Rwanda number (e.g. 0781234567)');

const operatorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listOperatorsQuerySchema = z.object({
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

const createOperatorSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
    phone: rwandaPhone.optional().or(z.literal('')),
    password: z.string().min(8).max(100),
    companyId: z.coerce.number().int().positive(),
  })
  .superRefine((data, ctx) => {
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

const updateOperatorStatusSchema = z.object({
  isActive: z.boolean(),
});

const updateOperatorCompanySchema = z.object({
  companyId: z.coerce.number().int().positive(),
});

function handleValidationError(res, result) {
  return res.status(422).json({
    success: false,
    message: 'Validation error',
    errors: result.error.flatten().fieldErrors,
  });
}

export function validateListOperators(req, res, next) {
  const result = listOperatorsQuerySchema.safeParse(req.query);
  if (!result.success) return handleValidationError(res, result);
  req.validatedQuery = result.data;
  return next();
}

export function validateCreateOperator(req, res, next) {
  const result = createOperatorSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateOperatorIdParam(req, res, next) {
  const result = operatorIdParamSchema.safeParse(req.params);
  if (!result.success) return handleValidationError(res, result);
  req.validatedParams = result.data;
  return next();
}

export function validateOperatorStatus(req, res, next) {
  const result = updateOperatorStatusSchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}

export function validateOperatorCompany(req, res, next) {
  const result = updateOperatorCompanySchema.safeParse(req.body);
  if (!result.success) return handleValidationError(res, result);
  req.validatedBody = result.data;
  return next();
}
