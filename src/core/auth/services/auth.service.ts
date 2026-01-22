import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../../../modules/users/models/User';
import { WorkerProfile } from '../../../modules/workers/models/WorkerProfile';
import { signAccessToken, signRefreshToken } from '../../../shared/utils/jwt';
import { AppError } from '../../errors/AppError';

export class AuthService {

    static async signup(userData: Partial<IUser>, passwordRaw: string) {
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email: userData.email }, { phone: userData.phone }]
        });

        if (existingUser) {
            throw new AppError('User with this email or phone already exists', 409);
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(passwordRaw, 12);

        // Create User
        const newUser = await User.create({
            ...userData,
            password: hashedPassword
        });

        // If Worker, create WorkerProfile
        if (newUser.role === UserRole.WORKER) {
            await WorkerProfile.create({
                user: newUser._id
            });
        }

        // Generate Tokens
        const accessToken = signAccessToken(newUser._id, newUser.role);
        const refreshToken = signRefreshToken(newUser._id);

        // Save Refresh Token (Optimally hash this too, but for now simple storage)
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Return user without password
        const userObj = newUser.toObject();
        delete userObj.password;
        delete userObj.refreshToken;

        return { user: userObj, accessToken, refreshToken };
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
