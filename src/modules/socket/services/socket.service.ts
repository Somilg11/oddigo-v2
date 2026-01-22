import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../../../shared/utils/jwt';
import { User } from '../../users/models/User';
import { NotificationService } from '../../notifications/services/notification.service';

export class SocketService {
    private static io: Server;

    static init(io: Server) {
        this.io = io;

        // Middleware for Auth
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
                if (!token) {
                    return next(new Error('Authentication error: Token required'));
                }

                const cleanToken = token.replace('Bearer ', '');
                const decoded = verifyAccessToken(cleanToken);

                // Attach user to socket
                socket.data.user = { id: decoded.userId, role: decoded.role };
                next();
            } catch (err) {
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`🔌 Auth User Connected: ${socket.data.user.id} (${socket.data.user.role})`);

            // Join their own room
            socket.join(`user:${socket.data.user.id}`);

            // User/Worker Tracking
            socket.on('update-location', async (data: { lat: number, long: number, jobId?: string }) => {
                // 1. Update Redis Geo-Index (if worker) using WorkerService (need to import)
                // For now, let's just broadcast if there is an active job.

                if (data.jobId) {
                    // Notify the *other* party in the job.
                    // Ideally we verify the user is part of the job.
                    // Broadcast to room 'job:{jobId}'
                    socket.to(`job:${data.jobId}`).emit('live-tracking', {
                        userId: socket.data.user.id,
                        ...data
                    });
                }
            });

            // Join Job Room
            socket.on('join-job', (jobId: string) => {
                socket.join(`job:${jobId}`);
                console.log(`User ${socket.data.user.id} joined Job Room: ${jobId}`);
            });

            socket.on('disconnect', () => {
                console.log(`❌ Disconnected: ${socket.data.user.id}`);
            });
        });
    }

    static async emitToUser(userId: string, event: string, data: any) {
        if (!this.io) return;

        // Persist Notification
        let title = 'New Notification';
        let body = 'You have a new update';

        if (event === this.BROADCAST_JOB_OFFER) {
            title = 'New Job Offer!';
            body = `New ${data.serviceType} job available for $${data.price}`;
        } else if (event === this.NOTIFICATION_SCOPE_CREEP) {
            title = 'Amendment Request';
            body = `Worker requests additional $${data.amount}`;
        } else if (event === this.NOTIFICATION_WARRANTY) {
            title = 'Job Complete';
            body = 'Warranty has been issued for your job';
        }

        await NotificationService.create(userId, event, title, body, data);

        // Emit Real-time
        this.io.to(`user:${userId}`).emit(event, data);
    }

    static BROADCAST_JOB_OFFER = 'job:offer';
    static NOTIFICATION_SCOPE_CREEP = 'job:scope-creep-request';
    static NOTIFICATION_WARRANTY = 'job:warranty-issued';
}
