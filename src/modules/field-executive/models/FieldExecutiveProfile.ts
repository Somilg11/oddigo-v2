import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IZone } from '../../zones/models/Zone';

export interface IFieldExecutiveProfile extends Document {
    user: IUser['_id'];
    assignedZone: IZone['_id'];
    managedWorkers: IUser['_id'][];
    createdAt: Date;
    updatedAt: Date;
}

const FieldExecutiveProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assignedZone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
    managedWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

FieldExecutiveProfileSchema.index({ assignedZone: 1 });

export const FieldExecutiveProfile = mongoose.model<IFieldExecutiveProfile>('FieldExecutiveProfile', FieldExecutiveProfileSchema);
