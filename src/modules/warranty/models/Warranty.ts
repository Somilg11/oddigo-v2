import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../../jobs/models/Job';

export interface IWarranty extends Document {
    job: IJob['_id'];
    expiresAt: Date;
    isActive: boolean;

    coverageDetails: string; // Description of what matches coverage

    createdAt: Date;
    updatedAt: Date;
}

const WarrantySchema: Schema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    coverageDetails: { type: String, default: 'Standard 7-day service warranty' }
}, {
    timestamps: true
});

WarrantySchema.index({ job: 1 });
WarrantySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL Index to auto-remove? Or just filter? 
// Actually TTL removes the document. We might strictly want to keep record but mark active=false.
// Let's NOT use TTL index for deletion, just for querying.
// Removing expireAfterSeconds.

export const Warranty = mongoose.model<IWarranty>('Warranty', WarrantySchema);
