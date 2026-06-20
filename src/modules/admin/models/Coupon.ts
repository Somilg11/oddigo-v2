import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum CouponType {
    PERCENTAGE = 'PERCENTAGE',
    FLAT = 'FLAT',
    FREE_DELIVERY = 'FREE_DELIVERY'
}

export interface ICoupon extends Document {
    code: string;
    description: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    perUserLimit?: number;
    applicableCategories?: mongoose.Types.ObjectId[];
    isActive: boolean;
    startsAt?: Date;
    expiresAt?: Date;
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(CouponType), required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, min: 0 },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ expiresAt: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
