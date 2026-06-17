import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';

export interface IZone extends Document {
    name: string;
    city: string;
    boundaries?: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    center: {
        type: 'Point';
        coordinates: [number, number];
    };
    radiusKm: number;
    manager?: IUser['_id'];
    fieldExecutives: IUser['_id'][];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ZoneSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    boundaries: {
        type: {
            type: String,
            enum: ['Polygon']
        },
        coordinates: [[[Number]]]
    },
    center: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    radiusKm: { type: Number, default: 5 },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    fieldExecutives: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

ZoneSchema.index({ city: 1 });
ZoneSchema.index({ center: '2dsphere' });
ZoneSchema.index({ manager: 1 });

export const Zone = mongoose.model<IZone>('Zone', ZoneSchema);
