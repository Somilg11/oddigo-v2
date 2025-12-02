import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    worker: mongoose.Types.ObjectId;
    serviceType: string;
    status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    price: number;
    description?: string;
    otp: {
        start: string;
        end: string;
    };
    startTime?: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
        serviceType: { type: String, required: true },
        status: {
            type: String,
            enum: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            default: 'REQUESTED',
        },
        price: { type: Number, required: true },
        description: { type: String },
        otp: {
            start: { type: String },
            end: { type: String },
        },
        startTime: { type: Date },
        endTime: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
