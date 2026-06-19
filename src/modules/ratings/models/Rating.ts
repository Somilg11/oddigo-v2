import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IJob } from '../../jobs/models/Job';

export interface IRating extends Document {
    job: IJob['_id'];
    customer: IUser['_id'];
    worker: IUser['_id'];
    rating: number; // 1-5
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RatingSchema: Schema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 500 }
}, {
    timestamps: true
});

RatingSchema.index({ worker: 1 });
RatingSchema.index({ customer: 1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
