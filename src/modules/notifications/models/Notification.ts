import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    type: string; // 'JOB_OFFER', 'SCOPE_CREEP', 'WARRANTY', 'SYSTEM'
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed }, // Arbitrary payload
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-delete after 30 days
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
