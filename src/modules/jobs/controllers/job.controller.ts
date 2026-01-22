import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class JobController {

    static async createJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.createJob(req.user, req.body);
            res.status(201).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async getJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.getJob(req.params.id);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async findWorkers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const workers = await JobService.findWorkersForJob(req.params.id);
            res.status(200).json({ success: true, results: workers.length, data: workers });
        } catch (error) {
            next(error);
        }
    }

    static async acceptJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.acceptJob(req.params.id, req.user._id);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async startJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.startJob(req.params.id, req.user._id);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async requestAmendment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.requestAmendment(req.params.id, req.user._id, req.body);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async respondToAmendment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { approved } = req.body;
            const job = await JobService.respondToAmendment(req.params.id, req.user._id, approved);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async completeJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { proofUrl } = req.body;
            const job = await JobService.completeJob(req.params.id, req.user._id, proofUrl);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }
    static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const jobs = await JobService.getJobHistory(req.user._id, req.user.role);
            res.status(200).json({ success: true, results: jobs.length, data: jobs });
        } catch (error) {
            next(error);
        }
    }
    static async cancelJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.cancelJob(req.params.id, req.user._id);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async getEstimate(req: Request, res: Response, next: NextFunction) {
        try {
            const { serviceType, lat, long } = req.body;
            const price = await JobService.getEstimate(serviceType, lat, long);
            res.status(200).json({ success: true, data: { price } });
        } catch (error) {
            next(error);
        }
    }
}
