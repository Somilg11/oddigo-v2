import mongoose, { Schema, Document, Types } from 'mongoose';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    WORKER = 'WORKER',
    ADMIN = 'ADMIN',
    FIELD_EXECUTIVE = 'FIELD_EXECUTIVE',
    ZONE_MANAGER = 'ZONE_MANAGER',
    CITY_MANAGER = 'CITY_MANAGER'
}

export enum CreditStatus {
    GREEN = 'GREEN',
    RED = 'RED'
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER'
}

export interface IUserAddress {
    label: 'HOME' | 'WORK' | 'OTHER';
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    coordinates?: number[];
    isDefault?: boolean;
}

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: UserRole;
    avatarUrl?: string;
    gender?: Gender;
    dateOfBirth?: Date;
    creditStatus?: CreditStatus;
    monthlyJobsCount?: number;
    isActive: boolean;
    addresses?: IUserAddress[];
    refreshToken?: string;
    referralCode?: string;
    referredBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserAddressSchema = new Schema<IUserAddress>({
    label: { type: String, enum: ['HOME', 'WORK', 'OTHER'], default: 'HOME' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    coordinates: [Number],
    isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
    avatarUrl: { type: String },
    gender: { type: String, enum: Object.values(Gender) },
    dateOfBirth: { type: Date },

    creditStatus: { type: String, enum: Object.values(CreditStatus), default: CreditStatus.GREEN },
    monthlyJobsCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    addresses: [UserAddressSchema],

    refreshToken: { type: String },

    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
