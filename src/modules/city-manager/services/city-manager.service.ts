import { CityManagerProfile } from '../models/CityManagerProfile';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { Zone } from '../../zones/models/Zone';
import { Job, JobStatus } from '../../jobs/models/Job';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { User } from '../../users/models/User';
import { ServiceCategory } from '../../services/models/ServiceCategory';
import { Complaint, ComplaintStatus } from '../../admin/models/Complaint';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class CityManagerService {

    static async getDashboard(managerId: string) {
        const profile = await CityManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('City manager profile not found', 404);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const cityFilter = { city: { $in: profile.assignedCities } };

        const [
            totalOrders,
            monthlyRevenue,
            activeWorkers,
            pendingJobs,
            completedToday,
            cancelledToday,
            avgRatingResult
        ] = await Promise.all([
            Job.countDocuments(cityFilter),
            Job.aggregate([
                { $match: { ...cityFilter, status: JobStatus.COMPLETED, completedAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$finalQuote' } } }
            ]),
            WorkerProfile.countDocuments({ isOnline: true }),
            Job.countDocuments({ ...cityFilter, status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] } }),
            Job.countDocuments({ ...cityFilter, status: JobStatus.COMPLETED, completedAt: { $gte: startOfDay } }),
            Job.countDocuments({ ...cityFilter, status: { $in: [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED] }, createdAt: { $gte: startOfDay } }),
            WorkerProfile.aggregate([
                { $match: { avgRating: { $gt: 0 } } },
                { $group: { _id: null, avg: { $avg: '$avgRating' } } }
            ])
        ]);

        const totalToday = completedToday + cancelledToday;
        const cancellationRate = totalToday > 0 ? Math.round((cancelledToday / totalToday) * 100) : 0;

        return {
            metrics: {
                totalOrders,
                monthlyRevenue: monthlyRevenue[0]?.total || 0,
                activeWorkers,
                pendingJobs,
                completedToday,
                cancelledToday,
                cancellationRate: `${cancellationRate}%`,
                averageRating: avgRatingResult[0]?.avg
                    ? Math.round(avgRatingResult[0].avg * 100) / 100
                    : 0
            }
        };
    }

    static async getZones(managerId: string) {
        const profile = await CityManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('City manager profile not found', 404);

        const zones = await Zone.find({
            city: { $in: profile.assignedCities }
        }).populate('manager', 'name email')
          .populate('fieldExecutives', 'name email');

        return zones;
    }

    static async getCampaigns(managerId: string) {
        const profile = await CityManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('City manager profile not found', 404);

        const campaigns = await Campaign.find({
            city: { $in: profile.assignedCities }
        }).sort({ createdAt: -1 });

        return campaigns;
    }

    static async createZone(managerId: string, data: {
        name: string;
        city: string;
        center: { lat: number; long: number };
        radiusKm?: number;
    }) {
        const zoneName = data.name.startsWith(`${data.city} -`) || data.name.startsWith(`${data.city}-`)
            ? data.name
            : `${data.city} - ${data.name}`;

        const zone = await Zone.create({
            name: zoneName,
            city: data.city,
            center: {
                type: 'Point',
                coordinates: [data.center.long, data.center.lat]
            },
            radiusKm: data.radiusKm || 5,
            manager: managerId
        });

        Logger.info(`Zone created: ${zone.name} in ${zone.city} by ${managerId}`);
        return zone;
    }

    static async addCategory(data: {
        name: string;
        slug: string;
        icon?: string;
        description?: string;
    }) {
        const existing = await ServiceCategory.findOne({
            $or: [{ name: data.name }, { slug: data.slug }]
        });

        if (existing) {
            throw new AppError('Category with this name or slug already exists', 409);
        }

        const category = await ServiceCategory.create(data);
        Logger.info(`Service category created: ${category.name}`);
        return category;
    }

    static async createCampaign(managerId: string, data: {
        name: string;
        description?: string;
        city: string;
        discountPercent?: number;
        discountCode?: string;
        startDate: Date;
        endDate: Date;
    }) {
        if (new Date(data.startDate) >= new Date(data.endDate)) {
            throw new AppError('End date must be after start date', 400);
        }

        const campaign = await Campaign.create({
            ...data,
            createdBy: managerId,
            status: CampaignStatus.DRAFT
        });

        Logger.info(`Campaign created: ${campaign.name} for ${campaign.city}`);
        return campaign;
    }

    static async getOverview(managerId: string) {
        const profile = await CityManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('City manager profile not found', 404);

        const cities = profile.assignedCities;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 1. Zones with managers and field executives
        const zones = await Zone.find({ city: { $in: cities } })
            .populate('manager', 'name email phone')
            .populate('fieldExecutives', 'name email phone');

        // Collect all worker user IDs from zones
        const zoneManagerIds = zones.filter(z => z.manager).map(z => z.manager!._id || z.manager!);
        const fieldExecIds = zones.flatMap(z => (z.fieldExecutives || []).map(fe => fe._id || fe));
        const allWorkerUserIds = [...new Set([...zoneManagerIds, ...fieldExecIds])];

        // Find worker profiles for these users to get their actual worker IDs
        const workerProfiles = allWorkerUserIds.length > 0
            ? await WorkerProfile.find({ user: { $in: allWorkerUserIds } }).select('_id user')
            : [];
        const workerProfileIds = workerProfiles.map(wp => wp._id);

        // Also find workers by zone's manager/fieldExecutives if they are WORKER role
        // But these are executives, so let's also find any workers whose profiles exist in these zones
        // For now, query jobs where the worker is in any of our tracked workers
        const jobFilter = workerProfileIds.length > 0 ? { worker: { $in: workerProfileIds } } : { _id: null };

        // 2. Per-zone daily stats
        const zoneIds = zones.map(z => z._id);
        const zoneJobs = await Job.aggregate([
            { $match: jobFilter },
            {
                $group: {
                    _id: '$worker',
                    totalJobs: { $sum: 1 },
                    completedJobs: { $sum: { $cond: [{ $eq: ['$status', JobStatus.COMPLETED] }, 1, 0] } },
                    activeJobs: { $sum: { $cond: [{ $in: ['$status', [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.REPAIR_IN_PROGRESS]] }, 1, 0] } },
                    cancelledJobs: { $sum: { $cond: [{ $in: ['$status', [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED]] }, 1, 0] } },
                    todayJobs: { $sum: { $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0] } },
                    revenue: { $sum: { $cond: [{ $eq: ['$status', JobStatus.COMPLETED] }, '$finalQuote', 0] } },
                }
            }
        ]);

        // Map worker profile IDs to their user IDs
        const workerToUser = new Map(workerProfiles.map(wp => [wp._id.toString(), wp.user.toString()]));

        // Build zone stats by matching workers to zones
        const zoneStatsMap = new Map<string, { totalJobs: number; completedJobs: number; activeJobs: number; cancelledJobs: number; todayJobs: number; revenue: number }>();
        for (const zs of zoneJobs) {
            const userId = workerToUser.get(zs._id.toString());
            // Find which zone this user belongs to
            for (const zone of zones) {
                const zoneUserIds = [
                    zone.manager?._id?.toString() || zone.manager?.toString(),
                    ...(zone.fieldExecutives || []).map(fe => fe._id?.toString() || fe.toString())
                ];
                if (userId && zoneUserIds.includes(userId)) {
                    const existing = zoneStatsMap.get(zone._id.toString()) || { totalJobs: 0, completedJobs: 0, activeJobs: 0, cancelledJobs: 0, todayJobs: 0, revenue: 0 };
                    existing.totalJobs += zs.totalJobs;
                    existing.completedJobs += zs.completedJobs;
                    existing.activeJobs += zs.activeJobs;
                    existing.cancelledJobs += zs.cancelledJobs;
                    existing.todayJobs += zs.todayJobs;
                    existing.revenue += zs.revenue;
                    zoneStatsMap.set(zone._id.toString(), existing);
                }
            }
        }

        // City-level stats
        const cityJobStats = workerProfileIds.length > 0 ? await Job.aggregate([
            { $match: { worker: { $in: workerProfileIds } } },
            {
                $group: {
                    _id: null,
                    totalJobs: { $sum: 1 },
                    completedJobs: { $sum: { $cond: [{ $eq: ['$status', JobStatus.COMPLETED] }, 1, 0] } },
                    activeJobs: { $sum: { $cond: [{ $in: ['$status', [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.REPAIR_IN_PROGRESS]] }, 1, 0] } },
                    cancelledJobs: { $sum: { $cond: [{ $in: ['$status', [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED]] }, 1, 0] } },
                    todayCompleted: { $sum: { $cond: [{ $and: [{ $eq: ['$status', JobStatus.COMPLETED] }, { $gte: ['$completedAt', startOfDay] }] }, 1, 0] } },
                    todayCancelled: { $sum: { $cond: [{ $and: [{ $in: ['$status', [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED]] }, { $gte: ['$createdAt', startOfDay] }] }, 1, 0] } },
                    revenue: { $sum: { $cond: [{ $eq: ['$status', JobStatus.COMPLETED] }, '$finalQuote', 0] } },
                }
            }
        ]) : [];
        const cityStats = cityJobStats[0] || { totalJobs: 0, completedJobs: 0, activeJobs: 0, cancelledJobs: 0, todayCompleted: 0, todayCancelled: 0, revenue: 0 };

        // 3. Complaints in the city
        const complaints = workerProfileIds.length > 0 ? await Complaint.find({
            $or: [
                { worker: { $in: workerProfileIds } }
            ]
        })
            .populate('customer', 'name phone')
            .populate('worker', 'name phone')
            .populate('job', 'serviceType subServiceName status')
            .sort({ createdAt: -1 })
            .limit(20) : [];

        // 4. Disputes
        const disputes = workerProfileIds.length > 0 ? await Job.find({
            worker: { $in: workerProfileIds },
            status: { $in: [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED] }
        })
            .populate('customer', 'name phone')
            .populate('worker', 'name phone')
            .sort({ createdAt: -1 })
            .limit(20) : [];

        // 5. Emergencies
        const emergencies = workerProfileIds.length > 0 ? await Job.find({
            worker: { $in: workerProfileIds },
            status: { $in: [JobStatus.PAUSED_APPROVAL_PENDING, JobStatus.ON_SITE_DIAGNOSIS] }
        })
            .populate('customer', 'name phone')
            .populate('worker', 'name phone')
            .sort({ createdAt: -1 })
            .limit(20) : [];

        // 6. Complaint summary
        const complaintSummary = workerProfileIds.length > 0 ? await Complaint.aggregate([
            { $match: { worker: { $in: workerProfileIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]) : [];

        return {
            zones: zones.map(z => ({
                ...z.toObject(),
                stats: zoneStatsMap.get(z._id.toString()) || { totalJobs: 0, completedJobs: 0, activeJobs: 0, cancelledJobs: 0, todayJobs: 0, revenue: 0 }
            })),
            cityStats,
            complaints,
            disputes,
            emergencies,
            complaintSummary: Object.fromEntries(complaintSummary.map(c => [c._id, c.count])),
        };
    }
}
