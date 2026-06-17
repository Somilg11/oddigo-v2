import { WorkerKYC, KYCDocumentType, KYCStatus } from '../models/WorkerKYC';
import { WorkerProfile } from '../models/WorkerProfile';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

export class KYCService {

    static async uploadDocument(workerId: string, data: {
        documentType: KYCDocumentType;
        documentUrl: string;
        documentNumber?: string;
    }) {
        const existing = await WorkerKYC.findOne({
            worker: workerId,
            documentType: data.documentType,
            status: { $in: [KYCStatus.SUBMITTED, KYCStatus.PENDING] }
        });

        if (existing) {
            existing.documentUrl = data.documentUrl;
            existing.documentNumber = data.documentNumber;
            existing.status = KYCStatus.SUBMITTED;
            await existing.save();
            Logger.info(`KYC document updated: ${data.documentType} for worker ${workerId}`);
            return existing;
        }

        const kyc = await WorkerKYC.create({
            worker: workerId,
            ...data,
            status: KYCStatus.SUBMITTED
        });

        Logger.info(`KYC document uploaded: ${data.documentType} for worker ${workerId}`);
        return kyc;
    }

    static async getWorkerKYC(workerId: string) {
        const documents = await WorkerKYC.find({ worker: workerId })
            .sort({ createdAt: -1 });

        const profile = await WorkerProfile.findOne({ user: workerId });

        return {
            documents,
            verificationStatus: profile?.verificationStatus || 'PENDING'
        };
    }

    static async verifyDocument(documentId: string, adminId: string, status: KYCStatus, rejectionReason?: string) {
        const kyc = await WorkerKYC.findById(documentId);
        if (!kyc) throw new AppError('KYC document not found', 404);

        kyc.status = status;
        kyc.verifiedBy = adminId as any;
        kyc.verifiedAt = new Date();

        if (status === KYCStatus.REJECTED && rejectionReason) {
            kyc.rejectionReason = rejectionReason;
        }

        await kyc.save();

        await this.checkAndUpdateVerificationStatus(kyc.worker.toString());

        Logger.info(`KYC document ${documentId} ${status} by admin ${adminId}`);
        return kyc;
    }

    static async getPendingVerifications(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [documents, total] = await Promise.all([
            WorkerKYC.find({ status: KYCStatus.SUBMITTED })
                .populate('worker', 'name email phone')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),
            WorkerKYC.countDocuments({ status: KYCStatus.SUBMITTED })
        ]);

        return {
            documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async bulkVerify(documentIds: string[], adminId: string, status: KYCStatus) {
        const results = await Promise.all(
            documentIds.map(id => this.verifyDocument(id, adminId, status))
        );

        Logger.info(`Bulk KYC verification: ${results.length} documents ${status}`);
        return results;
    }

    private static async checkAndUpdateVerificationStatus(workerId: string) {
        const requiredDocs = [
            KYCDocumentType.AADHAAR,
            KYCDocumentType.PAN,
            KYCDocumentType.BANK_DETAILS
        ];

        const verifiedDocs = await WorkerKYC.find({
            worker: workerId,
            documentType: { $in: requiredDocs },
            status: KYCStatus.VERIFIED
        });

        const verifiedTypes = verifiedDocs.map(d => d.documentType);
        const allRequired = requiredDocs.every(type => verifiedTypes.includes(type));

        const newStatus = allRequired ? 'VERIFIED' : 'PENDING';

        await WorkerProfile.findOneAndUpdate(
            { user: workerId },
            { verificationStatus: newStatus }
        );

        Logger.info(`Worker ${workerId} verification status: ${newStatus}`);
    }
}
