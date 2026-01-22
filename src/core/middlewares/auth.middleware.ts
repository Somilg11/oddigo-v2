import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../shared/utils/jwt';
import { AppError } from '../errors/AppError';
import { User } from '../../modules/users/models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const decoded = verifyAccessToken(token);

        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        req.user = currentUser;
        next();
    } catch (error) {
        return next(new AppError('Invalid Token', 401));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
