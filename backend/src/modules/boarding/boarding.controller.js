import {
  lookupBoardingBooking,
  validateBoarding,
} from './boarding.service.js';
import {
  validateLookupBoarding,
  validateValidateBoarding,
} from './boarding.validator.js';
import {
  success,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from '../../utils/apiResponse.js';

function handleBoardingError(res, err) {
  if (err.code === 'NOT_FOUND') return notFound(res, err.message);
  if (err.code === 'FORBIDDEN') return forbidden(res, err.message);
  if (err.code === 'INVALID_STATE') return badRequest(res, err.message);
  return null;
}

export async function handleLookupBoarding(req, res) {
  const parsed = validateLookupBoarding(req.query);
  if (!parsed.success) {
    return badRequest(res, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  try {
    const bookings = await lookupBoardingBooking(req.user, parsed.data.query);
    return success(res, bookings, bookings.length ? 'Bookings found' : 'No matching bookings found');
  } catch (err) {
    const handled = handleBoardingError(res, err);
    if (handled) return handled;
    console.error('handleLookupBoarding error:', err);
    return serverError(res);
  }
}

export async function handleValidateBoarding(req, res) {
  const parsed = validateValidateBoarding(req.body);
  if (!parsed.success) {
    return badRequest(res, 'Validation failed', parsed.error.flatten().fieldErrors);
  }

  try {
    const booking = await validateBoarding(req.user, parsed.data);
    return success(res, booking, 'Boarding validated');
  } catch (err) {
    const handled = handleBoardingError(res, err);
    if (handled) return handled;
    console.error('handleValidateBoarding error:', err);
    return serverError(res);
  }
}
