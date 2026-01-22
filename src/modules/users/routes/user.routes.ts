import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect } from '../../../core/middlewares/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);
router.post('/addresses', UserController.addAddress);
router.delete('/addresses/:id', UserController.deleteAddress);

export default router;
