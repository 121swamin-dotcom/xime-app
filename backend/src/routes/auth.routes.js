import { Router } from 'express';
import {
  activateAccount,
  approveActivation,
  rejectActivation,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/activate',          activateAccount);
router.get('/activate/approve',   approveActivation);   // tokenised link from email
router.get('/activate/reject',    rejectActivation);    // tokenised link from email
router.post('/login',             login);
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password',    resetPassword);

export default router;
