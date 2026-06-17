import { Request, Response, NextFunction } from 'express';
import { RatingService } from '../services/rating.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class RatingController {

    static async rateJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { rating, review } = req.body;
            const result = await RatingService.rateJob(req.params.id, req.user._id, rating, review);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getWorkerRatings(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page, limit } = req.query;
            const result = await RatingService.getWorkerRatings(
                req.params.id,
                parseInt(page as string) || 1,
                parseInt(limit as string) || 20
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
