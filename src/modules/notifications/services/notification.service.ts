import { Notification } from '../models/Notification';
import { AppError } from '../../../core/errors/AppError';

export class NotificationService {

    static async create(userId: string, type: string, title: string, message: string, data?: any) {
        return await Notification.create({
            user: userId,
            type,
            title,
            message,
            data
        });
    }

    static async getUserNotifications(userId: string, page = 1, limit = 15) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments({ user: userId })
        ]);
        return { notifications, total, page, limit, pages: Math.ceil(total / limit) };
    }

    static async markRead(notificationId: string, userId: string) {
        const notif = await Notification.findOne({ _id: notificationId, user: userId });
        if (!notif) throw new AppError('Notification not found', 404);

        notif.isRead = true;
        await notif.save();
        return notif;
    }
}
