import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  createOperatorHandler,
  listCompaniesHandler,
  listOperatorsHandler,
  updateOperatorCompanyHandler,
  updateOperatorStatusHandler,
} from './operators.controller.js';
import {
  validateCreateOperator,
  validateListOperators,
  validateOperatorCompany,
  validateOperatorIdParam,
  validateOperatorStatus,
} from './operators.validator.js';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/companies', listCompaniesHandler);
router.get('/', validateListOperators, listOperatorsHandler);
router.post('/', validateCreateOperator, createOperatorHandler);
router.patch('/:id/status', validateOperatorIdParam, validateOperatorStatus, updateOperatorStatusHandler);
router.patch('/:id/company', validateOperatorIdParam, validateOperatorCompany, updateOperatorCompanyHandler);

export default router;
