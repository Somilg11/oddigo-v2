import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    user: mongoose.Types.ObjectId;
    worker: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

// Prevent duplicate reviews for the same order
ReviewSchema.index({ order: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
