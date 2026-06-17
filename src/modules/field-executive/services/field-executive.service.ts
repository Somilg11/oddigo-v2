import { FieldExecutiveProfile } from '../models/FieldExecutiveProfile';
import { FieldVisit } from '../models/FieldVisit';
import { QualityAudit, AuditStatus } from '../models/QualityAudit';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { Job, JobStatus } from '../../jobs/models/Job';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class FieldExecutiveService {

    static async getAssignedWorkers(executiveId: string) {
        const profile = await FieldExecutiveProfile.findOne({ user: executiveId });
        if (!profile) throw new AppError('Field executive profile not found', 404);

        const workers = await WorkerProfile.find({
            user: { $in: profile.managedWorkers }
        }).populate('user', 'name email phone avatarUrl');

        return {
            zone: profile.assignedZone,
            workers,
            totalWorkers: workers.length
        };
    }

    static async getWorkerStatus(executiveId: string, workerId: string) {
        const profile = await FieldExecutiveProfile.findOne({ user: executiveId });
        if (!profile) throw new AppError('Field executive profile not found', 404);

        if (!profile.managedWorkers.includes(workerId as any)) {
            throw new AppError('Worker not assigned to this field executive', 403);
        }

        const workerProfile = await WorkerProfile.findOne({ user: workerId })
            .populate('user', 'name email phone avatarUrl');

        if (!workerProfile) throw new AppError('Worker profile not found', 404);

        const activeJobs = await Job.countDocuments({
            worker: workerId,
            status: { $in: [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS, JobStatus.OTP_PENDING] }
        });

        const completedJobsToday = await Job.countDocuments({
            worker: workerId,
            status: JobStatus.COMPLETED,
            completedAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        return {
            profile: workerProfile,
            activeJobs,
            completedJobsToday,
            isOnline: workerProfile.isOnline
        };
    }

    static async logFieldVisit(executiveId: string, workerId: string, data: {
        type: 'CHECK_IN' | 'FOLLOW_UP' | 'QUALITY_AUDIT' | 'COMPLAINT_HANDLE';
        notes: string;
        photos?: string[];
        location?: { lat: number; long: number };
    }) {
        const visitData: any = {
            fieldExecutive: executiveId,
            worker: workerId,
            type: data.type,
            notes: data.notes,
            photos: data.photos || []
        };

        if (data.location) {
            visitData.location = {
                type: 'Point',
                coordinates: [data.location.long, data.location.lat]
            };
        }

        const visit = await FieldVisit.create(visitData);

        Logger.info(`Field visit logged by ${executiveId} for worker ${workerId}: ${data.type}`);
        return visit;
    }

    static async getQualityAudits(executiveId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [audits, total] = await Promise.all([
            QualityAudit.find({ fieldExecutive: executiveId })
                .populate('job', 'serviceType status completedAt')
                .populate('worker', 'name phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            QualityAudit.countDocuments({ fieldExecutive: executiveId })
        ]);

        return {
            audits,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async submitQualityAudit(executiveId: string, jobId: string, data: {
        hasBeforePhotos: boolean;
        hasAfterPhotos: boolean;
        invoiceValid: boolean;
        notes?: string;
    }) {
        const existing = await QualityAudit.findOne({ job: jobId });
        if (existing) {
            throw new AppError('Audit already exists for this job', 409);
        }

        const status = data.hasBeforePhotos && data.hasAfterPhotos && data.invoiceValid
            ? AuditStatus.PASSED
            : AuditStatus.FAILED;

        const audit = await QualityAudit.create({
            job: jobId,
            fieldExecutive: executiveId,
            worker: (await Job.findById(jobId))?.worker,
            ...data,
            status,
            notes: data.notes || ''
        });

        Logger.info(`Quality audit for job ${jobId}: ${status}`);
        return audit;
    }
}
