import { CityManagerProfile } from '../models/CityManagerProfile';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { Zone } from '../../zones/models/Zone';
import { Job, JobStatus } from '../../jobs/models/Job';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { User } from '../../users/models/User';
import { ServiceCategory } from '../../services/models/ServiceCategory';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class CityManagerService {

    static async getDashboard(managerId: string) {
        const profile = await CityManagerProfile.findOne({ user: managerId });
        if (!profile) throw new AppError('City manager profile not found', 404);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            totalOrders,
            monthlyRevenue,
            activeWorkers,
            pendingJobs,
            completedToday,
            cancelledToday,
            avgRatingResult
        ] = await Promise.all([
            Job.countDocuments({}),
            Job.aggregate([
                { $match: { status: JobStatus.COMPLETED, completedAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$finalQuote' } } }
            ]),
            WorkerProfile.countDocuments({ isOnline: true }),
            Job.countDocuments({ status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] } }),
            Job.countDocuments({ status: JobStatus.COMPLETED, completedAt: { $gte: startOfDay } }),
            Job.countDocuments({ status: { $in: [JobStatus.CANCELLED, JobStatus.CANCELLED_CHARGED] }, createdAt: { $gte: startOfDay } }),
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

    static async createZone(managerId: string, data: {
        name: string;
        city: string;
        center: { lat: number; long: number };
        radiusKm?: number;
    }) {
        const zone = await Zone.create({
            name: data.name,
            city: data.city,
            center: {
                type: 'Point',
                coordinates: [data.center.long, data.center.lat]
            },
            radiusKm: data.radiusKm || 5
        });

        Logger.info(`Zone created: ${zone.name} in ${zone.city}`);
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
}
