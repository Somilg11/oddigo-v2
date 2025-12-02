import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IWorker extends Document {
    name: string;
    email: string;
    password?: string;
    phone: string;
    serviceType: string; // e.g., 'Plumber', 'Electrician'
    hourlyRate: number;
    isVerified: boolean;
    documents: string[]; // URLs to uploaded documents
    profileImage?: string;
    location: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    rating: number;
    numReviews: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const WorkerSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        phone: { type: String, required: true },
        serviceType: { type: String, required: true },
        hourlyRate: { type: Number, required: true },
        isVerified: { type: Boolean, default: false },
        documents: [{ type: String }],
        profileImage: { type: String },
        location: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
        isAvailable: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// @ts-ignore
WorkerSchema.pre('save', async function (next: (err?: mongoose.CallbackError) => void) {
    const worker = this as any;
    if (!worker.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    worker.password = await bcrypt.hash(worker.password, salt);
    next();
});

WorkerSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password!);
};

export default mongoose.model<IWorker>('Worker', WorkerSchema);
