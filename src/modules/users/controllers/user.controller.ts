import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

export class UserController {

    static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // req.user is set by auth middleware
            res.status(200).json({
                success: true,
                data: req.user
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const updatedUser = await UserService.updateProfile(req.user._id, req.body);
            res.status(200).json({
                success: true,
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    static async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await UserService.addAddress(req.user._id, req.body);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await UserService.deleteAddress(req.user._id, req.params.id);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }
}
