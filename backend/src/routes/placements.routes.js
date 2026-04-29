import { Router } from 'express';
import { getPlacements, getPlacementsByCategory } from '../controllers/placements.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/',                    requireAuth, getPlacements);
router.get('/by-category/:code',   requireAuth, getPlacementsByCategory);
export default router;
