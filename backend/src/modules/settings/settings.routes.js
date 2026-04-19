import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
  getPublicAuthPanelHandler,
  getSettingsHandler,
  updateSettingHandler,
} from './settings.controller.js';

const router = Router();

router.get('/auth-panel', getPublicAuthPanelHandler);
router.get('/',     authenticate, requireRole('SUPER_ADMIN'), getSettingsHandler);
router.put('/:key', authenticate, requireRole('SUPER_ADMIN'), updateSettingHandler);

export default router;
