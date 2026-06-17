import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../../../modules/users/models/User';
import { AppError } from '../../errors/AppError';
import { signAccessToken, signRefreshToken } from '../../../shared/utils/jwt';
import ServiceFactory from '../../services/service.factory';
import { Logger } from '../../../config/logger';

export class AuthController {

    static async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, phone, password, role } = req.body;
            const result = await AuthService.signup({ name, email, phone, role }, password);
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async requestOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) {
                throw new AppError('Email is required', 400);
            }

            const user = await User.findOne({ email });
            if (!user) {
                throw new AppError('No account found with this email', 404);
            }

            const otpProvider = ServiceFactory.getOTPProvider();
            const otp = otpProvider.generate();
            await otpProvider.send(email, otp);

            Logger.info(`OTP requested for ${email}`);

            res.status(200).json({
                success: true,
                message: 'OTP sent to your email'
            });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                throw new AppError('Email and OTP code are required', 400);
            }

            const user = await User.findOne({ email });
            if (!user) {
                throw new AppError('No account found with this email', 404);
            }

            const otpProvider = ServiceFactory.getOTPProvider();
            await otpProvider.verify(email, code);

            const accessToken = signAccessToken(user._id, user.role);
            const refreshToken = signRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            const userObj = user.toObject();
            delete (userObj as any).password;
            delete userObj.refreshToken;

            Logger.info(`OTP verified for ${email}`);

            res.status(200).json({
                success: true,
                data: {
                    user: userObj,
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
