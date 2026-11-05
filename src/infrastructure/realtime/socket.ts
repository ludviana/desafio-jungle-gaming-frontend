import { io, type Socket } from 'socket.io-client';

let socket: Socket | undefined;

export function getRealtimeSocket(): Socket {
  socket ??= io(window.location.origin, {
    path: '/socket.io/',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    autoConnect: false,
  });
  return socket;
}
