import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { handlePay } from './payments.controller.js';

const router = Router();

// Passenger initiates (simulated) payment for a booking
router.post('/pay', authenticate, requireRole('PASSENGER'), handlePay);

export default router;
