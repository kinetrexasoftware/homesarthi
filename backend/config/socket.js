const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store active users and their socket IDs
const activeUsers = new Map();
const userSockets = new Map();

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected with socket ${socket.id}`);

    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });
    userSockets.set(socket.id, socket.userId);

    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user
    });

    // Handle user going online
    socket.on('user_online', async (userId) => {
      try {
        const user = await User.findById(userId);
        if (user) {
          activeUsers.set(userId, {
            socketId: socket.id,
            user: user,
            connectedAt: new Date()
          });

          // Update user's last seen
          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
            isOnline: true
          });

          // Notify friends/contacts
          socket.broadcast.emit('user_status_change', {
            userId,
            status: 'online',
            lastSeen: new Date()
          });
        }
      } catch (error) {
        console.error('Error handling user online:', error);
      }
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, roomId, content } = data;

        if (!recipientId || !content) {
          socket.emit('message_error', { error: 'Recipient ID and content are required' });
          return;
        }

        // Create message in database
        const message = await Message.create({
          sender: socket.userId,
          content: content.trim(),
          conversation: {
            participants: [socket.userId.toString(), recipientId.toString()].sort(),
            room: roomId || null
          }
        });

        // Populate sender info
        await message.populate('sender', 'name avatar email');
        await message.populate('conversation.room', 'title images');

        // Find recipient's socket connection
        const recipientSocket = activeUsers.get(recipientId.toString());
        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit('receive_message', message);
        }

        // Emit to sender as well for UI consistency
        socket.emit('message_sent', message);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', {
          error: 'Failed to send message'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { recipientId, conversationId } = data;
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('typing_start', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { recipientId, conversationId } = data;
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('typing_stop', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    // Handle room visit notifications
    socket.on('room_visit_request', async (data) => {
      try {
        const { roomId, ownerId, visitDate, message } = data;

        // Find owner's socket
        const ownerSocket = activeUsers.get(ownerId);
        if (ownerSocket) {
          io.to(ownerSocket.socketId).emit('new_visit_request', {
            roomId,
            visitorId: socket.userId,
            visitor: socket.user,
            visitDate,
            message,
            timestamp: new Date()
          });
        }

        // Also emit to visitor for confirmation
        socket.emit('visit_request_sent', {
          roomId,
          ownerId,
          visitDate,
          message
        });

      } catch (error) {
        console.error('Error handling visit request:', error);
        socket.emit('visit_request_error', {
          error: 'Failed to send visit request'
        });
      }
    });

    // Handle visit response
    socket.on('visit_response', async (data) => {
      try {
        const { visitId, visitorId, status, responseMessage } = data;

        // Find visitor's socket
        const visitorSocket = activeUsers.get(visitorId);
        if (visitorSocket) {
          io.to(visitorSocket.socketId).emit('visit_response', {
            visitId,
            status,
            responseMessage,
            respondedBy: socket.userId,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Error handling visit response:', error);
      }
    });

    // Handle room favorite/unfavorite
    socket.on('toggle_favorite', async (data) => {
      try {
        const { roomId, isFavorited } = data;

        // Broadcast to other users who might be viewing the room
        socket.broadcast.emit('room_favorite_updated', {
          roomId,
          userId: socket.userId,
          isFavorited
        });

      } catch (error) {
        console.error('Error handling favorite toggle:', error);
      }
    });

    // Handle join room (for real-time updates)
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    // Join user's personal room for direct messaging
    socket.on('join_user_room', () => {
      socket.join(`user_${socket.userId}`);
      console.log(`User ${socket.userId} joined their personal room`);
    });

    // Handle admin notifications
    socket.on('admin_notification', async (data) => {
      try {
        const { type, targetUsers, message, metadata } = data;

        if (targetUsers === 'all') {
          // Broadcast to all connected users
          io.emit('admin_broadcast', {
            type,
            message,
            metadata,
            timestamp: new Date()
          });
        } else if (Array.isArray(targetUsers)) {
          // Send to specific users
          targetUsers.forEach(userId => {
            const userSocket = activeUsers.get(userId);
            if (userSocket) {
              io.to(userSocket.socketId).emit('admin_notification', {
                type,
                message,
                metadata,
                timestamp: new Date()
              });
            }
          });
        }

      } catch (error) {
        console.error('Error sending admin notification:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);

      // Remove from active users
      activeUsers.delete(socket.userId);
      userSockets.delete(socket.id);

      try {
        // Update user's last seen and online status
        await User.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
          isOnline: false
        });

        // Notify other users
        socket.broadcast.emit('user_status_change', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date()
        });

      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    });

    // Handle custom events (for extensibility)
    socket.on('custom_event', (data) => {
      const { event, payload, targetUsers } = data;

      if (targetUsers === 'all') {
        socket.broadcast.emit(event, payload);
      } else if (Array.isArray(targetUsers)) {
        targetUsers.forEach(userId => {
          const userSocket = activeUsers.get(userId);
          if (userSocket) {
            io.to(userSocket.socketId).emit(event, payload);
          }
        });
      }
    });

  });

  // Store io instance globally for use in controllers
  global.io = io;

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [userId, userData] of activeUsers.entries()) {
      if (now - userData.connectedAt.getTime() > timeout) {
        // User has been inactive, mark as offline
        User.findByIdAndUpdate(userId, {
          lastSeen: new Date(),
          isOnline: false
        }).catch(console.error);

        activeUsers.delete(userId);
      }
    }
  }, 60 * 1000); // Check every minute

  return io;
};

// Utility functions
const getActiveUsers = () => {
  return Array.from(activeUsers.values()).map(({ user }) => user);
};

const getUserSocket = (userId) => {
  return activeUsers.get(userId);
};

const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

const getOnlineUsersCount = () => {
  return activeUsers.size;
};

const emitToUser = (userId, event, data) => {
  const userSocket = activeUsers.get(userId);
  if (userSocket && global.io) {
    global.io.to(userSocket.socketId).emit(event, data);
    return true;
  }
  return false;
};

const emitToRoom = (roomId, event, data) => {
  if (global.io) {
    global.io.to(`room_${roomId}`).emit(event, data);
    return true;
  }
  return false;
};

module.exports = {
  initializeSocket,
  getActiveUsers,
  getUserSocket,
  isUserOnline,
  getOnlineUsersCount,
  emitToUser,
  emitToRoom,
  activeUsers,
  userSockets
};
