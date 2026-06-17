import { Request, Response, NextFunction } from 'express';
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

export class AdminController {

    static async getSystemHealth(req: Request, res: Response, next: NextFunction) {
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

    static async toggleMaintenance(req: Request, res: Response, next: NextFunction) {
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

    static async getAnalytics(req: Request, res: Response, next: NextFunction) {
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

    static async getDisputes(req: Request, res: Response, next: NextFunction) {
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

    static async verifyWorker(req: Request, res: Response, next: NextFunction) {
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

    static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
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

    static async getLiveOperations(req: Request, res: Response, next: NextFunction) {
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

    static async getComplaints(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, page = '1', limit = '20' } = req.query;
            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            const filter: any = {};
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

    static async resolveComplaint(req: Request, res: Response, next: NextFunction) {
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
                    } catch (error: any) {
                        Logger.error(`Refund failed for complaint ${complaint._id}: ${error.message}`);
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
}
