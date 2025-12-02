import { Request, Response, NextFunction } from 'express';
import User from '../user/user.model';
import Worker from '../worker/worker.model';
import Order from '../order/order.model';
import { AppError } from '../../utils/AppError';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCount = await User.countDocuments();
        const workerCount = await Worker.countDocuments();
        const orderCount = await Order.countDocuments();
        const revenue = await Order.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$price' } } },
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                users: userCount,
                workers: workerCount,
                orders: orderCount,
                revenue: revenue.length > 0 ? revenue[0].total : 0,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users },
        });
    } catch (error) {
        next(error);
    }
};

export const getAllWorkers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workers = await Worker.find();
        res.status(200).json({
            status: 'success',
            results: workers.length,
            data: { workers },
        });
    } catch (error) {
        next(error);
    }
};

export const verifyWorker = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        );
        if (!worker) {
            return next(new AppError('Worker not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};
