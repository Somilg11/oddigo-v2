import { Router } from 'express';
import { WarrantyController } from '../controllers/warranty.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';

const router = Router();

router.use(protect);

router.post('/:jobId/claim', WarrantyController.claimWarranty);
router.get('/:jobId/status', WarrantyController.getClaimStatus);

// Admin routes
router.patch('/:claimId/resolve', restrictTo(UserRole.ADMIN), WarrantyController.resolveClaim);

export default router;
