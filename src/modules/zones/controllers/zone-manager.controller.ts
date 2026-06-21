import { Request, Response, NextFunction } from 'express';
import { ZoneManagerService } from '../services/zone-manager.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class ZoneManagerController {

    static async getZones(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const zones = await ZoneManagerService.getAssignedZones(req.user._id);
            res.status(200).json({ success: true, results: zones.length, data: zones });
        } catch (error) {
            next(error);
        }
    }

    static async getZoneStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const stats = await ZoneManagerService.getZoneStats(req.user._id, req.params.id);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getSupplyDemand(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await ZoneManagerService.getSupplyDemand(req.user._id, req.params.id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async triggerRecruitment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await ZoneManagerService.triggerRecruitment(req.user._id, req.params.id, req.body);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const overview = await ZoneManagerService.getOverview(req.user._id);
            res.status(200).json({ success: true, data: overview });
        } catch (error) {
            next(error);
        }
    }

    static async getFieldExecutives(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const execs = await ZoneManagerService.getFieldExecutives(req.user._id);
            res.status(200).json({ success: true, results: execs.length, data: execs });
        } catch (error) {
            next(error);
        }
    }

    static async assignTask(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const task = await ZoneManagerService.assignTask(req.user._id, req.body);
            res.status(201).json({ success: true, data: task });
        } catch (error) {
            next(error);
        }
    }

    static async getTaskDetails(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const task = await ZoneManagerService.getTaskDetails(req.user._id, req.params.taskId);
            res.status(200).json({ success: true, data: task });
        } catch (error) {
            next(error);
        }
    }
}
