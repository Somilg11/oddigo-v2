import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export interface IFieldVisit extends Document {
    fieldExecutive: IUser['_id'];
    worker: IUser['_id'];
    type: 'CHECK_IN' | 'FOLLOW_UP' | 'QUALITY_AUDIT' | 'COMPLAINT_HANDLE';
    notes: string;
    photos: string[];
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
    createdAt: Date;
}

const FieldVisitSchema: Schema = new Schema({
    fieldExecutive: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['CHECK_IN', 'FOLLOW_UP', 'QUALITY_AUDIT', 'COMPLAINT_HANDLE'], required: true },
    notes: { type: String, default: '' },
    photos: { type: [String], default: [] },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    }
}, {
    timestamps: true
});

FieldVisitSchema.index({ fieldExecutive: 1 });
FieldVisitSchema.index({ worker: 1 });
FieldVisitSchema.index({ createdAt: -1 });

export const FieldVisit = mongoose.model<IFieldVisit>('FieldVisit', FieldVisitSchema);
