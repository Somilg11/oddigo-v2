import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export enum KYCDocumentType {
    AADHAAR = 'AADHAAR',
    PAN = 'PAN',
    BANK_DETAILS = 'BANK_DETAILS',
    SKILL_TEST = 'SKILL_TEST',
    POLICE_VERIFICATION = 'POLICE_VERIFICATION'
}

export enum KYCStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED'
}

export interface IWorkerKYC extends Document {
    worker: IUser['_id'];
    documentType: KYCDocumentType;
    documentUrl: string;
    documentNumber?: string;
    status: KYCStatus;
    verifiedBy?: IUser['_id'];
    verifiedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WorkerKYCSchema: Schema = new Schema({
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: { type: String, enum: Object.values(KYCDocumentType), required: true },
    documentUrl: { type: String, required: true },
    documentNumber: { type: String },
    status: { type: String, enum: Object.values(KYCStatus), default: KYCStatus.SUBMITTED },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
}, {
    timestamps: true
});

WorkerKYCSchema.index({ worker: 1 });
WorkerKYCSchema.index({ worker: 1, documentType: 1 });
WorkerKYCSchema.index({ status: 1 });

export const WorkerKYC = mongoose.model<IWorkerKYC>('WorkerKYC', WorkerKYCSchema);
