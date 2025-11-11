const { Server } = require('socket.io');
const { env } = require('../config/env');

let io;

const getUserRoom = (userId) => `user:${userId}`;
const getRoleRoom = (role) => `role:${role}`;
const getPropertyRoom = (propertyId) => `property:${propertyId}`;

function initSocketServer(httpServer, sessionMiddleware) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins.length ? env.corsOrigins : '*',
      credentials: true,
    },
  });

  io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

  io.use((socket, next) => {
    const user = socket.request.session?.user;
    if (!user) {
      return next(new Error('Unauthorized'));
    }
    socket.data.user = user;
    return next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(getUserRoom(user.id));
    socket.join(getRoleRoom(user.role));

    socket.emit('realtime:connected', {
      userId: user.id,
      role: user.role,
    });

    socket.on('subscribe:property', ({ propertyId }) => {
      const id = Number(propertyId);
      if (Number.isFinite(id) && id > 0) {
        socket.join(getPropertyRoom(id));
        socket.emit('property:subscribed', { propertyId: id });
      }
    });

    socket.on('unsubscribe:property', ({ propertyId }) => {
      const id = Number(propertyId);
      if (Number.isFinite(id) && id > 0) {
        socket.leave(getPropertyRoom(id));
        socket.emit('property:unsubscribed', { propertyId: id });
      }
    });
  });
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(getUserRoom(userId)).emit(event, payload);
}

function emitToRole(role, event, payload) {
  if (!io) return;
  io.to(getRoleRoom(role)).emit(event, payload);
}

function emitToProperty(propertyId, event, payload) {
  if (!io) return;
  io.to(getPropertyRoom(propertyId)).emit(event, payload);
}

async function closeSocketServer() {
  if (io) {
    await io.close();
    io = null;
  }
}

module.exports = {
  initSocketServer,
  closeSocketServer,
  emitToUser,
  emitToRole,
  emitToProperty,
};
