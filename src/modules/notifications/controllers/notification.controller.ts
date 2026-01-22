import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class NotificationController {
    static async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const notifications = await NotificationService.getUserNotifications(req.user!._id);
            res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            next(error);
        }
    }

    static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await NotificationService.markRead(id, req.user!._id);
            res.status(200).json({ success: true, message: 'Marked as read' });
        } catch (error) {
            next(error);
        }
    }
}
