import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user, token } = await authService.registerUser(req.body);
        res.status(201).json({
            status: 'success',
            token,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);
        res.status(200).json({
            status: 'success',
            token,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const registerWorker = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { worker, token } = await authService.registerWorker(req.body);
        res.status(201).json({
            status: 'success',
            token,
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};

export const loginWorker = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const { worker, token } = await authService.loginWorker(email, password);
        res.status(200).json({
            status: 'success',
            token,
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const { admin, token } = await authService.loginAdmin(email, password);
        res.status(200).json({
            status: 'success',
            token,
            data: { admin },
        });
    } catch (error) {
        next(error);
    }
};
