import { Request, Response, NextFunction } from 'express';
import { WorkerService } from '../services/worker.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class WorkerController {

    static async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profile = await WorkerService.getProfile(req.user._id);
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }

    static async onboarding(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profile = await WorkerService.updateProfile(req.user._id, req.body);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    static async toggleAvailability(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { isOnline, location } = req.body; // location: { lat, long }
            const profile = await WorkerService.toggleAvailability(req.user._id, isOnline, location);
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }
    static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const stats = await WorkerService.getStats(req.user._id);
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}
