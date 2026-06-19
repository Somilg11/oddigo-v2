import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (socket && socket.connected) return socket;

    socket = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        logger.info('[Socket] Connected');
    });

    socket.on('disconnect', (reason: string) => {
        logger.warn('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
        logger.error('[Socket] Connection error:', error.message);
    });

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function getSocketInstance(): Socket | null {
    return socket;
}
