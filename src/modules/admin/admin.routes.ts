import express from 'express';
import * as adminController from './admin.controller';
import { protect, authorize } from '../../middlewares/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/workers', adminController.getAllWorkers);
router.patch('/workers/:id/verify', adminController.verifyWorker);

export default router;
