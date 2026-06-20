import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { PointsService } from '../services/points.service';
import { PointTransaction } from '../models/UserPoints';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';
import { User } from '../models/User';
import { AppError } from '../../../core/errors/AppError';

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

    static async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await UserService.updateAddress(req.user._id, req.params.id, req.body);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await UserService.setDefaultAddress(req.user._id, req.params.id);
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async getPoints(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await PointsService.getBalance(req.user._id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getPointsHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const data = await PointsService.getHistory(req.user._id, page, limit);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getReferralInfo(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await User.findById(req.user._id).select('referralCode');
            if (!user) throw new AppError('User not found', 404);

            const referredUsers = await User.find({ referredBy: req.user._id })
                .select('name email createdAt')
                .sort({ createdAt: -1 });

            const referredUserIds = referredUsers.map(u => u._id);

            const referralBonuses = await PointTransaction.aggregate([
                {
                    $match: {
                        user: { $in: referredUserIds },
                        description: { $regex: /^Referral bonus/ }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const totalPointsEarnedFromReferrals = referralBonuses.length > 0
                ? referralBonuses[0].total
                : 0;

            res.status(200).json({
                success: true,
                data: {
                    referralCode: user.referralCode,
                    totalReferred: referredUsers.length,
                    totalPointsEarnedFromReferrals,
                    referredUsers
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async lookupReferralCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.params;
            if (!code) throw new AppError('Referral code is required', 400);

            const referrer = await User.findOne({ referralCode: code.toUpperCase() })
                .select('name');
            if (!referrer) throw new AppError('Invalid referral code', 404);

            res.status(200).json({
                success: true,
                data: {
                    valid: true,
                    referrerName: referrer.name,
                    message: `Referred by ${referrer.name}`
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
