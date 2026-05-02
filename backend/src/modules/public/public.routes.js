import { Router } from 'express';
import { publicStatsHandler } from './public.controller.js';

const router = Router();

// No authentication required — public homepage stats
router.get('/stats', publicStatsHandler);

export default router;
