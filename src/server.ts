import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB, disconnectDB } from './config/database';
import redis from './config/redis';
import { Logger } from './config/logger';

const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

import { SocketService } from './modules/socket/services/socket.service';

SocketService.init(io);

const startServer = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        Logger.info(`Server running on http://localhost:${PORT}`);
    });
};

const gracefulShutdown = async (signal: string) => {
    Logger.info(`${signal} received. Starting graceful shutdown...`);

    httpServer.close(async () => {
        Logger.info('HTTP server closed');

        io.close(() => {
            Logger.info('Socket.IO server closed');
        });

        await disconnectDB();

        try {
            await redis.quit();
            Logger.info('Redis disconnected');
        } catch {
            Logger.warn('Redis disconnect failed (may already be disconnected)');
        }

        Logger.info('Graceful shutdown complete');
        process.exit(0);
    });

    setTimeout(() => {
        Logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    Logger.error(`UNCAUGHT EXCEPTION! Shutting down... ${err.name}: ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (err: unknown) => {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    Logger.error(`UNHANDLED REJECTION! Shutting down... ${message}`);
    gracefulShutdown('unhandledRejection');
});

startServer();
