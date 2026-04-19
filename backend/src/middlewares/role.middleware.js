import { forbidden } from '../utils/apiResponse.js';

/**
 * Restricts access to users with one of the allowed roles.
 * Must be used AFTER authenticate().
 *
 * Usage: router.get('/admin-only', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }
    next();
  };
}
