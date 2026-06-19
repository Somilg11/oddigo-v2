import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IJob } from '../../jobs/models/Job';

export enum AuditStatus {
    PENDING = 'PENDING',
    PASSED = 'PASSED',
    FAILED = 'FAILED'
}

export interface IQualityAudit extends Document {
    job: IJob['_id'];
    fieldExecutive: IUser['_id'];
    worker: IUser['_id'];
    hasBeforePhotos: boolean;
    hasAfterPhotos: boolean;
    invoiceValid: boolean;
    status: AuditStatus;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const QualityAuditSchema: Schema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    fieldExecutive: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hasBeforePhotos: { type: Boolean, default: false },
    hasAfterPhotos: { type: Boolean, default: false },
    invoiceValid: { type: Boolean, default: true },
    status: { type: String, enum: Object.values(AuditStatus), default: AuditStatus.PENDING },
    notes: { type: String, default: '' }
}, {
    timestamps: true
});

QualityAuditSchema.index({ fieldExecutive: 1 });
QualityAuditSchema.index({ status: 1 });

export const QualityAudit = mongoose.model<IQualityAudit>('QualityAudit', QualityAuditSchema);
