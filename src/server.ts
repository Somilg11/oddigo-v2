import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/database';
// import redis from './config/redis'; // Already initialized on import

const PORT = process.env.PORT || 3000;

// Create HTTP Server
const httpServer = http.createServer(app);

// Initialize Socket.io
export const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

import { SocketService } from './modules/socket/services/socket.service';

SocketService.init(io);

// Start Server
const startServer = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
};

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

startServer();

// Handle Unhandled Rejections
process.on('unhandledRejection', (err: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    httpServer.close(() => {
        process.exit(1);
    });
});
