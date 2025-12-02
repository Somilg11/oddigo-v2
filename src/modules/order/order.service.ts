import Order, { IOrder } from './order.model';
import { AppError } from '../../utils/AppError';
import Worker from '../worker/worker.model';

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const createOrder = async (userId: string, orderData: Partial<IOrder>) => {
    const worker = await Worker.findById(orderData.worker);
    if (!worker) {
        throw new AppError('Worker not found', 404);
    }

    const order = await Order.create({
        ...orderData,
        user: userId,
        otp: {
            start: generateOTP(),
            end: generateOTP(),
        },
    });

    return order;
};

export const getOrderById = async (orderId: string) => {
    const order = await Order.findById(orderId).populate('user').populate('worker');
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    return order;
};

export const updateOrderStatus = async (orderId: string, status: string, otp?: string) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (status === 'IN_PROGRESS') {
        if (order.otp.start !== otp) {
            throw new AppError('Invalid Start OTP', 400);
        }
        order.startTime = new Date();
    } else if (status === 'COMPLETED') {
        if (order.otp.end !== otp) {
            throw new AppError('Invalid End OTP', 400);
        }
        order.endTime = new Date();
    }

    order.status = status as any;
    await order.save();
    return order;
};

export const getUserOrders = async (userId: string) => {
    return await Order.find({ user: userId }).sort('-createdAt');
};

export const getWorkerOrders = async (workerId: string) => {
    return await Order.find({ worker: workerId }).sort('-createdAt');
};
