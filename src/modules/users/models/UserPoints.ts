import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IUserPoints extends Document {
    user: IUser['_id'];
    balance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserPointsSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    lifetimeEarned: { type: Number, default: 0, min: 0 },
    lifetimeRedeemed: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true
});

UserPointsSchema.index({ user: 1 }, { unique: true });

export const UserPoints = mongoose.model<IUserPoints>('UserPoints', UserPointsSchema);

export enum PointTransactionType {
    EARNED = 'EARNED',
    REDEEMED = 'REDEEMED',
    EXPIRED = 'EXPIRED',
    ADJUSTED = 'ADJUSTED'
}

export interface IPointTransaction extends Document {
    user: IUser['_id'];
    amount: number;
    type: PointTransactionType;
    reference: {
        model: string;
        id: mongoose.Types.ObjectId;
    };
    description: string;
    expiresAt?: Date;
    createdAt: Date;
}

const PointTransactionSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: Object.values(PointTransactionType), required: true },
    reference: {
        model: { type: String, required: true },
        id: { type: Schema.Types.ObjectId, required: true }
    },
    description: { type: String, required: true },
    expiresAt: { type: Date }
}, {
    timestamps: true
});

PointTransactionSchema.index({ user: 1 });
PointTransactionSchema.index({ user: 1, createdAt: -1 });
PointTransactionSchema.index({ expiresAt: 1 });

export const PointTransaction = mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);
