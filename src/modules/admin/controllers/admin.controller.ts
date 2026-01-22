import { Request, Response, NextFunction } from 'express';
import { Job, JobStatus } from '../../jobs/models/Job';
import { User } from '../../users/models/User';
import ServiceFactory from '../../../core/services/service.factory';
import { MaintenanceService } from '../services/maintenance.service';

export class AdminController {

    // System Health Check (Service Abstraction Check)
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

    // Toggle Maintenance
    static async toggleMaintenance(req: Request, res: Response, next: NextFunction) {
        try {
            const { app, enabled } = req.body; // app: 'USER' | 'WORKER', enabled: boolean

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

    // Dashboard Analytics (Aggregated Data)
    static async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const totalUsers = await User.countDocuments();
            const totalJobs = await Job.countDocuments();

            // GMV (Gross Merchandise Value) - Sum of Final Quotes
            const gmvAgg = await Job.aggregate([
                { $match: { status: JobStatus.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$finalQuote' } } }
            ]);
            const gmv = gmvAgg[0]?.total || 0;

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalJobs,
                    gmv
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Disputes (Jobs that are Cancelled or have Low Rating - Placeholder)
    static async getDisputes(req: Request, res: Response, next: NextFunction) {
        try {
            // Placeholder: Fetch cancelled jobs for review
            const disputes = await Job.find({
                status: { $in: [JobStatus.CANCELLED_CHARGED, JobStatus.CANCELLED] }
            }).populate('customer worker');

            res.status(200).json({
                success: true,
                data: disputes
            });
        } catch (error) {
            next(error);
        }
    }
    static async verifyWorker(req: Request, res: Response, next: NextFunction) {
        try {
            const { workerId, status } = req.body; // status: 'VERIFIED' | 'REJECTED'
            const WorkerProfile = require('../../workers/models/WorkerProfile').WorkerProfile;

            const profile = await WorkerProfile.findOneAndUpdate(
                { user: workerId },
                { verificationStatus: status },
                { new: true }
            );

            if (!profile) throw new Error('Worker not found');

            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }
    static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, isActive } = req.body;

            const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
            if (!user) throw new Error('User not found');

            res.status(200).json({ success: true, message: `User ${user.email} is now ${isActive ? 'ACTIVE' : 'INACTIVE'}`, data: user });
        } catch (error) {
            next(error);
        }
    }
}
