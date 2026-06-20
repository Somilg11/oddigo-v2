import mongoose from 'mongoose';
import { Rating, IRating } from '../models/Rating';
import { Job, JobStatus } from '../../jobs/models/Job';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { RankingService } from '../../workers/services/ranking.service';
import { PointsService } from '../../users/services/points.service';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class RatingService {

    static async rateJob(jobId: string, customerId: string, rating: number, review?: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.customer.toString() !== customerId) {
            throw new AppError('Not authorized', 403);
        }

        if (job.status !== JobStatus.COMPLETED) {
            throw new AppError('Can only rate completed jobs', 400);
        }

        const existing = await Rating.findOne({ job: jobId });
        if (existing) {
            throw new AppError('Job has already been rated', 409);
        }

        if (!job.worker) {
            throw new AppError('No worker assigned to this job', 400);
        }

        const newRating = await Rating.create({
            job: jobId,
            customer: customerId,
            worker: job.worker,
            rating,
            review
        });

        await this.updateWorkerRating(job.worker.toString());

        // Award 5-star rating bonus points
        if (rating === 5) {
            try {
                await PointsService.awardRatingPoints(customerId, jobId);
            } catch (err) {
                Logger.error(`Failed to award rating points for job ${jobId}: ${err}`);
            }
        }

        Logger.info(`Job ${jobId} rated ${rating}/5 by customer ${customerId}`);
        return newRating;
    }

    static async getWorkerRatings(workerId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [ratings, total] = await Promise.all([
            Rating.find({ worker: workerId })
                .populate('customer', 'name avatarUrl')
                .populate('job', 'serviceType completedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Rating.countDocuments({ worker: workerId })
        ]);

        const avgResult = await Rating.aggregate([
            { $match: { worker: new mongoose.Types.ObjectId(workerId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
        ]);

        return {
            ratings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            summary: {
                averageRating: avgResult[0]?.avgRating || 0,
                totalRatings: avgResult[0]?.totalRatings || 0
            }
        };
    }

    private static async updateWorkerRating(workerId: string) {
        const stats = await Rating.aggregate([
            { $match: { worker: new mongoose.Types.ObjectId(workerId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 },
                    positiveRatings: {
                        $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
                    }
                }
            }
        ]);

        if (stats.length > 0) {
            const { avgRating, totalRatings, positiveRatings } = stats[0];
            const wilsonScore = RankingService.calculateWilsonScore(positiveRatings, totalRatings);

            await WorkerProfile.findOneAndUpdate(
                { user: workerId },
                {
                    avgRating: Math.round(avgRating * 100) / 100,
                    wilsonScore
                }
            );

            Logger.info(`Worker ${workerId} rating updated: avg=${avgRating}, wilson=${wilsonScore}`);
        }
    }
}
