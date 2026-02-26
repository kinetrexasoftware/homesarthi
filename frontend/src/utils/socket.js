import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket?.connected) {
    return socket;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found, cannot initialize socket');
    return null;
  }

  const socketURL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;

  socket = io(socketURL, {
    transports: ['polling', 'websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
    secure: true // Always use secure for wss
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (userId) {
      socket.emit('user_online', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?._id;
    if (userId) {
      return initSocket(userId);
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
