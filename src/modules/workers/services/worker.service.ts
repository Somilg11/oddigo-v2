import { WorkerProfile } from '../models/WorkerProfile';
import redis from '../../../config/redis';
import { AppError } from '../../../core/errors/AppError';

export class WorkerService {

    static async getProfile(userId: string) {
        const profile = await WorkerProfile.findOne({ user: userId });
        if (!profile) {
            throw new AppError('Worker profile not found. Are you registered as a worker?', 404);
        }
        return profile;
    }

    static async updateProfile(userId: string, data: any) {
        // Find and update, or create if not exists (upsert for onboarding)
        const profile = await WorkerProfile.findOneAndUpdate(
            { user: userId },
            { $set: data },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return profile;
    }

    static async toggleAvailability(userId: string, isOnline: boolean, location?: { lat: number, long: number }) {
        const profile = await WorkerProfile.findOne({ user: userId });
        if (!profile) {
            throw new AppError('Worker profile not found', 404);
        }

        profile.isOnline = isOnline;

        if (isOnline && (profile as any).verificationStatus !== 'VERIFIED') {
            throw new AppError('Worker is not verified by Admin yet', 403);
        }

        if (location) {
            profile.lastLocation = {
                type: 'Point',
                coordinates: [location.long, location.lat]
            };

            // Update Redis Geo
            if (isOnline) {
                await redis.geoadd('workers:locations', location.long, location.lat, userId);
            }
        }

        if (!isOnline) {
            await redis.zrem('workers:locations', userId);
        }

        await profile.save();
        return profile;
    }
    static async getStats(userId: string) {
        // Need to import Job model to aggregate earnings
        const Job = require('../../jobs/models/Job').Job;
        const { JobStatus } = require('../../jobs/models/Job');

        const profile = await this.getProfile(userId);

        const stats = await Job.aggregate([
            { $match: { worker: profile.user, status: JobStatus.COMPLETED } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$finalQuote" },
                    completedJobs: { $count: {} }
                }
            }
        ]);

        const totalEarnings = stats.length > 0 ? stats[0].totalEarnings : 0;
        const totalCompleted = stats.length > 0 ? stats[0].completedJobs : 0;

        return {
            ...profile.toObject(),
            totalEarnings,
            totalCompleted
        };
    }
}
