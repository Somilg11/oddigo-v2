import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IJob } from '../../jobs/models/Job';

export enum ComplaintCategory {
    WORKER_BEHAVIOR = 'WORKER_BEHAVIOR',
    QUALITY_ISSUE = 'QUALITY_ISSUE',
    PRICING_DISPUTE = 'PRICING_DISPUTE',
    NO_SHOW = 'NO_SHOW',
    DAMAGE = 'DAMAGE',
    FRAUD = 'FRAUD',
    OTHER = 'OTHER'
}

export enum ComplaintStatus {
    OPEN = 'OPEN',
    IN_REVIEW = 'IN_REVIEW',
    ESCALATED = 'ESCALATED',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED'
}

export enum ComplaintPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export interface IComplaint extends Document {
    customer: IUser['_id'];
    worker?: IUser['_id'];
    job?: IJob['_id'];
    category: ComplaintCategory;
    description: string;
    photos: string[];
    status: ComplaintStatus;
    priority: ComplaintPriority;
    resolution?: string;
    refundAmount?: number;
    resolvedAt?: Date;
    assignedTo?: IUser['_id'];
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User' },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    category: { type: String, enum: Object.values(ComplaintCategory), required: true },
    description: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.OPEN },
    priority: { type: String, enum: Object.values(ComplaintPriority), default: ComplaintPriority.MEDIUM },
    resolution: { type: String },
    refundAmount: { type: Number },
    resolvedAt: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

ComplaintSchema.index({ customer: 1 });
ComplaintSchema.index({ worker: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ category: 1 });

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
