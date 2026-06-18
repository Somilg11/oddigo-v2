import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../../shared/utils/jwt';
import { User } from '../../users/models/User';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { NotificationService } from '../../notifications/services/notification.service';
import { Job } from '../../jobs/models/Job';
import redis from '../../../config/redis';
import { Logger } from '../../../config/logger';

export class SocketService {
    private static io: Server;
    private static WORKER_OFFER_TIMEOUT_MS = 30_000;

    static init(io: Server) {
        this.io = io;

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
                if (!token) {
                    return next(new Error('Authentication error: Token required'));
                }

                const cleanToken = token.replace('Bearer ', '');
                const decoded = verifyAccessToken(cleanToken);

                socket.data.user = { id: decoded.userId, role: decoded.role };
                next();
            } catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            const userId = socket.data.user.id;
            const role = socket.data.user.role;
            Logger.info(`Socket connected: ${userId} (${role})`);

            socket.join(`user:${userId}`);

            socket.on('update-location', async (data: { lat: number, long: number, jobId?: string }) => {
                try {
                    if (role === 'WORKER') {
                        await redis.geoadd('workers:locations', data.long, data.lat, userId);

                        await WorkerProfile.findOneAndUpdate(
                            { user: userId },
                            {
                                lastLocation: {
                                    type: 'Point',
                                    coordinates: [data.long, data.lat]
                                }
                            }
                        );
                    }

                    if (data.jobId) {
                        const job = await Job.findById(data.jobId).select('customer worker');
                        if (job && job.worker?.toString() === userId) {
                            socket.to(`job:${data.jobId}`).emit('live-tracking', {
                                userId,
                                lat: data.lat,
                                long: data.long
                            });
                        }
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    Logger.error(`Location update error: ${message}`);
                }
            });

            socket.on('join-job', async (jobId: string) => {
                try {
                    const job = await Job.findById(jobId).select('customer worker');
                    if (!job) {
                        socket.emit('error', { message: 'Job not found' });
                        return;
                    }

                    const uid = userId;
                    const isCustomer = job.customer?.toString() === uid;
                    const isWorker = job.worker?.toString() === uid;

                    if (isCustomer || isWorker || role === 'ADMIN') {
                        socket.join(`job:${jobId}`);
                        Logger.info(`User ${userId} joined job room: ${jobId}`);
                    } else {
                        Logger.warn(`Unauthorized join-job attempt: user=${userId} jobId=${jobId}`);
                        socket.emit('error', { message: 'Not authorized to join this job' });
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    Logger.error(`join-job error: ${message}`);
                }
            });

            socket.on('disconnect', () => {
                Logger.info(`Socket disconnected: ${userId}`);
            });
        });
    }

    static async emitToUser(userId: string, event: string, data: Record<string, unknown>) {
        if (!this.io) return;

        let title = 'New Notification';
        let body = 'You have a new update';

        if (event === this.BROADCAST_JOB_OFFER) {
            title = 'New Job Offer!';
            body = `New ${data.serviceType} job available for ₹${data.price}`;
        } else if (event === this.NOTIFICATION_SCOPE_CREEP) {
            title = 'Amendment Request';
            body = `Worker requests additional ₹${data.amount}`;
        } else if (event === this.NOTIFICATION_WARRANTY) {
            title = 'Job Complete';
            body = 'Warranty has been issued for your job';
        }

        await NotificationService.create(userId, event, title, body, data);

        this.io.to(`user:${userId}`).emit(event, data);
    }

    static async emitToUserWithTimeout(
        userId: string,
        event: string,
        data: Record<string, unknown>,
        timeoutMs: number = this.WORKER_OFFER_TIMEOUT_MS
    ): Promise<boolean> {
        if (!this.io) return false;

        await NotificationService.create(userId, event, 'New Job Offer!', 'You have a pending job offer', data);

        const socketId = Array.from(this.io.sockets.sockets.keys()).find(
            (id) => this.io.sockets.sockets.get(id)?.data.user?.id === userId
        );

        if (!socketId) return false;

        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) return false;

        return new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
                socket.removeAllListeners('job:offer-response');
                socket.disconnect(true);
                resolve(false);
            }, timeoutMs);

            socket.on('job:offer-response', (response: { accepted: boolean }) => {
                clearTimeout(timeout);
                socket.removeAllListeners('job:offer-response');
                resolve(response.accepted);
            });

            this.io!.to(`user:${userId}`).emit(event, data);
        });
    }

    static BROADCAST_JOB_OFFER = 'job:offer';
    static NOTIFICATION_SCOPE_CREEP = 'job:scope-creep-request';
    static NOTIFICATION_WARRANTY = 'job:warranty-issued';
}
