import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../../jobs/models/Job';
import { IUser } from '../../users/models/User';

export enum WarrantyClaimStatus {
    PENDING = 'PENDING',
    IN_REVIEW = 'IN_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    RESOLVED = 'RESOLVED'
}

export interface IWarrantyClaim extends Document {
    warranty: mongoose.Types.ObjectId;
    job: IJob['_id'];
    customer: IUser['_id'];
    worker?: IUser['_id'];
    description: string;
    photos: string[];
    status: WarrantyClaimStatus;
    adminNotes?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WarrantyClaimSchema: Schema = new Schema({
    warranty: { type: Schema.Types.ObjectId, ref: 'Warranty', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    status: { type: String, enum: Object.values(WarrantyClaimStatus), default: WarrantyClaimStatus.PENDING },
    adminNotes: { type: String },
    resolvedAt: { type: Date }
}, {
    timestamps: true
});

WarrantyClaimSchema.index({ warranty: 1 });
WarrantyClaimSchema.index({ job: 1 });
WarrantyClaimSchema.index({ customer: 1 });
WarrantyClaimSchema.index({ status: 1 });

export const WarrantyClaim = mongoose.model<IWarrantyClaim>('WarrantyClaim', WarrantyClaimSchema);
