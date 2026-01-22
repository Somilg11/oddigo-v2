import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum CreditEligibility {
    ELIGIBLE = 'ELIGIBLE',
    NOT_ELIGIBLE = 'NOT_ELIGIBLE'
}

export interface IWorkerProfile extends Document {
    user: IUser['_id']; // Reference to User

    // Status
    isOnline: boolean;
    lastLocation?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };

    // Ranking Metrics
    wilsonScore: number; // 0 to 1
    reliabilityScore: number; // 0 to 1
    totalJobs: number;
    onTimeJobs: number;
    avgRating: number;

    // Skills / Categories
    skills: string[]; // e.g., ['plumber', 'cleaning']

    creditEligibility: CreditEligibility;

    createdAt: Date;
    updatedAt: Date;
}

const WorkerProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    isOnline: { type: Boolean, default: false },
    lastLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },

    wilsonScore: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    onTimeJobs: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },

    skills: { type: [String], default: [] },

    creditEligibility: { type: String, enum: Object.values(CreditEligibility), default: CreditEligibility.NOT_ELIGIBLE },
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
}, {
    timestamps: true
});

// Geospatial Index for location based search
WorkerProfileSchema.index({ lastLocation: '2dsphere' });
WorkerProfileSchema.index({ isOnline: 1, wilsonScore: -1 }); // Compound index for matching: online + highest rated

export const WorkerProfile = mongoose.model<IWorkerProfile>('WorkerProfile', WorkerProfileSchema);
