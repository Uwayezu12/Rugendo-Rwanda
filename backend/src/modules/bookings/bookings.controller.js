import { validateCreateBooking } from './bookings.validator.js';
import { createBooking, getMyBookings, getBookingById, cancelBooking, getOperatorCompanyBookings, listBookingsAdmin, getBookingByIdAdmin } from './bookings.service.js';
import { created, success, badRequest, notFound, serverError, forbidden, conflict } from '../../utils/apiResponse.js';

export async function handleCreateBooking(req, res) {
  const result = validateCreateBooking(req.body);
  if (!result.success) {
    return badRequest(res, 'Validation failed', result.error.flatten().fieldErrors);
  }

  try {
    const booking = await createBooking(req.user.id, result.data);
    return created(res, booking, 'Booking created');
  } catch (err) {
    if (err.code === 'DUPLICATE_BOOKING')  return conflict(res, err.message);
    if (err.code === 'NOT_FOUND')          return notFound(res, err.message);
    if (err.code === 'UNAVAILABLE')        return badRequest(res, err.message);
    if (err.code === 'DEPARTED')           return badRequest(res, err.message);
    if (err.code === 'INSUFFICIENT_SEATS') return badRequest(res, err.message);
    console.error('createBooking error:', err);
    return serverError(res);
  }
}

export async function handleGetMyBookings(req, res) {
  try {
    const bookings = await getMyBookings(req.user.id);
    return success(res, bookings);
  } catch (err) {
    console.error('getMyBookings error:', err);
    return serverError(res);
  }
}

export async function handleCancelBooking(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return badRequest(res, 'Invalid booking id');

  try {
    const booking = await cancelBooking(id, req.user.id);
    return success(res, booking, 'Booking cancelled');
  } catch (err) {
    if (err.code === 'NOT_FOUND')     return notFound(res, err.message);
    if (err.code === 'FORBIDDEN')     return forbidden(res, err.message);
    if (err.code === 'INVALID_STATE') return badRequest(res, err.message);
    console.error('cancelBooking error:', err);
    return serverError(res);
  }
}

export async function handleGetOperatorCompanyBookings(req, res) {
  try {
    const result = await getOperatorCompanyBookings(req.user.id);
    return success(res, result);
  } catch (err) {
    if (err.code === 'FORBIDDEN') return forbidden(res, err.message);
    console.error('getOperatorCompanyBookings error:', err);
    return serverError(res);
  }
}

export async function handleAdminListBookings(req, res) {
  try {
    const result = await listBookingsAdmin(req.validatedQuery);
    return success(res, result);
  } catch (err) {
    console.error('adminListBookings error:', err);
    return serverError(res);
  }
}

export async function handleAdminGetBooking(req, res) {
  const id = req.validatedParams.id;
  try {
    const booking = await getBookingByIdAdmin(id);
    if (!booking) return notFound(res, 'Booking not found');
    return success(res, booking);
  } catch (err) {
    console.error('adminGetBooking error:', err);
    return serverError(res);
  }
}

export async function handleGetBookingById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return badRequest(res, 'Invalid booking id');

  try {
    // Passengers can only see their own bookings; admins pass null to skip check
    const isPassenger = req.user.role === 'PASSENGER';
    const booking = await getBookingById(id, isPassenger ? req.user.id : null);
    if (!booking) return notFound(res, 'Booking not found');
    return success(res, booking);
  } catch (err) {
    console.error('getBookingById error:', err);
    return serverError(res);
  }
}
