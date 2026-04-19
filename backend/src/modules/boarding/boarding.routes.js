import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  handleLookupBoarding,
  handleValidateBoarding,
} from './boarding.controller.js';

const router = Router();

router.get('/lookup', authenticate, requireRole('OPERATOR', 'ADMIN', 'SUPER_ADMIN'), handleLookupBoarding);
router.post('/validate', authenticate, requireRole('OPERATOR', 'ADMIN', 'SUPER_ADMIN'), handleValidateBoarding);

export default router;
