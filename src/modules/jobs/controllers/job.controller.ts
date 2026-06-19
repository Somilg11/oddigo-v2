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

    static async requestJobOtp(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await JobService.requestJobOtp(req.params.id, req.user._id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async verifyJobOtp(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { otp } = req.body;
            const job = await JobService.verifyJobOtp(req.params.id, req.user._id, otp);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async submitEstimate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const job = await JobService.submitEstimate(req.params.id, req.user._id, req.body);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async approveFinalPrice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { approved } = req.body;
            const job = await JobService.approveFinalPrice(req.params.id, req.user._id, approved);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async addBeforePhoto(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { photoUrl } = req.body;
            const job = await JobService.addBeforePhoto(req.params.id, req.user._id, photoUrl);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async addAfterPhoto(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { photoUrl } = req.body;
            const job = await JobService.addAfterPhoto(req.params.id, req.user._id, photoUrl);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async completeJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { proofUrl, customerSignature } = req.body;
            const job = await JobService.completeJob(req.params.id, req.user._id, proofUrl, customerSignature);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async submitDigitalSignature(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { signatureData } = req.body;
            const job = await JobService.submitDigitalSignature(req.params.id, req.user._id, signatureData);
            res.status(200).json({ success: true, data: job });
        } catch (error) {
            next(error);
        }
    }

    static async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { paymentMethod } = req.body;
            const result = await JobService.processPayment(req.params.id, req.user._id, paymentMethod);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const result = await JobService.confirmPayment(
                req.params.id,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async refundJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { reason } = req.body;
            const job = await JobService.refundJob(req.params.id, reason, req.user._id);
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
            const { serviceType, lat, long, subServiceId } = req.body;
            const estimate = await JobService.getEstimate(serviceType, lat, long, subServiceId);
            res.status(200).json({ success: true, data: estimate });
        } catch (error) {
            next(error);
        }
    }
}
