import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IWorkerProfile } from '../../workers/models/WorkerProfile';

export enum JobStatus {
    CREATED = 'CREATED',
    MATCHING = 'MATCHING',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    PAUSED_APPROVAL_PENDING = 'PAUSED_APPROVAL_PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED_CHARGED = 'CANCELLED_CHARGED',
    CANCELLED = 'CANCELLED'
}

export interface IJob extends Document {
    customer: IUser['_id'];
    worker?: IUser['_id'];

    serviceType: string; // e.g., 'cleaning', 'plumbing'
    location: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
    };

    status: JobStatus;

    // Financials
    initialQuote: number;
    finalQuote?: number;
    visitFee: number;

    // Scope Creep / Amendment
    amendment?: {
        reason: string;
        evidenceUrl: string; // Photo URL
        proposedAmount: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        createdAt: Date;
    };

    // Timestamps
    scheduledAt: Date;
    startedAt?: Date;
    completedAt?: Date;

    // Verification
    completionProofUrl?: string; // After photo

    createdAt: Date;
    updatedAt: Date;
}

const JobSchema: Schema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User' },

    serviceType: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
        address: { type: String }
    },

    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.CREATED },

    initialQuote: { type: Number, required: true },
    finalQuote: { type: Number },
    visitFee: { type: Number, default: 99 },

    amendment: {
        reason: String,
        evidenceUrl: String,
        proposedAmount: Number,
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        createdAt: Date
    },

    scheduledAt: { type: Date, default: Date.now },
    startedAt: Date,
    completedAt: Date,

    completionProofUrl: String,
}, {
    timestamps: true
});

// Indexes
JobSchema.index({ customer: 1 });
JobSchema.index({ worker: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ location: '2dsphere' });

export const Job = mongoose.model<IJob>('Job', JobSchema);
