import { Router } from 'express';
import { getRoleCategories, getRoleCategory, getCompanies } from '../controllers/roles.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/categories',        requireAuth, getRoleCategories);
router.get('/categories/:code',  requireAuth, getRoleCategory);
router.get('/companies',         requireAuth, getCompanies);

export default router;
