// safe to call without server
import { io } from 'socket.io-client';

// Prefer an explicit socket URL. If not provided, fall back to the API host (without /api) then localhost:4000
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const apiBase = apiUrl.replace(/\/api\/?$/, '');
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBase || 'http://localhost:4000';

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket']
});