import { Router } from 'express';
import authRoutes from '../core/auth/routes/auth.routes';
import userRoutes from '../modules/users/routes/user.routes';
import workerRoutes from '../modules/workers/routes/worker.routes';
import jobRoutes from '../modules/jobs/routes/job.routes';
import adminRoutes from '../modules/admin/routes/admin.routes';

const router = Router();

import notificationRoutes from '../modules/notifications/routes/notification.routes';

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workers', workerRoutes);
router.use('/jobs', jobRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
// Mount other routes here
// router.use('/users', userRoutes);
// router.use('/jobs', jobRoutes);

export default router;
