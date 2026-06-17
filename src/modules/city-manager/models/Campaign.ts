import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED'
}

export interface ICampaign extends Document {
    name: string;
    description: string;
    city: string;
    discountPercent?: number;
    discountCode?: string;
    startDate: Date;
    endDate: Date;
    status: CampaignStatus;
    createdBy: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    city: { type: String, required: true, trim: true },
    discountPercent: { type: Number, min: 0, max: 100 },
    discountCode: { type: String, unique: true, sparse: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.DRAFT },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

CampaignSchema.index({ city: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ startDate: 1, endDate: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
