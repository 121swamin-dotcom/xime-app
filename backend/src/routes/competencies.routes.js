// competencies.routes.js
import { Router } from 'express';
import { getMyCompetencies, rateCompetency, rateTTF, getEvidence, submitEvidence } from '../controllers/competencies.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/',              requireAuth, getMyCompetencies);
router.post('/rate',         requireAuth, rateCompetency);
router.post('/rate-ttf',     requireAuth, rateTTF);
router.get('/evidence',      requireAuth, getEvidence);
router.post('/evidence',     requireAuth, submitEvidence);
export default router;
