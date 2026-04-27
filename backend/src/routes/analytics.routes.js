import { Router } from 'express';
import {
  getPeerBenchmark,
  getCareerPathway,
  getCareerPathwayAdmin,
  getRoleAnalytics,
  getEvidenceGallery,
} from '../controllers/analytics.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/peer-benchmark',              requireAuth,  getPeerBenchmark);
router.get('/career-pathway',              requireAuth,  getCareerPathway);
router.get('/career-pathway/:studentId',   requireAdmin, getCareerPathwayAdmin);
router.get('/role-analytics',              requireAdmin, getRoleAnalytics);
router.get('/evidence-gallery',            requireAuth,  getEvidenceGallery);

export default router;
