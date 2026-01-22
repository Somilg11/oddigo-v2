import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

// Protect & Restrict to Admin
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.get('/health', AdminController.getSystemHealth);
router.post('/maintenance', AdminController.toggleMaintenance);
router.post('/verify-worker', AdminController.verifyWorker);
router.patch('/users/status', AdminController.toggleUserStatus); // Body: { userId, isActive }
router.get('/analytics', AdminController.getAnalytics);
router.get('/disputes', AdminController.getDisputes);

export default router;
