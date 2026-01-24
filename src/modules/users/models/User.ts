import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    WORKER = 'WORKER',
    ADMIN = 'ADMIN'
}

export enum CreditStatus {
    GREEN = 'GREEN',
    RED = 'RED'
}

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password?: string; // Hashed (optional if using OTP only, but likely needed)
    role: UserRole; // CUSTOMER, WORKER, ADMIN
    avatarUrl?: string;

    // Customer specific stats
    creditStatus?: CreditStatus;
    monthlyJobsCount?: number;
    isActive: boolean;
    addresses?: { street: string, city: string, zip: string, coordinates: number[] }[];

    // Worker specific references are in WorkerProfile, but we might link them here
    // OTP / Auth fields
    refreshToken?: string;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false }, // Store hashed password
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
    avatarUrl: { type: String },

    creditStatus: { type: String, enum: Object.values(CreditStatus), default: CreditStatus.GREEN },
    monthlyJobsCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    addresses: [{
        street: String,
        city: String,
        zip: String,
        coordinates: [Number] // [long, lat]
    }],

    refreshToken: { type: String },
}, {
    timestamps: true
});

// Indexes


export const User = mongoose.model<IUser>('User', UserSchema);
