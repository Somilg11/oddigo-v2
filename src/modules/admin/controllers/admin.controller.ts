import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Job, JobStatus } from '../../jobs/models/Job';
import { User } from '../../users/models/User';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import ServiceFactory from '../../../core/services/service.factory';
import { MaintenanceService } from '../services/maintenance.service';
import { KYCService } from '../../workers/services/kyc.service';
import { Complaint, ComplaintStatus } from '../models/Complaint';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';
import { ServiceCategory } from '../../services/models/ServiceCategory';
import { SubService, PricingType } from '../../services/models/SubService';

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
            const totalWorkers = await WorkerProfile.countDocuments();
            const activeWorkers = await WorkerProfile.countDocuments({ isOnline: true });

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

    static async getDisputes(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const disputes = await Job.find({
                status: { $in: [JobStatus.CANCELLED_CHARGED, JobStatus.CANCELLED] }
            })
            .populate('customer', 'name email phone')
            .populate('worker', 'name email phone')
            .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                results: disputes.length,
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
            const skip = (pageNum - 1) * limitNum;

            const filter: Record<string, unknown> = {};
            if (search) {
                filter.$or = [
                    { verificationStatus: { $regex: search, $options: 'i' } }
                ];
            }

            const [workers, total] = await Promise.all([
                WorkerProfile.find(filter)
                    .populate('user', 'name email phone isActive avatarUrl')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                WorkerProfile.countDocuments(filter)
            ]);

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
                WorkerProfile.countDocuments({ isOnline: true }),
                busyJobWorkerIds.length > 0
                    ? WorkerProfile.countDocuments({
                        isOnline: true,
                        user: { $in: busyJobWorkerIds }
                    })
                    : 0,
                WorkerProfile.countDocuments({ isOnline: false }),
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

    // ─── Service Category CRUD ────────────────────────────────────

    static async getAllCategories(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const categories = await ServiceCategory.find().sort({ sortOrder: 1, name: 1 });

            const categoriesWithCount = await Promise.all(
                categories.map(async (cat) => {
                    const subServiceCount = await SubService.countDocuments({ category: cat._id });
                    return { ...cat.toObject(), subServiceCount };
                })
            );

            res.status(200).json({ success: true, data: categoriesWithCount });
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
}
