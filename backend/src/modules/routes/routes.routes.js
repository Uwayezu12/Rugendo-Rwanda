import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { verifyAccessToken } from '../../utils/jwt.utils.js';
import {
  createRouteHandler,
  listRoutesHandler,
  updateRouteHandler,
  updateRouteStatusHandler,
} from './routes.controller.js';
import {
  validateCreateRoute,
  validateListRoutes,
  validateRouteIdParam,
  validateRouteStatus,
  validateUpdateRoute,
} from './routes.validator.js';

const router = Router();

function attachUserIfPresent(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
  } catch {
    req.user = null;
  }

  return next();
}

router.get('/', attachUserIfPresent, validateListRoutes, listRoutesHandler);

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.post('/', validateCreateRoute, createRouteHandler);
router.patch('/:id', validateRouteIdParam, validateUpdateRoute, updateRouteHandler);
router.patch('/:id/status', validateRouteIdParam, validateRouteStatus, updateRouteStatusHandler);

export default router;
