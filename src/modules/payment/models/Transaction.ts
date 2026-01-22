import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IJob } from '../../jobs/models/Job';

export enum TransactionType {
    AUTHORIZATION = 'AUTHORIZATION', // Hold funds
    CAPTURE = 'CAPTURE', // Complete payment
    REFUND = 'REFUND',
    PAYOUT = 'PAYOUT' // To Worker
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}

export interface ITransaction extends Document {
    job: IJob['_id'];
    user: IUser['_id']; // Payer or Payee
    recipient?: IUser['_id']; // If payout

    amount: number;
    currency: string;

    type: TransactionType;
    status: TransactionStatus;

    providerTransactionId?: string; // Stripe PaymentIntent ID
    metadata?: any;

    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },

    type: { type: String, enum: Object.values(TransactionType), required: true },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PENDING },

    providerTransactionId: { type: String },
    metadata: { type: Map, of: String }
}, {
    timestamps: true
});

TransactionSchema.index({ job: 1 });
TransactionSchema.index({ providerTransactionId: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
