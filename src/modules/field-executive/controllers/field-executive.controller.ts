import { Request, Response, NextFunction } from 'express';
import { FieldExecutiveService } from '../services/field-executive.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class FieldExecutiveController {

    static async getWorkers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await FieldExecutiveService.getAssignedWorkers(req.user._id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getWorkerStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await FieldExecutiveService.getWorkerStatus(req.user._id, req.params.id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async logVisit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const visit = await FieldExecutiveService.logFieldVisit(req.user._id, req.params.id, req.body);
            res.status(201).json({ success: true, data: visit });
        } catch (error) {
            next(error);
        }
    }

    static async getQualityAudits(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { page, limit } = req.query;
            const result = await FieldExecutiveService.getQualityAudits(
                req.user._id,
                parseInt(page as string) || 1,
                parseInt(limit as string) || 20
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async submitQualityAudit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const audit = await FieldExecutiveService.submitQualityAudit(req.user._id, req.params.jobId, req.body);
            res.status(201).json({ success: true, data: audit });
        } catch (error) {
            next(error);
        }
    }
}
