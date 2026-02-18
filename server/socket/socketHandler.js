const Message = require('../models/Message');

const typingUsers = {}; // roomId -> Set of usernames

module.exports = (io) => {
  io.on('connection', (socket) => {
    const { anonId, username, roomId } = socket.handshake.auth;

    if (!anonId || !username || !roomId) {
      socket.disconnect(true);
      return;
    }

    // Join room
    socket.join(roomId);
    socket.to(roomId).emit('user:joined', { username });

    // Receive & broadcast encrypted message, persist ciphertext
    socket.on('message:send', async ({ ciphertext, iv }) => {
      if (!ciphertext || !iv) return;

      try {
        const saved = await Message.create({ roomId, anonId, username, ciphertext, iv });
        io.to(roomId).emit('message:receive', {
          _id: saved._id,
          username,
          ciphertext,
          iv,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Message delivery failed' });
      }
    });

    // Typing indicators
    socket.on('typing:start', () => {
      if (!typingUsers[roomId]) typingUsers[roomId] = new Set();
      typingUsers[roomId].add(username);
      socket.to(roomId).emit('typing:update', { typingUsers: [...typingUsers[roomId]] });
    });

    socket.on('typing:stop', () => {
      typingUsers[roomId]?.delete(username);
      socket.to(roomId).emit('typing:update', { typingUsers: [...(typingUsers[roomId] || [])] });
    });

    // Disconnect
    socket.on('disconnect', () => {
      typingUsers[roomId]?.delete(username);
      socket.to(roomId).emit('user:left', { username });
      socket.to(roomId).emit('typing:update', { typingUsers: [...(typingUsers[roomId] || [])] });
    });
  });
};
