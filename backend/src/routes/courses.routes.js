import { Router } from 'express';
import { getCourses, getCourse } from '../controllers/courses.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/',     requireAuth, getCourses);
router.get('/:code', requireAuth, getCourse);

export default router;
