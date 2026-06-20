import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum JobStatus {
    CREATED = 'CREATED',
    MATCHING = 'MATCHING',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    PAUSED_APPROVAL_PENDING = 'PAUSED_APPROVAL_PENDING',
    OTP_PENDING = 'OTP_PENDING',
    ON_SITE_DIAGNOSIS = 'ON_SITE_DIAGNOSIS',
    FINAL_APPROVAL_PENDING = 'FINAL_APPROVAL_PENDING',
    REPAIR_IN_PROGRESS = 'REPAIR_IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED_CHARGED = 'CANCELLED_CHARGED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    UPI = 'UPI',
    CARD = 'CARD',
    CASH = 'CASH',
    WALLET = 'WALLET'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export interface IJob extends Document {
    customer: IUser['_id'];
    worker?: IUser['_id'];

    serviceType: string;
    subService?: mongoose.Types.ObjectId;
    subServiceName?: string;

    location: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
    };

    status: JobStatus;

    // Media
    photos: string[];
    videos: string[];
    voiceNote?: string;
    customIssue?: string;

    // AI Pre-Screening
    aiAnalysis?: {
        problemType: string;
        possibleCauses: string[];
        estimatedCostRange: { low: number; high: number };
        confidence: number;
        reasoning: string;
    };

    // Financials
    initialQuote: number;
    finalQuote?: number;
    visitFee: number;

    // Estimate (worker submits)
    estimate?: {
        visitCharge: number;
        labourCost: number;
        partsCost: number;
        totalEstimate: number;
        notes?: string;
        createdAt: Date;
    };

    // Scope Creep / Amendment
    amendment?: {
        reason: string;
        evidenceUrl: string;
        proposedAmount: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        createdAt: Date;
    };

    // OTP Verification
    jobOtp?: string;
    otpVerifiedAt?: Date;

    // Digital Signature
    customerSignature?: string;
    completedAt?: Date;

    // Photos
    beforePhotos: string[];
    afterPhotos: string[];
    invoiceUrl?: string;
    completionProofUrl?: string;

    // Payment
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    transactionId?: string;

    // Coupon
    couponCode?: string;
    discount?: number;

    // Warranty
    warrantyId?: mongoose.Types.ObjectId;

    // Timestamps
    scheduledAt: Date;
    startedAt?: Date;
    workerArrivedAt?: Date;
    diagnosisCompletedAt?: Date;
    repairStartedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const JobSchema: Schema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User' },

    serviceType: { type: String, required: true },
    subService: { type: Schema.Types.ObjectId, ref: 'SubService' },
    subServiceName: { type: String },

    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
        address: { type: String }
    },

    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.CREATED },

    // Media
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    voiceNote: { type: String },
    customIssue: { type: String },

    // AI Analysis
    aiAnalysis: {
        problemType: String,
        possibleCauses: [String],
        estimatedCostRange: {
            low: Number,
            high: Number
        },
        confidence: Number,
        reasoning: String
    },

    // Financials
    initialQuote: { type: Number, required: true },
    finalQuote: { type: Number },
    visitFee: { type: Number, default: 99 },

    // Worker Estimate
    estimate: {
        visitCharge: Number,
        labourCost: Number,
        partsCost: Number,
        totalEstimate: Number,
        notes: String,
        createdAt: { type: Date, default: Date.now }
    },

    // Amendment
    amendment: {
        reason: String,
        evidenceUrl: String,
        proposedAmount: Number,
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        createdAt: Date
    },

    // OTP
    jobOtp: { type: String, select: false },
    otpVerifiedAt: Date,

    // Signature
    customerSignature: String,

    // Photos
    beforePhotos: { type: [String], default: [] },
    afterPhotos: { type: [String], default: [] },
    invoiceUrl: String,
    completionProofUrl: String,

    // Payment
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    transactionId: String,

    // Coupon
    couponCode: { type: String },
    discount: { type: Number, default: 0 },

    // Warranty
    warrantyId: { type: Schema.Types.ObjectId, ref: 'Warranty' },

    // Timestamps
    scheduledAt: { type: Date, default: Date.now },
    startedAt: Date,
    workerArrivedAt: Date,
    diagnosisCompletedAt: Date,
    repairStartedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

JobSchema.index({ customer: 1 });
JobSchema.index({ worker: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ location: '2dsphere' });
JobSchema.index({ subService: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
