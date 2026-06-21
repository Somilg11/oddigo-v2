import { Zone } from '../models/Zone';
import { ZoneManagerProfile } from '../models/ZoneManagerProfile';
import { Task, TaskType, TaskStatus } from '../models/Task';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { Job, JobStatus } from '../../jobs/models/Job';
import { Complaint } from '../../admin/models/Complaint';
import { User } from '../../users/models/User';
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

        const radiusRad = (zone.radiusKm || 5) / 6371;
        const zoneFilter = {
            location: {
                $geoWithin: {
                    $centerSphere: [zone.center.coordinates, radiusRad]
                }
            }
        };

        const cityFilter = { city: zone.city };

        const [revenue, activeWorkers, pendingJobs, completedJobs] = await Promise.all([
            Job.aggregate([
                {
                    $match: {
                        ...zoneFilter,
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
            Job.countDocuments({
                ...zoneFilter,
                status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] }
            }),
            Job.countDocuments({
                ...zoneFilter,
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

        const radiusRad = (zone.radiusKm || 5) / 6371;
        const zoneFilter = {
            location: {
                $geoWithin: {
                    $centerSphere: [zone.center.coordinates, radiusRad]
                }
            }
        };

        const busyJobWorkerIds = (await Job.find({
            ...zoneFilter,
            status: { $in: [JobStatus.IN_PROGRESS, JobStatus.ACCEPTED] }
        }).select('worker')).map(j => j.worker).filter((w): w is NonNullable<typeof w> => w != null);

        const [onlineWorkers, pendingRequests, busyWorkers] = await Promise.all([
            WorkerProfile.countDocuments({ isOnline: true }),
            Job.countDocuments({
                ...zoneFilter,
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

        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile || !profile.assignedZones.includes(zoneId as any)) {
            throw new AppError('Zone not assigned to this manager', 403);
        }

        Logger.info(`Recruitment triggered for zone ${zoneId}: ${data.countNeeded} ${data.skillNeeded} workers. Reason: ${data.reason || 'High demand'}`);

        return {
            message: `Recruitment request submitted for ${data.countNeeded} ${data.skillNeeded} workers in ${zone.name}`,
            zone: zone.name,
            zoneId,
            requestedBy: managerId,
            ...data,
            createdAt: new Date()
        };
    }

    static async getOverview(managerId: string) {
        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('Zone manager profile not found', 404);

        const zones = await Zone.find({ _id: { $in: profile.assignedZones } })
            .populate('fieldExecutives', 'name email phone');

        const zoneIds = zones.map(z => z._id);

        // Get field executives
        const fieldExecIds = zones.flatMap(z => (z.fieldExecutives || []).map(fe => fe._id || fe));
        const fieldExecUsers = fieldExecIds.length > 0
            ? await User.find({ _id: { $in: fieldExecIds } }).select('name email phone isActive')
            : [];

        // Complaints in this zone
        const workerUserIds = fieldExecIds;
        const complaints = workerUserIds.length > 0
            ? await Complaint.find({ worker: { $in: workerUserIds } })
                .populate('customer', 'name phone')
                .populate('worker', 'name phone')
                .populate('job', 'serviceType subServiceName status')
                .sort({ createdAt: -1 })
                .limit(20)
            : [];

        // Disputes
        const disputes = workerUserIds.length > 0
            ? await Job.find({
                worker: { $in: workerUserIds },
                status: { $in: [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED] }
            })
                .populate('customer', 'name phone')
                .populate('worker', 'name phone')
                .sort({ createdAt: -1 })
                .limit(20)
            : [];

        // Tasks assigned by this manager
        const tasks = await Task.find({ assignedBy: managerId })
            .populate('assignedTo', 'name email phone')
            .populate('zone', 'name city')
            .sort({ createdAt: -1 })
            .limit(30);

        return {
            zones,
            fieldExecutives: fieldExecUsers,
            complaints,
            disputes,
            tasks,
        };
    }

    static async getFieldExecutives(managerId: string) {
        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('Zone manager profile not found', 404);

        const zones = await Zone.find({ _id: { $in: profile.assignedZones } })
            .populate('fieldExecutives', 'name email phone');

        const fieldExecIds = zones.flatMap(z => (z.fieldExecutives || []).map(fe => fe._id || fe));
        if (fieldExecIds.length === 0) return [];

        return User.find({ _id: { $in: fieldExecIds } }).select('name email phone isActive');
    }

    static async assignTask(managerId: string, data: {
        title: string;
        description: string;
        type?: TaskType;
        priority?: string;
        assignedTo: string;
        zoneId: string;
        jobId?: string;
        complaintId?: string;
        location?: string;
    }) {
        const profile = await ZoneManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('Zone manager profile not found', 404);

        const zone = await Zone.findById(data.zoneId);
        if (!zone) throw new AppError('Zone not found', 404);

        const task = await Task.create({
            title: data.title,
            description: data.description,
            type: data.type || TaskType.GENERAL,
            priority: data.priority || 'MEDIUM',
            assignedBy: managerId,
            assignedTo: data.assignedTo,
            zone: data.zoneId,
            job: data.jobId,
            complaint: data.complaintId,
            location: data.location,
        });

        Logger.info(`Task assigned: ${task.title} to ${data.assignedTo} by ${managerId}`);
        return task;
    }

    static async getTaskDetails(managerId: string, taskId: string) {
        const task = await Task.findById(taskId)
            .populate('assignedTo', 'name email phone')
            .populate('assignedBy', 'name email')
            .populate('zone', 'name city')
            .populate('job', 'serviceType subServiceName status location');
        if (!task) throw new AppError('Task not found', 404);
        return task;
    }
}
