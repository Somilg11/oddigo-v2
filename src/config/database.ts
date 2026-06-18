import mongoose from 'mongoose';
import { Logger } from './logger';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    Logger.error('MONGO_URI environment variable is required');
    process.exit(1);
}

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI!, {
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000
        });
        Logger.info('MongoDB connected successfully');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`MongoDB connection error: ${message}`);
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        Logger.error(`MongoDB runtime error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        Logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
        Logger.info('MongoDB reconnected');
    });
};

export const disconnectDB = async () => {
    await mongoose.disconnect();
    Logger.info('MongoDB disconnected');
};
