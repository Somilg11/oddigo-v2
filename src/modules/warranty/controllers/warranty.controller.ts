import { Request, Response, NextFunction } from 'express';
import { WarrantyService } from '../services/warranty.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';
import { WarrantyClaimStatus } from '../models/WarrantyClaim';

export class WarrantyController {

    static async claimWarranty(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { description, photos } = req.body;
            const claim = await WarrantyService.fileClaim(req.user._id, req.params.jobId, {
                description,
                photos
            });
            res.status(201).json({ success: true, data: claim });
        } catch (error) {
            next(error);
        }
    }

    static async getClaimStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const status = await WarrantyService.getClaimStatus(req.params.jobId);
            res.status(200).json({ success: true, data: status });
        } catch (error) {
            next(error);
        }
    }

    static async resolveClaim(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { status, adminNotes } = req.body;
            const claim = await WarrantyService.resolveClaim(req.params.claimId, status, adminNotes);
            res.status(200).json({ success: true, data: claim });
        } catch (error) {
            next(error);
        }
    }
}
