import { verifyAccessToken } from '../utils/jwt.utils.js';
import { unauthorized } from '../utils/apiResponse.js';

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded payload to req.user.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
}
