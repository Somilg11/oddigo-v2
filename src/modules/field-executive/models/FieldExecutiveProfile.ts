import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export interface IFieldExecutiveProfile extends Document {
    user: IUser['_id'];
    assignedZone: string;
    managedWorkers: IUser['_id'][];
    createdAt: Date;
    updatedAt: Date;
}

const FieldExecutiveProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assignedZone: { type: String, required: true },
    managedWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

FieldExecutiveProfileSchema.index({ assignedZone: 1 });

export const FieldExecutiveProfile = mongoose.model<IFieldExecutiveProfile>('FieldExecutiveProfile', FieldExecutiveProfileSchema);
