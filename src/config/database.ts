import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:password123@localhost:27017/oddigo?authSource=admin';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
};
