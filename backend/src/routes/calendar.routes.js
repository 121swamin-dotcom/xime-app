import { Router } from 'express';
import { getSlots } from '../controllers/calendar.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/slots', requireAuth, getSlots);
export default router;
