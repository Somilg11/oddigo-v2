import { Router } from 'express';
import { FieldExecutiveController } from '../controllers/field-executive.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.FIELD_EXECUTIVE));

router.get('/workers', FieldExecutiveController.getWorkers);
router.get('/worker/:id/status', FieldExecutiveController.getWorkerStatus);
router.post('/worker/:id/visit', FieldExecutiveController.logVisit);
router.get('/quality-audit', FieldExecutiveController.getQualityAudits);
router.post('/quality-audit/:jobId', FieldExecutiveController.submitQualityAudit);

export default router;
