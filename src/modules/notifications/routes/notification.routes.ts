import { Router } from 'express';
import { protect } from '../../../core/middlewares/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

router.use(protect);

router.get('/', NotificationController.getMyNotifications);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
