import { Complaint, ComplaintStatus, ComplaintPriority } from '../models/Complaint';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class ComplaintService {

    static async createComplaint(customerId: string, data: {
        workerId?: string;
        jobId?: string;
        category: string;
        description: string;
        photos?: string[];
    }) {
        const priority = data.category === 'FRAUD' || data.category === 'DAMAGE'
            ? ComplaintPriority.HIGH
            : ComplaintPriority.MEDIUM;

        const complaint = await Complaint.create({
            customer: customerId,
            worker: data.workerId,
            job: data.jobId,
            category: data.category,
            description: data.description,
            photos: data.photos || [],
            priority
        });

        Logger.info(`Complaint created: ${complaint._id} by customer ${customerId}`);
        return complaint;
    }

    static async getCustomerComplaints(customerId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [complaints, total] = await Promise.all([
            Complaint.find({ customer: customerId })
                .populate('worker', 'name phone')
                .populate('job', 'serviceType status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Complaint.countDocuments({ customer: customerId })
        ]);

        return {
            complaints,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
}
