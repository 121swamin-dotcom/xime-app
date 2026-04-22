import { Router } from 'express';
import { getMyMentoring, requestMentor, logSession, getAllMentoring, getMentorRequests, getMentors, assignMentor } from '../controllers/mentoring.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/my',          requireAuth,  getMyMentoring);
router.post('/request',    requireAuth,  requestMentor);
router.post('/sessions',   requireAuth,  logSession);
router.get('/all',         requireAdmin, getAllMentoring);
router.get('/requests',    requireAdmin, getMentorRequests);
router.get('/mentors',     requireAdmin, getMentors);
router.post('/assign',     requireAdmin, assignMentor);
export default router;
