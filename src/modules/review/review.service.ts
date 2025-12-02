import Review, { IReview } from './review.model';
import Worker from '../worker/worker.model';
import Order from '../order/order.model';
import { AppError } from '../../utils/AppError';

export const createReview = async (userId: string, reviewData: Partial<IReview>) => {
    const order = await Order.findOne({ _id: reviewData.order, user: userId, status: 'COMPLETED' });
    if (!order) {
        throw new AppError('Order not found or not completed', 404);
    }

    const review = await Review.create({
        ...reviewData,
        user: userId,
        worker: order.worker,
    });

    // Update worker rating
    const stats = await Review.aggregate([
        { $match: { worker: order.worker } },
        {
            $group: {
                _id: '$worker',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await Worker.findByIdAndUpdate(order.worker, {
            rating: stats[0].avgRating,
            numReviews: stats[0].nRating,
        });
    } else {
        await Worker.findByIdAndUpdate(order.worker, {
            rating: 0,
            numReviews: 0,
        });
    }

    return review;
};

export const getWorkerReviews = async (workerId: string) => {
    return await Review.find({ worker: workerId }).populate('user', 'name profileImage');
};
