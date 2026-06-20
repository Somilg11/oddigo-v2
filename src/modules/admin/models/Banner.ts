import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum BannerType {
    PROMOTION = 'PROMOTION',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    COUPON = 'COUPON',
    INFO = 'INFO'
}

export interface IBanner extends Document {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    type: BannerType;
    isActive: boolean;
    sortOrder: number;
    startsAt?: Date;
    expiresAt?: Date;
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    imageUrl: { type: String },
    linkUrl: { type: String },
    type: { type: String, enum: Object.values(BannerType), required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

BannerSchema.index({ isActive: 1 });
BannerSchema.index({ type: 1 });
BannerSchema.index({ sortOrder: 1 });
BannerSchema.index({ startsAt: 1, expiresAt: 1 });

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
