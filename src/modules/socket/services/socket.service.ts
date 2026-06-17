import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../../shared/utils/jwt';
import { User } from '../../users/models/User';
import { WorkerProfile } from '../../workers/models/WorkerProfile';
import { NotificationService } from '../../notifications/services/notification.service';
import redis from '../../../config/redis';
import { Logger } from '../../../config/logger';

export class SocketService {
    private static io: Server;

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
            Logger.info(`Socket connected: ${socket.data.user.id} (${socket.data.user.role})`);

            socket.join(`user:${socket.data.user.id}`);

            socket.on('update-location', async (data: { lat: number, long: number, jobId?: string }) => {
                try {
                    if (socket.data.user.role === 'WORKER') {
                        await redis.geoadd('workers:locations', data.long, data.lat, socket.data.user.id);

                        await WorkerProfile.findOneAndUpdate(
                            { user: socket.data.user.id },
                            {
                                lastLocation: {
                                    type: 'Point',
                                    coordinates: [data.long, data.lat]
                                }
                            }
                        );
                    }

                    if (data.jobId) {
                        socket.to(`job:${data.jobId}`).emit('live-tracking', {
                            userId: socket.data.user.id,
                            lat: data.lat,
                            long: data.long
                        });
                    }
                } catch (error: any) {
                    Logger.error(`Location update error: ${error.message}`);
                }
            });

            socket.on('join-job', (jobId: string) => {
                socket.join(`job:${jobId}`);
                Logger.info(`User ${socket.data.user.id} joined job room: ${jobId}`);
            });

            socket.on('disconnect', () => {
                Logger.info(`Socket disconnected: ${socket.data.user.id}`);
            });
        });
    }

    static async emitToUser(userId: string, event: string, data: any) {
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

    static BROADCAST_JOB_OFFER = 'job:offer';
    static NOTIFICATION_SCOPE_CREEP = 'job:scope-creep-request';
    static NOTIFICATION_WARRANTY = 'job:warranty-issued';
}
