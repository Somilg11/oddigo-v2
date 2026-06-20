import { UserPoints, PointTransaction, PointTransactionType, IUserPoints } from '../models/UserPoints';
import { User } from '../models/User';
import { IJob } from '../../jobs/models/Job';
import { Job, JobStatus } from '../../jobs/models/Job';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../config/logger';

const POINTS_PER_RUPEE = 100;

const POINTS_RULES = {
    JOB_COMPLETED_PERCENT: 0.10,    // 10% of job amount (converted to points below)
    FIRST_BOOKING_BONUS: 1000,      // ₹10 value
    REFERRAL_BONUS: 2000,           // ₹20 value
    FIVE_STAR_RATING: 50,           // ₹0.50 value
    POINTS_PER_RUPEE,
};

export class PointsService {

    static async getOrCreatePoints(userId: string): Promise<IUserPoints> {
        let points = await UserPoints.findOne({ user: userId });
        if (!points) {
            points = await UserPoints.create({ user: userId, balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 });
        }
        return points;
    }

    static async getBalance(userId: string) {
        const points = await this.getOrCreatePoints(userId);
        const recentTransactions = await PointTransaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10);
        return { points, recentTransactions };
    }

    static async getHistory(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            PointTransaction.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            PointTransaction.countDocuments({ user: userId })
        ]);
        return { transactions, total, page, limit, pages: Math.ceil(total / limit) };
    }

    static async earnPoints(userId: string, amount: number, type: PointTransactionType, referenceModel: string, referenceId: string, description: string) {
        if (amount <= 0) throw new AppError('Points amount must be positive', 400);

        const points = await this.getOrCreatePoints(userId);

        const session = await UserPoints.startSession();
        session.startTransaction();

        try {
            points.balance += amount;
            points.lifetimeEarned += amount;
            await points.save({ session });

            await PointTransaction.create([{
                user: userId,
                amount,
                type,
                reference: { model: referenceModel, id: referenceId },
                description
            }], { session });

            await session.commitTransaction();
            Logger.info(`Earned ${amount} points for user ${userId}: ${description}`);
            return points;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async redeemPoints(userId: string, amount: number, referenceModel: string, referenceId: string, description: string) {
        if (amount <= 0) throw new AppError('Redemption amount must be positive', 400);

        const points = await this.getOrCreatePoints(userId);
        if (points.balance < amount) {
            throw new AppError(`Insufficient points. You have ${points.balance} points`, 400);
        }

        const session = await UserPoints.startSession();
        session.startTransaction();

        try {
            points.balance -= amount;
            points.lifetimeRedeemed += amount;
            await points.save({ session });

            await PointTransaction.create([{
                user: userId,
                amount: -amount,
                type: PointTransactionType.REDEEMED,
                reference: { model: referenceModel, id: referenceId },
                description
            }], { session });

            await session.commitTransaction();
            Logger.info(`Redeemed ${amount} points for user ${userId}: ${description}`);
            return points;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async awardJobCompletionPoints(job: IJob) {
        const customerId = job.customer.toString();
        const jobAmount = job.finalQuote || job.initialQuote;

        // Earn points: 10% of job amount, converted to points (100 points = ₹1)
        const earnAmount = Math.round(jobAmount * POINTS_RULES.JOB_COMPLETED_PERCENT * POINTS_PER_RUPEE);
        if (earnAmount > 0) {
            await this.earnPoints(
                customerId,
                earnAmount,
                PointTransactionType.EARNED,
                'Job',
                job._id.toString(),
                `Job completed — earned ${earnAmount} points`
            );
        }

        // Check if this is the customer's first completed job (first booking bonus)
        // NOTE: job.save() hasn't happened yet, so DB still shows this job as IN_PROGRESS.
        // A count of 0 means no prior completions — this IS the first booking.
        const completedJobsCount = await Job.countDocuments({
            customer: customerId,
            status: JobStatus.COMPLETED
        });

        if (completedJobsCount === 0) {
            await this.earnPoints(
                customerId,
                POINTS_RULES.FIRST_BOOKING_BONUS,
                PointTransactionType.EARNED,
                'Job',
                job._id.toString(),
                `First booking bonus — ${POINTS_RULES.FIRST_BOOKING_BONUS} points`
            );
        }

        // Award referral bonus to the referrer (only on referee's first completed job)
        if (completedJobsCount === 0) {
            const customer = await User.findById(customerId);
            if (customer?.referredBy) {
                const referrerExists = await UserPoints.findOne({ user: customer.referredBy });
                if (!referrerExists || referrerExists.lifetimeEarned === 0) {
                    // Only award if referrer hasn't received referral bonus yet
                    const alreadyAwarded = await PointTransaction.findOne({
                        user: customer.referredBy,
                        type: PointTransactionType.EARNED,
                        description: { $regex: /^Referral bonus/ }
                    });
                    if (!alreadyAwarded) {
                        await this.earnPoints(
                            customer.referredBy.toString(),
                            POINTS_RULES.REFERRAL_BONUS,
                            PointTransactionType.EARNED,
                            'User',
                            customerId,
                            `Referral bonus — invited a new user who completed their first job`
                        );
                    }
                }
            }
        }

        return { earnAmount, firstBooking: completedJobsCount === 0 };
    }

    static async awardRatingPoints(customerId: string, jobId: string) {
        await this.earnPoints(
            customerId,
            POINTS_RULES.FIVE_STAR_RATING,
            PointTransactionType.EARNED,
            'Job',
            jobId,
            `5-star rating bonus — ${POINTS_RULES.FIVE_STAR_RATING} points`
        );
    }

    static calculatePointsDiscount(availableBalance: number, maxRedeemable: number): number {
        // 100 points = ₹1 discount
        const discountInRupees = Math.floor(availableBalance / 100);
        return Math.min(discountInRupees, maxRedeemable);
    }
}
