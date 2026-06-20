import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.post('/validate', protect, AdminController.validateCoupon);

export default router;
