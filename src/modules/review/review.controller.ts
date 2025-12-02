import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const review = await reviewService.createReview(req.user.id, req.body);
        res.status(201).json({
            status: 'success',
            data: { review },
        });
    } catch (error) {
        next(error);
    }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reviews = await reviewService.getWorkerReviews(req.params.workerId);
        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews },
        });
    } catch (error) {
        next(error);
    }
};
