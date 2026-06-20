import { Router } from 'express';
import authRoutes from '../core/auth/routes/auth.routes';
import userRoutes from '../modules/users/routes/user.routes';
import workerRoutes from '../modules/workers/routes/worker.routes';
import jobRoutes from '../modules/jobs/routes/job.routes';
import adminRoutes from '../modules/admin/routes/admin.routes';
import notificationRoutes from '../modules/notifications/routes/notification.routes';
import serviceRoutes from '../modules/services/routes/service.routes';
import ratingRoutes from '../modules/ratings/routes/rating.routes';
import warrantyRoutes from '../modules/warranty/routes/warranty.routes';
import fieldExecutiveRoutes from '../modules/field-executive/routes/field-executive.routes';
import zoneManagerRoutes from '../modules/zones/routes/zone-manager.routes';
import cityManagerRoutes from '../modules/city-manager/routes/city-manager.routes';
import couponRoutes from '../modules/admin/routes/coupon.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workers', workerRoutes);
router.use('/jobs', jobRoutes);
router.use('/notifications', notificationRoutes);
router.use('/services', serviceRoutes);
router.use('/ratings', ratingRoutes);
router.use('/warranty', warrantyRoutes);
router.use('/field-executive', fieldExecutiveRoutes);
router.use('/zone-manager', zoneManagerRoutes);
router.use('/city-manager', cityManagerRoutes);
router.use('/admin', adminRoutes);
router.use('/coupons', couponRoutes);

export default router;
