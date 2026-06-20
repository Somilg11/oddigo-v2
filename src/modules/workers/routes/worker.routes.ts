import { Router } from 'express';
import { WorkerController } from '../controllers/worker.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.WORKER));

router.get('/me', WorkerController.getMyProfile);
router.post('/onboarding', WorkerController.onboarding);
router.post('/availability', WorkerController.toggleAvailability);
router.get('/stats', WorkerController.getStats);
router.post('/kyc/upload', WorkerController.uploadKYC);
router.post('/kyc/submit', WorkerController.submitForVerification);
router.get('/kyc', WorkerController.getMyKYC);

export default router;
