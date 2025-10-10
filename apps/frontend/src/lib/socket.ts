// safe to call without server
import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
  autoConnect: false,
  transports: ['websocket']
});