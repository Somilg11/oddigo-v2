import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.get('/health', AdminController.getSystemHealth);
router.post('/maintenance', AdminController.toggleMaintenance);
router.get('/analytics', AdminController.getAnalytics);
router.get('/disputes', AdminController.getDisputes);

// Worker Management
router.get('/workers', AdminController.getAllWorkers);
router.post('/verify-worker', AdminController.verifyWorker);
router.patch('/users/status', AdminController.toggleUserStatus);
router.get('/workers/pending-verification', AdminController.getPendingVerifications);
router.post('/workers/bulk-verify', AdminController.bulkVerify);

// Live Operations
router.get('/operations/live', AdminController.getLiveOperations);

// Complaint Management
router.get('/complaints', AdminController.getComplaints);
router.post('/complaints/:id/resolve', AdminController.resolveComplaint);

export default router;
