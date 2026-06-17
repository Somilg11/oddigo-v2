import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export interface ICityManagerProfile extends Document {
    user: IUser['_id'];
    assignedCities: string[];
    createdAt: Date;
    updatedAt: Date;
}

const CityManagerProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assignedCities: { type: [String], default: [] }
}, {
    timestamps: true
});

export const CityManagerProfile = mongoose.model<ICityManagerProfile>('CityManagerProfile', CityManagerProfileSchema);
