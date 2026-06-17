import { Request, Response, NextFunction } from 'express';
import { CityManagerService } from '../services/city-manager.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class CityManagerController {

    static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const dashboard = await CityManagerService.getDashboard(req.user._id);
            res.status(200).json({ success: true, data: dashboard });
        } catch (error) {
            next(error);
        }
    }

    static async getZones(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const zones = await CityManagerService.getZones(req.user._id);
            res.status(200).json({ success: true, results: zones.length, data: zones });
        } catch (error) {
            next(error);
        }
    }

    static async createZone(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const zone = await CityManagerService.createZone(req.user._id, req.body);
            res.status(201).json({ success: true, data: zone });
        } catch (error) {
            next(error);
        }
    }

    static async addCategory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const category = await CityManagerService.addCategory(req.body);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    }

    static async createCampaign(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const campaign = await CityManagerService.createCampaign(req.user._id, req.body);
            res.status(201).json({ success: true, data: campaign });
        } catch (error) {
            next(error);
        }
    }
}
