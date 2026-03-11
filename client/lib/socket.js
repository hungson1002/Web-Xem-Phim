import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    .replace('/api', '');

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
