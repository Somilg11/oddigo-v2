import { Request, Response, NextFunction } from 'express';
import * as orderService from './order.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await orderService.createOrder(req.user.id, req.body);
        res.status(201).json({
            status: 'success',
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, otp } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status, otp);
        res.status(200).json({
            status: 'success',
            data: { order },
        });
    } catch (error) {
        next(error);
    }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let orders;
        // Check if user is worker or user based on role or some property
        // Assuming req.user has role or we check collection
        if (req.user.role === 'user') {
            orders = await orderService.getUserOrders(req.user.id);
        } else {
            orders = await orderService.getWorkerOrders(req.user.id);
        }

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: { orders },
        });
    } catch (error) {
        next(error);
    }
};
