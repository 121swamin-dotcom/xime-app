import { Router } from 'express';
import {
  getTargets, setTargets,
  getRegistrations, register,
  getRoleFit,
  getChangeRequests, requestChange,
} from '../controllers/electives.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/targets',          requireAuth, getTargets);
router.post('/targets',         requireAuth, setTargets);
router.get('/registrations',    requireAuth, getRegistrations);
router.post('/register',        requireAuth, register);
router.get('/role-fit',         requireAuth, getRoleFit);
router.get('/change-requests',  requireAuth, getChangeRequests);
router.post('/change-requests', requireAuth, requestChange);

export default router;
