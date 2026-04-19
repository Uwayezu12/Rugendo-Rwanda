import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  createDriverHandler,
  listDriverCompaniesHandler,
  listDriversHandler,
  updateDriverHandler,
  updateDriverStatusHandler,
} from './drivers.controller.js';
import {
  validateCreateDriver,
  validateDriverIdParam,
  validateDriverStatus,
  validateListDrivers,
  validateUpdateDriver,
} from './drivers.validator.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/companies', listDriverCompaniesHandler);
router.get('/', validateListDrivers, listDriversHandler);
router.post('/', validateCreateDriver, createDriverHandler);
router.patch('/:id', validateDriverIdParam, validateUpdateDriver, updateDriverHandler);
router.patch('/:id/status', validateDriverIdParam, validateDriverStatus, updateDriverStatusHandler);

export default router;
