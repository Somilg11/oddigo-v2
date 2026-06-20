import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

// Public route — lookup referral code during signup (no auth needed)
router.get('/referral/lookup/:code', UserController.lookupReferralCode);

// Protect all routes below
router.use(protect);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);
// Addresses
router.post('/addresses', UserController.addAddress);
router.patch('/addresses/:id', UserController.updateAddress);
router.delete('/addresses/:id', UserController.deleteAddress);
router.patch('/addresses/:id/default', UserController.setDefaultAddress);

// Points
router.get('/me/points', UserController.getPoints);
router.get('/me/points/history', UserController.getPointsHistory);

// Referral
router.get('/me/referral', UserController.getReferralInfo);

export default router;
