import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  createBusHandler,
  listBusCompaniesHandler,
  listBusesHandler,
  updateBusHandler,
  updateBusStatusHandler,
} from './buses.controller.js';
import {
  validateBusIdParam,
  validateBusStatus,
  validateCreateBus,
  validateListBuses,
  validateUpdateBus,
} from './buses.validator.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/companies', listBusCompaniesHandler);
router.get('/', validateListBuses, listBusesHandler);
router.post('/', validateCreateBus, createBusHandler);
router.patch('/:id', validateBusIdParam, validateUpdateBus, updateBusHandler);
router.patch('/:id/status', validateBusIdParam, validateBusStatus, updateBusStatusHandler);

export default router;
