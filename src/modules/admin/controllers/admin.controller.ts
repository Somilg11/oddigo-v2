import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Job, JobStatus } from '../../jobs/models/Job';
import { User } from '../../users/models/User';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { WorkerKYC } from '../../workers/models/WorkerKYC';
import ServiceFactory from '../../../core/services/service.factory';
import { MaintenanceService } from '../services/maintenance.service';
import { KYCService } from '../../workers/services/kyc.service';
import { Complaint, ComplaintStatus } from '../models/Complaint';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';
import { ServiceCategory } from '../../services/models/ServiceCategory';
import { SubService, PricingType } from '../../services/models/SubService';
import { Banner, BannerType } from '../models/Banner';
import { Coupon, CouponType } from '../models/Coupon';
import { UserPoints, PointTransaction, PointTransactionType } from '../../users/models/UserPoints';
import redis from '../../../config/redis';

export class AdminController {

    static async getSystemHealth(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const checks = await Promise.all([
                ServiceFactory.getEmailProvider().checkHealth(),
                ServiceFactory.getOTPProvider().checkHealth(),
                ServiceFactory.getPaymentProvider().checkHealth(),
                ServiceFactory.getStorageProvider().checkHealth(),
                ServiceFactory.getAIProvider().checkHealth()
            ]);

            const maintenanceStatus = await MaintenanceService.getStatus();

            res.status(200).json({
                success: true,
                data: {
                    services: checks,
                    maintenance: maintenanceStatus
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async toggleMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { app, enabled } = req.body;

            if (!['USER', 'WORKER'].includes(app)) {
                return res.status(400).json({ success: false, message: 'Invalid app type' });
            }

            await MaintenanceService.setMaintenanceMode(app, enabled);

            res.status(200).json({
                success: true,
                message: `Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'} for ${app} App`
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAnalytics(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const totalUsers = await User.countDocuments();
            const totalJobs = await Job.countDocuments();

            // Only count WorkerProfiles linked to users with role WORKER
            const workerUserIds = (await User.find({ role: 'WORKER' }).select('_id')).map(u => u._id);
            const totalWorkers = await WorkerProfile.countDocuments({ user: { $in: workerUserIds } });
            const activeWorkers = await WorkerProfile.countDocuments({ user: { $in: workerUserIds }, isOnline: true });

            const gmvAgg = await Job.aggregate([
                { $match: { status: JobStatus.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$finalQuote' } } }
            ]);
            const gmv = gmvAgg[0]?.total || 0;

            const monthlyGmvAgg = await Job.aggregate([
                {
                    $match: {
                        status: JobStatus.COMPLETED,
                        completedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                    }
                },
                { $group: { _id: null, total: { $sum: '$finalQuote' }, count: { $sum: 1 } } }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalJobs,
                    totalWorkers,
                    activeWorkers,
                    gmv,
                    monthlyRevenue: monthlyGmvAgg[0]?.total || 0,
                    monthlyJobs: monthlyGmvAgg[0]?.count || 0
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getDisputes(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '15' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const query = {
                status: { $in: [JobStatus.CANCELLED_CHARGED, JobStatus.CANCELLED] }
            };

            const [disputes, total] = await Promise.all([
                Job.find(query)
                    .populate('customer', 'name email phone')
                    .populate('worker', 'name email phone')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                Job.countDocuments(query)
            ]);

            res.status(200).json({
                success: true,
                results: disputes.length,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
                data: disputes
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllWorkers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '20', search } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);

            // Only include profiles linked to users with role WORKER
            const workerUserIds = (await User.find({ role: 'WORKER' }).select('_id')).map(u => u._id);
            const filter: Record<string, unknown> = { user: { $in: workerUserIds } };
            if (search) {
                filter.$or = [
                    { verificationStatus: { $regex: search, $options: 'i' } }
                ];
            }

            const [allWorkers, total] = await Promise.all([
                WorkerProfile.find(filter)
                    .populate('user', 'name email phone isActive avatarUrl')
                    .sort({ createdAt: -1 })
                    .skip((pageNum - 1) * limitNum)
                    .limit(limitNum),
                WorkerProfile.countDocuments(filter)
            ]);

            const workers = allWorkers.filter(w => w.user && (w.user as any).isActive !== false);

            res.status(200).json({
                success: true,
                results: workers.length,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                },
                data: workers
            });
        } catch (error) {
            next(error);
        }
    }

    static async verifyWorker(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { workerId, status } = req.body;

            const profile = await WorkerProfile.findOneAndUpdate(
                { user: workerId },
                { verificationStatus: status },
                { new: true }
            );

            if (!profile) throw new AppError('Worker not found', 404);

            Logger.info(`Worker ${workerId} verification status: ${status}`);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    static async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { userId, isActive } = req.body;

            const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
            if (!user) throw new AppError('User not found', 404);

            res.status(200).json({
                success: true,
                message: `User ${user.email} is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    static async getLiveOperations(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const workerUserIds = (await User.find({ role: 'WORKER' }).select('_id')).map(u => u._id);

            const busyJobWorkerIds = (await Job.find({
                status: { $in: [JobStatus.IN_PROGRESS, JobStatus.ACCEPTED, JobStatus.OTP_PENDING] }
            }).select('worker')).map(j => j.worker).filter((w): w is NonNullable<typeof w> => w != null);

            const [
                pendingRequests,
                workersOnline,
                workersBusy,
                workersOffline,
                emergencyJobs
            ] = await Promise.all([
                Job.countDocuments({ status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] } }),
                WorkerProfile.countDocuments({ user: { $in: workerUserIds }, isOnline: true }),
                busyJobWorkerIds.length > 0
                    ? WorkerProfile.countDocuments({
                        isOnline: true,
                        user: { $in: busyJobWorkerIds }
                    })
                    : 0,
                WorkerProfile.countDocuments({ user: { $in: workerUserIds }, isOnline: false }),
                Job.countDocuments({
                    status: { $in: [JobStatus.CREATED, JobStatus.MATCHING] },
                    serviceType: { $in: ['short-circuit-repair', 'power-outage'] }
                })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    pendingRequests,
                    workersOnline,
                    workersBusy,
                    workersOffline,
                    emergencyJobs
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getComplaints(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { status, page = '1', limit = '20' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const filter: Record<string, unknown> = {};
            if (status) filter.status = status;

            const [complaints, total] = await Promise.all([
                Complaint.find(filter)
                    .populate('customer', 'name email phone')
                    .populate('worker', 'name email phone')
                    .populate('job', 'serviceType status')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                Complaint.countDocuments(filter)
            ]);

            res.status(200).json({
                success: true,
                results: complaints.length,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                },
                data: complaints
            });
        } catch (error) {
            next(error);
        }
    }

    static async resolveComplaint(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { resolution, refundAmount } = req.body;

            const complaint = await Complaint.findById(req.params.id);
            if (!complaint) throw new AppError('Complaint not found', 404);

            complaint.status = ComplaintStatus.RESOLVED;
            complaint.resolution = resolution;
            complaint.resolvedAt = new Date();
            await complaint.save();

            if (refundAmount && complaint.job) {
                const job = await Job.findById(complaint.job);
                if (job && job.transactionId) {
                    try {
                        await ServiceFactory.getPaymentProvider().refundPayment(job.transactionId, refundAmount);
                        Logger.info(`Refund of ${refundAmount} processed for complaint ${complaint._id}`);
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        Logger.error(`Refund failed for complaint ${complaint._id}: ${message}`);
                    }
                }
            }

            Logger.info(`Complaint ${complaint._id} resolved`);
            res.status(200).json({ success: true, data: complaint });
        } catch (error) {
            next(error);
        }
    }

    static async getPendingVerifications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page, limit } = req.query;
            const result = await KYCService.getPendingVerifications(
                parseInt(page as string) || 1,
                parseInt(limit as string) || 20
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async bulkVerify(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { documentIds, status } = req.body;
            const result = await KYCService.bulkVerify(documentIds, req.user._id, status);
            res.status(200).json({ success: true, results: result.length, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getWorker(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profile = await WorkerProfile.findById(req.params.id)
                .populate('user', 'name email phone isActive avatarUrl');
            if (!profile) throw new AppError('Worker not found', 404);
            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    static async getWorkerKYC(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profile = await WorkerProfile.findById(req.params.id);
            if (!profile) throw new AppError('Worker not found', 404);
            const docs = await WorkerKYC.find({ worker: profile.user })
                .sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: docs });
        } catch (error) {
            next(error);
        }
    }

    static async deleteWorker(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profile = await WorkerProfile.findOne({ user: req.params.id });
            if (!profile) throw new AppError('Worker not found', 404);

            await User.findByIdAndUpdate(req.params.id, { isActive: false });
            await profile.deleteOne();

            await redis.zrem('workers:locations', req.params.id);

            res.status(200).json({ success: true, message: 'Worker deleted' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Service Category CRUD ────────────────────────────────────

    static async getAllCategories(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '15' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const [categories, total] = await Promise.all([
                ServiceCategory.find().sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limitNum),
                ServiceCategory.countDocuments()
            ]);

            const categoriesWithCount = await Promise.all(
                categories.map(async (cat) => {
                    const subServiceCount = await SubService.countDocuments({ category: cat._id });
                    return { ...cat.toObject(), subServiceCount };
                })
            );

            res.status(200).json({
                success: true,
                results: categoriesWithCount.length,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
                data: categoriesWithCount
            });
        } catch (error) {
            next(error);
        }
    }

    static async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                name: z.string().min(2),
                slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
                icon: z.string().optional().default(''),
                description: z.string().optional().default(''),
                isActive: z.boolean().optional().default(true),
                sortOrder: z.number().optional().default(0),
            });

            const data = schema.parse(req.body);

            const existing = await ServiceCategory.findOne({ $or: [{ slug: data.slug }, { name: data.name }] });
            if (existing) throw new AppError('Category with this name or slug already exists', 409);

            const category = await ServiceCategory.create(data);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                name: z.string().min(2).optional(),
                slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
                icon: z.string().optional(),
                description: z.string().optional(),
                isActive: z.boolean().optional(),
                sortOrder: z.number().optional(),
            });

            const data = schema.parse(req.body);
            const category = await ServiceCategory.findById(req.params.id);
            if (!category) throw new AppError('Category not found', 404);

            if (data.slug || data.name) {
                const conflict = await ServiceCategory.findOne({
                    _id: { $ne: category._id },
                    $or: [
                        ...(data.slug ? [{ slug: data.slug }] : []),
                        ...(data.name ? [{ name: data.name }] : []),
                    ],
                });
                if (conflict) throw new AppError('Category with this name or slug already exists', 409);
            }

            Object.assign(category, data);
            await category.save();
            res.status(200).json({ success: true, data: category });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const category = await ServiceCategory.findById(req.params.id);
            if (!category) throw new AppError('Category not found', 404);

            await SubService.deleteMany({ category: category._id });
            await category.deleteOne();

            res.status(200).json({ success: true, message: 'Category and its sub-services deleted' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Sub-Service CRUD ─────────────────────────────────────────

    static async getAllSubServices(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { categoryId } = req.query;
            const filter: Record<string, unknown> = {};
            if (categoryId) filter.category = categoryId;

            const subServices = await SubService.find(filter)
                .populate('category', 'name slug icon')
                .sort({ name: 1 });

            res.status(200).json({ success: true, data: subServices });
        } catch (error) {
            next(error);
        }
    }

    static async createSubService(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                name: z.string().min(2),
                slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
                category: z.string().min(1),
                description: z.string().optional().default(''),
                basePrice: z.number().min(0),
                estimatedTime: z.number().min(1),
                pricingType: z.nativeEnum(PricingType).default(PricingType.ESTIMATE),
                isActive: z.boolean().optional().default(true),
            });

            const data = schema.parse(req.body);

            const categoryExists = await ServiceCategory.findById(data.category);
            if (!categoryExists) throw new AppError('Category not found', 404);

            const existing = await SubService.findOne({ $or: [{ slug: data.slug }, { name: data.name, category: data.category }] });
            if (existing) throw new AppError('Sub-service with this name or slug already exists', 409);

            const subService = await SubService.create(data);
            const populated = await subService.populate('category', 'name slug icon');
            res.status(201).json({ success: true, data: populated });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async updateSubService(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                name: z.string().min(2).optional(),
                slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
                category: z.string().optional(),
                description: z.string().optional(),
                basePrice: z.number().min(0).optional(),
                estimatedTime: z.number().min(1).optional(),
                pricingType: z.nativeEnum(PricingType).optional(),
                isActive: z.boolean().optional(),
            });

            const data = schema.parse(req.body);
            const subService = await SubService.findById(req.params.id);
            if (!subService) throw new AppError('Sub-service not found', 404);

            if (data.category) {
                const categoryExists = await ServiceCategory.findById(data.category);
                if (!categoryExists) throw new AppError('Category not found', 404);
            }

            if (data.slug || data.name) {
                const conflict = await SubService.findOne({
                    _id: { $ne: subService._id },
                    $or: [
                        ...(data.slug ? [{ slug: data.slug }] : []),
                        ...(data.name ? [{ name: data.name, category: data.category || subService.category }] : []),
                    ],
                });
                if (conflict) throw new AppError('Sub-service with this name or slug already exists', 409);
            }

            Object.assign(subService, data);
            await subService.save();
            const populated = await subService.populate('category', 'name slug icon');
            res.status(200).json({ success: true, data: populated });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async deleteSubService(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const subService = await SubService.findById(req.params.id);
            if (!subService) throw new AppError('Sub-service not found', 404);

            await subService.deleteOne();
            res.status(200).json({ success: true, message: 'Sub-service deleted' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Banner CRUD ───────────────────────────────────────────────

    static async getBanners(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '15' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const [banners, total] = await Promise.all([
                Banner.find().sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limitNum),
                Banner.countDocuments()
            ]);

            res.status(200).json({
                success: true,
                results: banners.length,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
                data: banners
            });
        } catch (error) {
            next(error);
        }
    }

    static async getActiveBanners(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const now = new Date();
            const banners = await Banner.find({
                isActive: true,
                $and: [
                    { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
                    { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
                ]
            }).sort({ sortOrder: 1 });
            res.status(200).json({ success: true, data: banners });
        } catch (error) {
            next(error);
        }
    }

    static async createBanner(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                title: z.string().min(1),
                subtitle: z.string().optional().default(''),
                imageUrl: z.string().optional().default(''),
                linkUrl: z.string().optional().default(''),
                type: z.nativeEnum(BannerType),
                isActive: z.boolean().optional().default(true),
                sortOrder: z.number().optional().default(0),
                startsAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
                expiresAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
            });

            const data = schema.parse(req.body);
            const banner = await Banner.create({ ...data, createdBy: req.user._id });
            res.status(201).json({ success: true, data: banner });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async updateBanner(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                title: z.string().min(1).optional(),
                subtitle: z.string().optional(),
                imageUrl: z.string().optional(),
                linkUrl: z.string().optional(),
                type: z.nativeEnum(BannerType).optional(),
                isActive: z.boolean().optional(),
                sortOrder: z.number().optional(),
                startsAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
                expiresAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
            });

            const data = schema.parse(req.body);
            const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true });
            if (!banner) throw new AppError('Banner not found', 404);
            res.status(200).json({ success: true, data: banner });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async deleteBanner(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const banner = await Banner.findByIdAndDelete(req.params.id);
            if (!banner) throw new AppError('Banner not found', 404);
            res.status(200).json({ success: true, message: 'Banner deleted' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Coupon CRUD ───────────────────────────────────────────────

    static async getCoupons(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page = '1', limit = '15' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const [coupons, total] = await Promise.all([
                Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
                Coupon.countDocuments()
            ]);

            res.status(200).json({
                success: true,
                results: coupons.length,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
                data: coupons
            });
        } catch (error) {
            next(error);
        }
    }

    static async createCoupon(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                code: z.string().min(3).max(20),
                description: z.string().min(1),
                type: z.nativeEnum(CouponType),
                value: z.number().min(0),
                minOrderAmount: z.number().min(0).optional(),
                maxDiscount: z.number().min(0).optional(),
                usageLimit: z.number().min(0).optional(),
                perUserLimit: z.number().min(0).optional(),
                applicableCategories: z.array(z.string()).optional(),
                isActive: z.boolean().optional().default(true),
                startsAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
                expiresAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
            });

            const data = schema.parse(req.body);
            const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
            if (existing) throw new AppError('Coupon with this code already exists', 409);

            const coupon = await Coupon.create({ ...data, code: data.code.toUpperCase(), createdBy: req.user._id });
            res.status(201).json({ success: true, data: coupon });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async updateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                code: z.string().min(3).max(20).optional(),
                description: z.string().min(1).optional(),
                type: z.nativeEnum(CouponType).optional(),
                value: z.number().min(0).optional(),
                minOrderAmount: z.number().min(0).optional().nullable(),
                maxDiscount: z.number().min(0).optional().nullable(),
                usageLimit: z.number().min(0).optional().nullable(),
                perUserLimit: z.number().min(0).optional().nullable(),
                applicableCategories: z.array(z.string()).optional(),
                isActive: z.boolean().optional(),
                startsAt: z.string().optional().transform(v => v ? new Date(v) : undefined).nullable(),
                expiresAt: z.string().optional().transform(v => v ? new Date(v) : undefined).nullable(),
            });

            const data = schema.parse(req.body);
            if (data.code) data.code = data.code.toUpperCase();

            const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true });
            if (!coupon) throw new AppError('Coupon not found', 404);
            res.status(200).json({ success: true, data: coupon });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: error.issues[0].message });
            }
            next(error);
        }
    }

    static async deleteCoupon(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const coupon = await Coupon.findByIdAndDelete(req.params.id);
            if (!coupon) throw new AppError('Coupon not found', 404);
            res.status(200).json({ success: true, message: 'Coupon deleted' });
        } catch (error) {
            next(error);
        }
    }

    static async validateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { code, jobAmount, categoryId } = req.body;
            if (!code) throw new AppError('Coupon code is required', 400);

            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (!coupon) throw new AppError('Invalid coupon code', 404);
            if (!coupon.isActive) throw new AppError('This coupon is no longer active', 400);

            const now = new Date();
            if (coupon.startsAt && now < coupon.startsAt) throw new AppError('This coupon is not yet valid', 400);
            if (coupon.expiresAt && now > coupon.expiresAt) throw new AppError('This coupon has expired', 400);

            if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
                throw new AppError('This coupon has reached its usage limit', 400);
            }

            if (jobAmount && coupon.minOrderAmount && jobAmount < coupon.minOrderAmount) {
                throw new AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
            }

            if (categoryId && coupon.applicableCategories && coupon.applicableCategories.length > 0) {
                const matches = coupon.applicableCategories.some(c => c.toString() === categoryId);
                if (!matches) throw new AppError('This coupon is not applicable for this service', 400);
            }

            let discount = 0;
            if (coupon.type === CouponType.PERCENTAGE) {
                discount = Math.round((jobAmount || 0) * coupon.value / 100);
                if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                    discount = coupon.maxDiscount;
                }
            } else if (coupon.type === CouponType.FLAT) {
                discount = coupon.value;
            }

            res.status(200).json({
                success: true,
                data: {
                    valid: true,
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    discount,
                    description: coupon.description,
                    message: `Coupon applied! You save ₹${discount}`
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // ─── Analytics Endpoints ──────────────────────────────────────

    static async getReferralAnalytics(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const totalUsers = await User.countDocuments({ role: 'CUSTOMER', isActive: true });
            const referredUsers = await User.countDocuments({ referredBy: { $exists: true, $ne: null }, role: 'CUSTOMER', isActive: true });
            const referralRate = totalUsers > 0 ? Math.round((referredUsers / totalUsers) * 100) : 0;

            const topReferrers = await User.aggregate([
                { $match: { referredBy: { $exists: true, $ne: null } } },
                { $group: { _id: '$referredBy', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'referrer'
                    }
                },
                { $unwind: '$referrer' },
                { $project: { name: '$referrer.name', email: '$referrer.email', count: 1 } }
            ]);

            const monthlyReferrals = await User.aggregate([
                { $match: { referredBy: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    referredUsers,
                    referralRate,
                    topReferrers,
                    monthlyReferrals: monthlyReferrals.reverse()
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPointsAnalytics(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const pointsStats = await UserPoints.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBalance: { $sum: '$balance' },
                        totalEarned: { $sum: '$lifetimeEarned' },
                        totalRedeemed: { $sum: '$lifetimeRedeemed' },
                        usersWithPoints: { $sum: 1 }
                    }
                }
            ]);

            const stats = pointsStats[0] || { totalBalance: 0, totalEarned: 0, totalRedeemed: 0, usersWithPoints: 0 };

            const redemptionCount = await PointTransaction.countDocuments({ type: PointTransactionType.REDEEMED });
            const uniqueRedeemers = await PointTransaction.distinct('user', { type: PointTransactionType.REDEEMED });

            const earnedByType = await PointTransaction.aggregate([
                { $match: { type: PointTransactionType.EARNED } },
                { $group: { _id: '$description', count: { $sum: 1 }, totalPoints: { $sum: '$amount' } } },
                { $sort: { totalPoints: -1 } }
            ]);

            const monthlyRedemptions = await PointTransaction.aggregate([
                { $match: { type: PointTransactionType.REDEEMED } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                        totalPoints: { $sum: { $abs: '$amount' } }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);

            const discountRupees = Math.floor(stats.totalRedeemed / 100);

            res.status(200).json({
                success: true,
                data: {
                    totalPointsEarned: stats.totalEarned,
                    totalPointsRedeemed: stats.totalRedeemed,
                    totalPointsBalance: stats.totalBalance,
                    totalDiscountRupees: discountRupees,
                    usersWithPoints: stats.usersWithPoints,
                    totalRedemptionTransactions: redemptionCount,
                    uniqueRedeemers: uniqueRedeemers.length,
                    earnedByType,
                    monthlyRedemptions: monthlyRedemptions.reverse()
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCouponAnalytics(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const couponStats = await Coupon.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCoupons: { $sum: 1 },
                        activeCoupons: { $sum: { $cond: ['$isActive', 1, 0] } },
                        totalUsageCount: { $sum: '$usageCount' }
                    }
                }
            ]);

            const stats = couponStats[0] || { totalCoupons: 0, activeCoupons: 0, totalUsageCount: 0 };

            const jobsWithCoupons = await Job.aggregate([
                { $match: { couponCode: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: null,
                        totalJobs: { $sum: 1 },
                        totalDiscount: { $sum: '$discount' }
                    }
                }
            ]);

            const couponStats2 = jobsWithCoupons[0] || { totalJobs: 0, totalDiscount: 0 };

            const topCoupons = await Coupon.find()
                .sort({ usageCount: -1 })
                .limit(10)
                .select('code description type value usageCount usageLimit isActive');

            const couponTypeBreakdown = await Coupon.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 }, totalUsage: { $sum: '$usageCount' } } }
            ]);

            const monthlyCouponUsage = await Job.aggregate([
                { $match: { couponCode: { $exists: true, $ne: null }, status: JobStatus.COMPLETED } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                        totalDiscount: { $sum: '$discount' }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 6 }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    totalCoupons: stats.totalCoupons,
                    activeCoupons: stats.activeCoupons,
                    totalCouponRedemptions: couponStats2.totalJobs,
                    totalCouponDiscount: couponStats2.totalDiscount,
                    topCoupons,
                    couponTypeBreakdown,
                    monthlyCouponUsage: monthlyCouponUsage.reverse()
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
