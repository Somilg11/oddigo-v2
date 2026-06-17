import { Request, Response, NextFunction } from 'express';
import { ServiceCategory } from '../models/ServiceCategory';
import { SubService } from '../models/SubService';
import { AppError } from '../../../core/errors/AppError';

export class ServiceController {

    static async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await ServiceCategory.find({ isActive: true })
                .sort({ sortOrder: 1, name: 1 });

            res.status(200).json({
                success: true,
                results: categories.length,
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSubServices(req: Request, res: Response, next: NextFunction) {
        try {
            const { categoryId } = req.query;

            const filter: any = { isActive: true };
            if (categoryId) {
                filter.category = categoryId;
            }

            const subServices = await SubService.find(filter)
                .populate('category', 'name slug icon')
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                results: subServices.length,
                data: subServices
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSubServiceById(req: Request, res: Response, next: NextFunction) {
        try {
            const subService = await SubService.findById(req.params.id)
                .populate('category', 'name slug icon');

            if (!subService) {
                throw new AppError('Sub-service not found', 404);
            }

            res.status(200).json({
                success: true,
                data: subService
            });
        } catch (error) {
            next(error);
        }
    }
}
