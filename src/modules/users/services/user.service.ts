import { User, IUser } from '../models/User';
import { AppError } from '../../../core/errors/AppError';

export class UserService {

    static async getUserById(id: string) {
        const user = await User.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    static async updateProfile(id: string, data: Partial<IUser>) {
        // Prevent role update via this route
        delete data.role;
        delete data.password;

        const user = await User.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }
    static async addAddress(userId: string, address: any) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        user.addresses = user.addresses || [];
        user.addresses.push(address);
        await user.save();
        return user;
    }

    static async deleteAddress(userId: string, addressId: string) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        if (user.addresses) {
            user.addresses = user.addresses.filter((a: any) => (a._id as any).toString() !== addressId);
            await user.save();
        }
        return user;
    }
}
