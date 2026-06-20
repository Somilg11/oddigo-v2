import { User, IUser, IUserAddress } from '../models/User';
import { AppError } from '../../../core/errors/AppError';

const ALLOWED_UPDATE_FIELDS = [
    'name', 'email', 'phone', 'avatarUrl', 'gender', 'dateOfBirth', 'addresses'
] as const;

export class UserService {

    static async getUserById(id: string) {
        const user = await User.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    static async updateProfile(id: string, data: Partial<IUser>) {
        const updates: Record<string, unknown> = {};
        for (const key of ALLOWED_UPDATE_FIELDS) {
            if (data[key] !== undefined) {
                updates[key] = data[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            throw new AppError('No valid fields to update', 400);
        }

        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    static async addAddress(userId: string, address: Partial<IUserAddress>) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        user.addresses = user.addresses || [];

        if (address.isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        if (user.addresses.length === 0) {
            address.isDefault = true;
        }

        user.addresses.push(address as any);
        await user.save();
        return user;
    }

    static async updateAddress(userId: string, addressId: string, data: Partial<IUserAddress>) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        const address = (user.addresses as any)?.id(addressId);
        if (!address) throw new AppError('Address not found', 404);

        if (data.isDefault) {
            user.addresses?.forEach(a => { a.isDefault = false; });
        }

        Object.assign(address, data);
        await user.save();
        return user;
    }

    static async deleteAddress(userId: string, addressId: string) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        const address = (user.addresses as any)?.id(addressId);
        if (!address) throw new AppError('Address not found', 404);

        const wasDefault = address.isDefault;
        address.deleteOne();

        if (wasDefault && user.addresses && user.addresses.length > 0) {
            (user.addresses[0] as any).isDefault = true;
        }

        await user.save();
        return user;
    }

    static async setDefaultAddress(userId: string, addressId: string) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        user.addresses?.forEach(a => { a.isDefault = false; });
        const address = (user.addresses as any)?.id(addressId);
        if (!address) throw new AppError('Address not found', 404);

        address.isDefault = true;
        await user.save();
        return user;
    }
}
