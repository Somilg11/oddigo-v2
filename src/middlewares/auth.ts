import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import User from '../modules/user/user.model';
import Worker from '../modules/worker/worker.model';
import Admin from '../modules/admin/admin.model';

interface JwtPayload {
    id: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: any; // Can be User, Worker, or Admin document
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        let currentUser;
        if (decoded.role === 'admin' || decoded.role === 'superadmin') {
            currentUser = await Admin.findById(decoded.id);
        } else if (decoded.role === 'worker') {
            currentUser = await Worker.findById(decoded.id);
        } else {
            currentUser = await User.findById(decoded.id);
        }

        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        req.user = currentUser;
        next();
    } catch (error) {
        return next(new AppError('Not authorized to access this route', 401));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Check if user role is included in allowed roles
        // Note: Worker model doesn't have a 'role' field explicitly set to 'worker' in schema default, 
        // but we can infer or add it. For now, let's assume req.user has the correct context.
        // We might need to standardize the 'role' property across all models or handle it here.

        let userRole = 'user';
        if (req.user.role) {
            userRole = req.user.role;
        } else if (req.user.serviceType) {
            // Workers have serviceType, assuming they are workers if this exists and no role field
            userRole = 'worker';
        }

        if (!roles.includes(userRole)) {
            return next(
                new AppError(`User role ${userRole} is not authorized to access this route`, 403)
            );
        }
        next();
    };
};
