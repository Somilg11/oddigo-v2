import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

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
        console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason: string) => {
        console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
        console.error('[Socket] Connection error:', error.message);
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
