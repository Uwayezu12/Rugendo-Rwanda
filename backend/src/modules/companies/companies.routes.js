import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  createCompanyHandler,
  listCompaniesHandler,
  updateCompanyHandler,
  updateCompanyStatusHandler,
} from './companies.controller.js';
import {
  validateCompanyIdParam,
  validateCompanyStatus,
  validateCreateCompany,
  validateListCompanies,
  validateUpdateCompany,
} from './companies.validator.js';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', validateListCompanies, listCompaniesHandler);
router.post('/', validateCreateCompany, createCompanyHandler);
router.patch('/:id', validateCompanyIdParam, validateUpdateCompany, updateCompanyHandler);
router.patch('/:id/status', validateCompanyIdParam, validateCompanyStatus, updateCompanyStatusHandler);

export default router;
