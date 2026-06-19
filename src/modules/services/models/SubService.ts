import mongoose, { Schema, Document } from 'mongoose';
import { IServiceCategory } from './ServiceCategory';

export enum PricingType {
    FIXED = 'FIXED',
    ESTIMATE = 'ESTIMATE'
}

export interface ISubService extends Document {
    name: string;
    slug: string;
    category: IServiceCategory['_id'];
    description: string;
    basePrice: number;
    estimatedTime: number; // in minutes
    pricingType: PricingType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubServiceSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    estimatedTime: { type: Number, required: true, min: 1 }, // minutes
    pricingType: { type: String, enum: Object.values(PricingType), default: PricingType.ESTIMATE },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

SubServiceSchema.index({ category: 1 });
SubServiceSchema.index({ isActive: 1 });

export const SubService = mongoose.model<ISubService>('SubService', SubServiceSchema);
