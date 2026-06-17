import mongoose from 'mongoose';
import { Logger } from './logger';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    Logger.error('MONGO_URI environment variable is required');
    process.exit(1);
}

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI!);
        Logger.info('MongoDB connected successfully');
    } catch (error: any) {
        Logger.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    await mongoose.disconnect();
    Logger.info('MongoDB disconnected');
};
