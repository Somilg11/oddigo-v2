import { Job, JobStatus, IJob, PaymentMethod, PaymentStatus } from '../models/Job';
import { PricingEngine } from '../../pricing/pricing.engine';
import { MatchingEngine } from '../../matching/matching.engine';
import { WarrantyService } from '../../warranty/services/warranty.service';
import { SocketService } from '../../socket/services/socket.service';
import { AppError } from '../../../core/errors/AppError';
import { IUser } from '../../users/models/User';
import ServiceFactory from '../../../core/services/service.factory';
import redis from '../../../config/redis';
import { Logger } from '../../../config/logger';
import { PricingType } from '../../services/models/SubService';

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export class JobService {

    static async createJob(customer: IUser, data: Partial<IJob>) {
        if (!data.location || !data.serviceType) {
            throw new AppError('Location and Service Type are required', 400);
        }

        const distanceKm = 5;
        const pricing = await PricingEngine.getEstimate(data.serviceType, distanceKm, data.subService?.toString());

        const job = await Job.create({
            ...data,
            customer: customer._id,
            initialQuote: pricing.totalEstimate,
            status: JobStatus.CREATED
        });

        Logger.info(`Job created: ${job._id} by customer ${customer._id}`);

        return job;
    }

    static async getJob(id: string) {
        const job = await Job.findById(id)
            .populate('customer', 'name email phone avatarUrl')
            .populate('worker', 'name email phone avatarUrl')
            .populate('subService', 'name slug basePrice estimatedTime pricingType');

        if (!job) throw new AppError('Job not found', 404);
        return job;
    }

    static async findWorkersForJob(jobId: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.status !== JobStatus.CREATED && job.status !== JobStatus.MATCHING) {
            throw new AppError('Job is not in matching state', 400);
        }

        job.status = JobStatus.MATCHING;
        await job.save();

        const workers = await MatchingEngine.findBestWorkers(
            job.location.coordinates[1],
            job.location.coordinates[0],
            job.serviceType
        );

        workers.forEach((worker) => {
            SocketService.emitToUser(worker.user.toString(), SocketService.BROADCAST_JOB_OFFER, {
                jobId: job._id,
                serviceType: job.serviceType,
                price: job.initialQuote
            });
        });

        Logger.info(`Found ${workers.length} workers for job ${jobId}`);
        return workers;
    }

    static async acceptJob(jobId: string, workerId: string) {
        const job = await Job.findOneAndUpdate(
            { _id: jobId, status: JobStatus.MATCHING, worker: { $exists: false } },
            {
                status: JobStatus.ACCEPTED,
                worker: workerId
            },
            { new: true }
        );

        if (!job) {
            throw new AppError('Job not found or already accepted by another worker', 409);
        }

        Logger.info(`Job ${jobId} accepted by worker ${workerId}`);
        return job;
    }

    static async startJob(jobId: string, workerId: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized. You are not the assigned worker.', 403);
        }

        if (job.status !== JobStatus.ACCEPTED) {
            throw new AppError('Job must be accepted before starting', 400);
        }

        job.status = JobStatus.IN_PROGRESS;
        job.startedAt = new Date();
        await job.save();

        Logger.info(`Job ${jobId} started by worker ${workerId}`);
        return job;
    }

    static async requestAmendment(jobId: string, workerId: string, data: { reason: string, proposedAmount: number, evidenceUrl: string }) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized to amend this job', 403);
        }

        job.status = JobStatus.PAUSED_APPROVAL_PENDING;
        job.amendment = {
            reason: data.reason,
            proposedAmount: data.proposedAmount,
            evidenceUrl: data.evidenceUrl,
            status: 'PENDING',
            createdAt: new Date()
        };

        if (job.customer) {
            SocketService.emitToUser(job.customer.toString(), SocketService.NOTIFICATION_SCOPE_CREEP, {
                jobId: job._id,
                reason: data.reason,
                amount: data.proposedAmount
            });
        }

        await job.save();
        return job;
    }

    static async respondToAmendment(jobId: string, customerId: string, approved: boolean) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.customer.toString() !== customerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (!job.amendment || job.amendment.status !== 'PENDING') {
            throw new AppError('No pending amendment', 400);
        }

        if (approved) {
            job.amendment.status = 'APPROVED';
            job.finalQuote = job.amendment.proposedAmount;
            job.status = JobStatus.IN_PROGRESS;
        } else {
            job.amendment.status = 'REJECTED';
            job.status = JobStatus.CANCELLED_CHARGED;
        }

        await job.save();
        return job;
    }

    static async requestJobOtp(jobId: string, workerId: string) {
        const job = await Job.findById(jobId).select('+jobOtp');
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (job.status !== JobStatus.IN_PROGRESS) {
            throw new AppError('Job must be in progress to verify OTP', 400);
        }

        const otp = generateOTP();
        job.jobOtp = otp;
        job.status = JobStatus.OTP_PENDING;
        await job.save();

        SocketService.emitToUser(job.customer.toString(), 'job:otp', {
            jobId: job._id,
            otp
        });

        Logger.info(`OTP generated for job ${jobId}`);
        return { message: 'OTP sent to customer' };
    }

    static async verifyJobOtp(jobId: string, workerId: string, otp: string) {
        const job = await Job.findById(jobId).select('+jobOtp');
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (job.status !== JobStatus.OTP_PENDING) {
            throw new AppError('No OTP pending for this job', 400);
        }

        if (job.jobOtp !== otp) {
            throw new AppError('Invalid OTP', 400);
        }

        job.status = JobStatus.IN_PROGRESS;
        job.otpVerifiedAt = new Date();
        job.workerArrivedAt = new Date();
        job.jobOtp = undefined;
        await job.save();

        Logger.info(`OTP verified for job ${jobId}`);
        return job;
    }

    static async submitEstimate(jobId: string, workerId: string, estimateData: {
        visitCharge: number;
        labourCost: number;
        partsCost: number;
        notes?: string;
    }) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        const totalEstimate = estimateData.visitCharge + estimateData.labourCost + estimateData.partsCost;

        job.estimate = {
            ...estimateData,
            totalEstimate,
            createdAt: new Date()
        };
        job.status = JobStatus.ON_SITE_DIAGNOSIS;
        await job.save();

        SocketService.emitToUser(job.customer.toString(), 'job:estimate', {
            jobId: job._id,
            estimate: job.estimate
        });

        Logger.info(`Estimate submitted for job ${jobId}: ₹${totalEstimate}`);
        return job;
    }

    static async approveFinalPrice(jobId: string, customerId: string, approved: boolean) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.customer.toString() !== customerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (!job.estimate) {
            throw new AppError('No estimate submitted yet', 400);
        }

        if (approved) {
            job.finalQuote = job.estimate.totalEstimate;
            job.status = JobStatus.REPAIR_IN_PROGRESS;
            job.repairStartedAt = new Date();
        } else {
            job.status = JobStatus.CANCELLED;
        }

        await job.save();

        if (job.worker) {
            SocketService.emitToUser(job.worker.toString(), 'job:price-approved', {
                jobId: job._id,
                approved
            });
        }

        Logger.info(`Final price ${approved ? 'approved' : 'rejected'} for job ${jobId}`);
        return job;
    }

    static async addBeforePhoto(jobId: string, workerId: string, photoUrl: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        job.beforePhotos.push(photoUrl);
        await job.save();

        return job;
    }

    static async addAfterPhoto(jobId: string, workerId: string, photoUrl: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        job.afterPhotos.push(photoUrl);
        await job.save();

        return job;
    }

    static async completeJob(jobId: string, workerId: string, proofUrl: string, customerSignature?: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.worker?.toString() !== workerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (job.status !== JobStatus.REPAIR_IN_PROGRESS && job.status !== JobStatus.IN_PROGRESS) {
            throw new AppError('Job is not in a completable state', 400);
        }

        const aiResult = await ServiceFactory.getAIProvider().analyzeImage(proofUrl, 'Does this image show completed repair work?');
        if (!aiResult.valid || aiResult.confidence < 0.7) {
            throw new AppError(`Verification Failed: ${aiResult.reasoning}`, 400);
        }

        job.status = JobStatus.COMPLETED;
        job.completedAt = new Date();
        job.completionProofUrl = proofUrl;
        job.customerSignature = customerSignature;

        const warranty = await WarrantyService.issueWarranty(job);
        job.warrantyId = warranty._id;

        if (job.customer) {
            SocketService.emitToUser(job.customer.toString(), SocketService.NOTIFICATION_WARRANTY, {
                jobId: job._id,
                warranty: true,
                warrantyId: warranty._id
            });
        }

        await job.save();

        Logger.info(`Job ${jobId} completed by worker ${workerId}. Awaiting payment.`);
        return job;
    }

    static async submitDigitalSignature(jobId: string, customerId: string, signatureData: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.customer.toString() !== customerId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        job.customerSignature = signatureData;
        await job.save();

        Logger.info(`Digital signature submitted for job ${jobId}`);
        return job;
    }

    static async processPayment(jobId: string, paymentMethod: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.status !== JobStatus.COMPLETED) {
            throw new AppError('Job must be completed before payment', 400);
        }

        const amount = job.finalQuote || job.initialQuote;

        const payment = await ServiceFactory.getPaymentProvider().createPaymentIntent(
            amount,
            'inr',
            {
                jobId: (job._id as any).toString(),
                paymentMethod,
                description: `Job ${jobId} - ${paymentMethod}`
            }
        );

        job.paymentMethod = paymentMethod as PaymentMethod;
        job.paymentStatus = PaymentStatus.COMPLETED;
        job.transactionId = payment.id;
        await job.save();

        Logger.info(`Payment processed for job ${jobId}: ₹${amount} via ${paymentMethod}`);
        return { job, paymentIntent: payment };
    }

    static async refundJob(jobId: string, reason: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (!job.transactionId) {
            throw new AppError('No transaction to refund', 400);
        }

        const amount = job.finalQuote || job.initialQuote;

        await ServiceFactory.getPaymentProvider().refundPayment(job.transactionId, amount);

        job.paymentStatus = PaymentStatus.REFUNDED;
        job.status = JobStatus.CANCELLED;
        await job.save();

        Logger.info(`Refund processed for job ${jobId}: ₹${amount}. Reason: ${reason}`);
        return job;
    }

    static async getJobHistory(userId: string, role: string) {
        const query = role === 'WORKER' ? { worker: userId } : { customer: userId };
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .populate('customer', 'name email phone avatarUrl')
            .populate('worker', 'name email phone avatarUrl')
            .populate('subService', 'name slug basePrice');
        return jobs;
    }

    static async cancelJob(jobId: string, userId: string) {
        const job = await Job.findById(jobId);
        if (!job) throw new AppError('Job not found', 404);

        if (job.customer.toString() !== userId.toString()) {
            throw new AppError('Not authorized', 403);
        }

        if (job.status !== JobStatus.CREATED && job.status !== JobStatus.MATCHING) {
            throw new AppError('Cannot cancel job in progress. Contact support.', 400);
        }

        job.status = JobStatus.CANCELLED;
        await job.save();

        Logger.info(`Job ${jobId} cancelled by customer ${userId}`);
        return job;
    }

    static async getEstimate(serviceType: string, lat: number, long: number, subServiceId?: string) {
        const distanceKm = 5;
        return PricingEngine.getEstimate(serviceType, distanceKm, subServiceId);
    }
}
