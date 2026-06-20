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
router.get('/workers/pending-verification', AdminController.getPendingVerifications);
router.get('/workers/:id', AdminController.getWorker);
router.get('/workers/:id/kyc', AdminController.getWorkerKYC);
router.delete('/workers/:id', AdminController.deleteWorker);
router.post('/verify-worker', AdminController.verifyWorker);
router.patch('/users/status', AdminController.toggleUserStatus);
router.post('/workers/bulk-verify', AdminController.bulkVerify);

// Live Operations
router.get('/operations/live', AdminController.getLiveOperations);

// Complaint Management
router.get('/complaints', AdminController.getComplaints);
router.post('/complaints/:id/resolve', AdminController.resolveComplaint);

// Service Management
router.get('/services/categories', AdminController.getAllCategories);
router.post('/services/categories', AdminController.createCategory);
router.patch('/services/categories/:id', AdminController.updateCategory);
router.delete('/services/categories/:id', AdminController.deleteCategory);

router.get('/services/sub-services', AdminController.getAllSubServices);
router.post('/services/sub-services', AdminController.createSubService);
router.patch('/services/sub-services/:id', AdminController.updateSubService);
router.delete('/services/sub-services/:id', AdminController.deleteSubService);

// Banner Management
router.get('/banners', AdminController.getBanners);
router.post('/banners', AdminController.createBanner);
router.patch('/banners/:id', AdminController.updateBanner);
router.delete('/banners/:id', AdminController.deleteBanner);

// Coupon Management
router.get('/coupons', AdminController.getCoupons);
router.post('/coupons', AdminController.createCoupon);
router.patch('/coupons/:id', AdminController.updateCoupon);
router.delete('/coupons/:id', AdminController.deleteCoupon);

// Analytics
router.get('/analytics/referrals', AdminController.getReferralAnalytics);
router.get('/analytics/points', AdminController.getPointsAnalytics);
router.get('/analytics/coupons', AdminController.getCouponAnalytics);

export default router;
