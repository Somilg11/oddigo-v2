import User, { IUser } from './user.model';
import Worker from '../worker/worker.model';
import { AppError } from '../../utils/AppError';

export const getUserProfile = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

export const updateUserProfile = async (userId: string, updateData: Partial<IUser>) => {
    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    });
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
};

export const searchWorkers = async (
    query: any,
    coordinates?: [number, number],
    maxDistance: number = 10000 // 10km default
) => {
    let filter: any = { isVerified: true, isAvailable: true };

    if (query.serviceType) {
        filter.serviceType = { $regex: query.serviceType, $options: 'i' };
    }

    if (coordinates) {
        filter.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates,
                },
                $maxDistance: maxDistance,
            },
        };
    }

    const workers = await Worker.find(filter).select('-password -documents');
    return workers;
};
