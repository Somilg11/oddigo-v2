import { Zone } from '../models/Zone';
import { ZoneManagerProfile } from '../models/ZoneManagerProfile';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { Job, JobStatus } from '../../jobs/models/Job';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class ZoneManagerService {

    static async getAssignedZones(managerId: string) {
        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('Zone manager profile not found', 404);

        const zones = await Zone.find({ _id: { $in: profile.assignedZones } })
            .populate('fieldExecutives', 'name email phone');

        return zones;
    }

    static async getZoneStats(managerId: string, zoneId: string) {
        const zone = await Zone.findById(zoneId);
        if (!zone) throw new AppError('Zone not found', 404);

        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile || !profile.assignedZones.includes(zoneId as any)) {
            throw new AppError('Zone not assigned to this manager', 403);
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [revenue, activeWorkers, pendingJobs, completedJobs] = await Promise.all([
            Job.aggregate([
                {
                    $match: {
                        status: JobStatus.COMPLETED,
                        completedAt: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$finalQuote' },
                        totalJobs: { $sum: 1 }
                    }
                }
            ]),
            WorkerProfile.countDocuments({ isOnline: true }),
            Job.countDocuments({ status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] } }),
            Job.countDocuments({
                status: JobStatus.COMPLETED,
                completedAt: { $gte: startOfMonth }
            })
        ]);

        return {
            zone: { name: zone.name, city: zone.city },
            metrics: {
                revenue: revenue[0]?.totalRevenue || 0,
                totalJobs: revenue[0]?.totalJobs || 0,
                activeWorkers,
                pendingJobs,
                completedJobs
            }
        };
    }

    static async getSupplyDemand(managerId: string, zoneId: string) {
        const zone = await Zone.findById(zoneId);
        if (!zone) throw new AppError('Zone not found', 404);

        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile || !profile.assignedZones.includes(zoneId as any)) {
            throw new AppError('Zone not assigned to this manager', 403);
        }

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const busyJobWorkerIds = (await Job.find({
            status: { $in: [JobStatus.IN_PROGRESS, JobStatus.ACCEPTED] }
        }).select('worker')).map(j => j.worker).filter((w): w is NonNullable<typeof w> => w != null);

        const [onlineWorkers, pendingRequests, busyWorkers] = await Promise.all([
            WorkerProfile.countDocuments({ isOnline: true }),
            Job.countDocuments({
                status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] },
                createdAt: { $gte: last24h }
            }),
            busyJobWorkerIds.length > 0
                ? WorkerProfile.countDocuments({
                    isOnline: true,
                    user: { $in: busyJobWorkerIds }
                })
                : 0
        ]);

        const availableWorkers = onlineWorkers - busyWorkers;

        return {
            zone: { name: zone.name },
            supply: {
                online: onlineWorkers,
                busy: busyWorkers,
                available: Math.max(0, availableWorkers)
            },
            demand: {
                pendingRequests,
                last24h
            },
            ratio: availableWorkers > 0
                ? Math.round(pendingRequests / availableWorkers * 100) / 100
                : pendingRequests > 0 ? Infinity : 0,
            needsRecruitment: pendingRequests > availableWorkers * 2
        };
    }

    static async triggerRecruitment(managerId: string, zoneId: string, data: {
        skillNeeded: string;
        countNeeded: number;
        reason?: string;
    }) {
        const zone = await Zone.findById(zoneId);
        if (!zone) throw new AppError('Zone not found', 404);

        Logger.info(`Recruitment triggered for zone ${zoneId}: ${data.countNeeded} ${data.skillNeeded} workers. Reason: ${data.reason || 'High demand'}`);

        return {
            message: `Recruitment request submitted for ${data.countNeeded} ${data.skillNeeded} workers in ${zone.name}`,
            zone: zone.name,
            ...data
        };
    }
}
