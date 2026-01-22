import { Warranty } from '../models/Warranty';
import { IJob } from '../../jobs/models/Job';
import { AppError } from '../../../core/errors/AppError';

export class WarrantyService {

    private static readonly DEFAULT_WARRANTY_DAYS = 7;

    static async issueWarranty(job: IJob) {
        // Check if warranty already exists
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
}
