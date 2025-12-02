import jwt from 'jsonwebtoken';
import User, { IUser } from '../user/user.model';
import Worker, { IWorker } from '../worker/worker.model';
import Admin, { IAdmin } from '../admin/admin.model';
import { AppError } from '../../utils/AppError';

const signToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN as any,
    });
};

export const registerUser = async (userData: Partial<IUser>) => {
    const user = await User.create(userData);
    const token = signToken(user._id.toString(), 'user');
    return { user, token };
};

export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }
    const token = signToken(user._id.toString(), 'user');
    return { user, token };
};

export const registerWorker = async (workerData: Partial<IWorker>) => {
    const worker = await Worker.create(workerData);
    // Workers might need approval, so maybe don't return token immediately or return with restricted access?
    // For now, let's return token but they might be 'unverified'.
    const token = signToken(worker._id.toString(), 'worker');
    return { worker, token };
};

export const loginWorker = async (email: string, password: string) => {
    const worker = await Worker.findOne({ email }).select('+password');
    if (!worker || !(await worker.matchPassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }
    const token = signToken(worker._id.toString(), 'worker');
    return { worker, token };
};

export const loginAdmin = async (email: string, password: string) => {
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }
    const token = signToken(admin._id.toString(), admin.role);
    return { admin, token };
};
