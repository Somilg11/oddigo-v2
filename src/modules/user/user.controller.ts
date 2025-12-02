import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserProfile(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.updateUserProfile(req.user.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const searchWorkers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lat, lng, serviceType, distance } = req.query;
        let coordinates: [number, number] | undefined;

        if (lat && lng) {
            coordinates = [parseFloat(lng as string), parseFloat(lat as string)];
        }

        const workers = await userService.searchWorkers(
            { serviceType },
            coordinates,
            distance ? parseInt(distance as string) : undefined
        );

        res.status(200).json({
            status: 'success',
            results: workers.length,
            data: { workers },
        });
    } catch (error) {
        next(error);
    }
};
