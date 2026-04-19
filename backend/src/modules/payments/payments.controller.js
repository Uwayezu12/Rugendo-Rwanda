import { validatePay } from './payments.validator.js';
import { payBooking } from './payments.service.js';
import { success, badRequest, notFound, forbidden, serverError } from '../../utils/apiResponse.js';

export async function handlePay(req, res) {
  const result = validatePay(req.body);
  if (!result.success) {
    return badRequest(res, 'Validation failed', result.error.flatten().fieldErrors);
  }

  try {
    const { booking, payment } = await payBooking(req.user.id, result.data);
    return success(res, { booking, payment }, 'Payment processed');
  } catch (err) {
    if (err.code === 'NOT_FOUND')          return notFound(res, err.message);
    if (err.code === 'FORBIDDEN')          return forbidden(res, err.message);
    if (err.code === 'INVALID_STATE')      return badRequest(res, err.message);
    if (err.code === 'CONFLICT')           return badRequest(res, err.message);
    if (err.code === 'INSUFFICIENT_SEATS') return badRequest(res, err.message);
    console.error('handlePay error:', err);
    return serverError(res);
  }
}
