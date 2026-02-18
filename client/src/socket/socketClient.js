import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize socket with auth payload
 * @param {{ anonId: string, username: string, roomId: string }} auth
 */
export function initSocket(auth) {
  if (socket) socket.disconnect();

  socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
    withCredentials: true,
    auth,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
