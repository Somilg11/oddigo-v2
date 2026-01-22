import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../../modules/admin/services/maintenance.service';
import { AppError } from '../errors/AppError';

// Assuming frontend sends a header 'x-app-type': 'USER' | 'WORKER'
// Or we infer from route (e.g., /api/workers can be assumed WORKER app, but shared routes like /api/auth?)
// Better: Headers.

export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Skip for Admin routes
    if (req.originalUrl.startsWith('/api/admin')) {
        return next();
    }

    const appType = req.headers['x-app-type'] as string; // 'USER' or 'WORKER'

    if (appType === 'USER' || appType === 'WORKER') {
        const isMaintenance = await MaintenanceService.isMaintenanceMode(appType);
        if (isMaintenance) {
            return next(new AppError('System is currently under maintenance. Please try again later.', 503));
        }
    }

    // If we want strict implicit checks based on routes:
    // if (req.originalUrl.startsWith('/api/workers') && await check('WORKER')) ...

    next();
};
