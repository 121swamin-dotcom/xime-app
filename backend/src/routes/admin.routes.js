import { Router } from 'express';
import {
  getOverview, getActivations, approveActivation, rejectActivation,
  getEvidenceQueue, approveEvidence, rejectEvidence,
  getElectiveChanges, approveElectiveChange, rejectElectiveChange,
  getStudents, getStudentProfile,
} from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/overview',                       requireAdmin, getOverview);
router.get('/activations',                    requireAdmin, getActivations);
router.post('/activations/:id/approve',       requireAdmin, approveActivation);
router.post('/activations/:id/reject',        requireAdmin, rejectActivation);
router.get('/evidence',                       requireAdmin, getEvidenceQueue);
router.post('/evidence/:id/approve',          requireAdmin, approveEvidence);
router.post('/evidence/:id/reject',           requireAdmin, rejectEvidence);
router.get('/elective-changes',               requireAdmin, getElectiveChanges);
router.post('/elective-changes/:id/approve',  requireAdmin, approveElectiveChange);
router.post('/elective-changes/:id/reject',   requireAdmin, rejectElectiveChange);
router.get('/students',                       requireAdmin, getStudents);
router.get('/students/:id',                   requireAdmin, getStudentProfile);
export default router;
