import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export interface IZoneManagerProfile extends Document {
    user: IUser['_id'];
    assignedZones: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const ZoneManagerProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assignedZones: [{ type: Schema.Types.ObjectId, ref: 'Zone' }]
}, {
    timestamps: true
});

export const ZoneManagerProfile = mongoose.model<IZoneManagerProfile>('ZoneManagerProfile', ZoneManagerProfileSchema);
