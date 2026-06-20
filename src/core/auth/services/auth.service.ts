import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../../../modules/users/models/User';
import { WorkerProfile } from '../../../modules/workers/models/WorkerProfile';
import { PointsService } from '../../../modules/users/services/points.service';
import { PointTransactionType } from '../../../modules/users/models/UserPoints';
import { signAccessToken, signRefreshToken } from '../../../shared/utils/jwt';
import { AppError } from '../../errors/AppError';

const REFERRAL_BONUS = 2000;

function generateReferralCode(name: string): string {
    const slug = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
        rand += chars[crypto.randomInt(chars.length)];
    }
    return `${slug}${rand}`;
}

export class AuthService {

    static async signup(userData: Partial<IUser>, passwordRaw: string, serviceType?: string, hourlyRate?: number, referralCode?: string) {
        const existingUser = await User.findOne({
            $or: [{ email: userData.email }, { phone: userData.phone }]
        });

        if (existingUser) {
            throw new AppError('User with this email or phone already exists', 409);
        }

        // Validate referral code if provided
        let referrerId: string | undefined;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
            if (!referrer) throw new AppError('Invalid referral code', 400);
            referrerId = referrer._id.toString();
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 12);

        // Generate a unique referral code for the new user
        let newReferralCode = generateReferralCode(userData.name || 'USER');
        let attempts = 0;
        while (attempts < 5) {
            const exists = await User.findOne({ referralCode: newReferralCode });
            if (!exists) break;
            newReferralCode = generateReferralCode(userData.name || 'USER');
            attempts++;
        }

        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            referralCode: newReferralCode,
            ...(referrerId ? { referredBy: referrerId } : {}),
        });

        if (newUser.role === UserRole.WORKER) {
            await WorkerProfile.create({
                user: newUser._id,
                skills: serviceType ? [serviceType] : [],
            });
        }

        // Immediately award referrer their signup referral bonus
        if (referrerId) {
            await PointsService.earnPoints(
                referrerId,
                REFERRAL_BONUS,
                PointTransactionType.EARNED,
                'User',
                newUser._id.toString(),
                `Referral bonus — invited ${newUser.name}`
            );
        }

        const accessToken = signAccessToken(newUser._id, newUser.role);
        const refreshToken = signRefreshToken(newUser._id);

        newUser.refreshToken = refreshToken;
        await newUser.save();

        const userObj = newUser.toObject();
        delete userObj.password;
        delete userObj.refreshToken;

        return { user: userObj, accessToken, refreshToken };
    }

    static async backfillReferralCodes(): Promise<number> {
        const usersWithoutCodes = await User.find({ referralCode: { $exists: false } });
        let updated = 0;

        for (const user of usersWithoutCodes) {
            let code = generateReferralCode(user.name || 'USER');
            let attempts = 0;
            while (attempts < 5) {
                const exists = await User.findOne({ referralCode: code });
                if (!exists) break;
                code = generateReferralCode(user.name || 'USER');
                attempts++;
            }
            user.referralCode = code;
            await user.save();
            updated++;
        }

        return updated;
    }

    static async login(email: string, passwordRaw: string) {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await bcrypt.compare(passwordRaw, user.password || ''))) {
            throw new AppError('Invalid credentials', 401);
        }

        if (user.isActive === false) {
            throw new AppError('Account is deactivated. Contact admin.', 403);
        }

        const accessToken = signAccessToken(user._id, user.role);
        const refreshToken = signRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshToken;

        return { user: userObj, accessToken, refreshToken };
    }
}
