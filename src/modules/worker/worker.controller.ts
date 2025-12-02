import { Request, Response, NextFunction } from 'express';
import * as workerService from './worker.service';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await workerService.getWorkerProfile(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await workerService.updateWorkerProfile(req.user.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};

export const uploadDocs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return next(new Error('Please upload at least one file'));
        }
        const worker = await workerService.uploadDocuments(
            req.user.id,
            req.files as Express.Multer.File[]
        );
        res.status(200).json({
            status: 'success',
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};

export const toggleAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const worker = await workerService.toggleAvailability(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { worker },
        });
    } catch (error) {
        next(error);
    }
};
