import { Warranty } from '../models/Warranty';
import { WarrantyClaim, WarrantyClaimStatus } from '../models/WarrantyClaim';
import { IJob } from '../../jobs/models/Job';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class WarrantyService {

    private static readonly DEFAULT_WARRANTY_DAYS = 7;

    static async issueWarranty(job: IJob) {
        const existing = await Warranty.findOne({ job: job._id });
        if (existing) return existing;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_WARRANTY_DAYS);

        const warranty = await Warranty.create({
            job: job._id,
            expiresAt,
            isActive: true,
            coverageDetails: `Standard ${this.DEFAULT_WARRANTY_DAYS}-day warranty for ${job.serviceType}`
        });

        Logger.info(`Warranty issued for job ${job._id}, expires ${expiresAt}`);
        return warranty;
    }

    static async checkWarrantyStatus(jobId: string) {
        const warranty = await Warranty.findOne({ job: jobId });
        if (!warranty) return { active: false, status: 'NO_WARRANTY' };

        const now = new Date();
        const isActive = warranty.isActive && warranty.expiresAt > now;

        return {
            active: isActive,
            warranty,
            daysRemaining: Math.ceil((warranty.expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24))
        };
    }

    static async fileClaim(customerId: string, jobId: string, data: {
        description: string;
        photos?: string[];
    }) {
        const warranty = await Warranty.findOne({ job: jobId });
        if (!warranty) {
            throw new AppError('No warranty found for this job', 404);
        }

        if (!warranty.isActive || warranty.expiresAt < new Date()) {
            throw new AppError('Warranty has expired', 400);
        }

        const existingClaim = await WarrantyClaim.findOne({
            warranty: warranty._id,
            status: { $in: [WarrantyClaimStatus.PENDING, WarrantyClaimStatus.IN_REVIEW] }
        });

        if (existingClaim) {
            throw new AppError('A claim is already in progress for this warranty', 409);
        }

        const claim = await WarrantyClaim.create({
            warranty: warranty._id,
            job: jobId,
            customer: customerId,
            description: data.description,
            photos: data.photos || [],
            status: WarrantyClaimStatus.PENDING
        });

        Logger.info(`Warranty claim filed for job ${jobId} by customer ${customerId}`);
        return claim;
    }

    static async getClaimStatus(jobId: string) {
        const claim = await WarrantyClaim.findOne({ job: jobId })
            .populate('warranty')
            .populate('customer', 'name email')
            .populate('worker', 'name email');

        if (!claim) {
            const warranty = await Warranty.findOne({ job: jobId });
            return {
                hasWarranty: !!warranty,
                hasClaim: false,
                warranty,
                claim: null
            };
        }

        return {
            hasWarranty: true,
            hasClaim: true,
            claim
        };
    }

    static async resolveClaim(claimId: string, status: WarrantyClaimStatus, adminNotes?: string) {
        const claim = await WarrantyClaim.findById(claimId);
        if (!claim) throw new AppError('Claim not found', 404);

        claim.status = status;
        claim.adminNotes = adminNotes;

        if (status === WarrantyClaimStatus.RESOLVED || status === WarrantyClaimStatus.REJECTED) {
            claim.resolvedAt = new Date();
        }

        await claim.save();

        Logger.info(`Warranty claim ${claimId} resolved: ${status}`);
        return claim;
    }
}
