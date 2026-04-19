/**
 * Standardised API response helpers.
 * All handlers return consistent { success, message, data } shapes.
 */

export function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function created(res, data = null, message = 'Created') {
  return success(res, data, message, 201);
}

export function badRequest(res, message = 'Bad Request', errors = null) {
  return res.status(400).json({ success: false, message, ...(errors && { errors }) });
}

export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message });
}

export function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, message });
}

export function conflict(res, message = 'Conflict') {
  return res.status(409).json({ success: false, message });
}

export function notFound(res, message = 'Not Found') {
  return res.status(404).json({ success: false, message });
}

export function serverError(res, message = 'Internal Server Error') {
  return res.status(500).json({ success: false, message });
}
