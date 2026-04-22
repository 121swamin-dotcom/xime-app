import { Router } from 'express';
import { getMyCounselling, requestCounselling, getAllCounselling, confirmCounselling, declineCounselling } from '../controllers/counselling.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/',                    requireAuth,  getMyCounselling);
router.post('/',                   requireAuth,  requestCounselling);
router.get('/all',                 requireAdmin, getAllCounselling);
router.post('/:id/confirm',        requireAdmin, confirmCounselling);
router.post('/:id/decline',        requireAdmin, declineCounselling);
export default router;
