import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class NotificationController {
    static async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '15' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const result = await NotificationService.getUserNotifications(req.user!._id, pageNum, limitNum);
            res.status(200).json({
                success: true,
                pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
                data: result.notifications
            });
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
