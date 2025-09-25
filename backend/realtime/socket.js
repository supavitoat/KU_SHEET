const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { withPrismaRetry } = require('../utils/prismaRetry');

let ioInstance = null;

function initSocket(server, allowedOrigins = []) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true }
  });
  ioInstance = io;

  // JWT auth on handshake
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token || null;
      const authHeader = socket.handshake.headers?.authorization || '';
      if (!token && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.id;
      if (!userId) return next(new Error('Unauthorized'));
      socket.userId = userId;
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
  // Join personal user room for notifications
  try { socket.join(`user:${socket.userId}`); } catch {}
    // Join a group room after membership check
    socket.on('chat:join', async ({ groupId }, cb) => {
      try {
        groupId = Number(groupId);
        if (!groupId) throw new Error('Invalid groupId');
        const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: socket.userId } } }));
        if (!membership) throw new Error('Forbidden');
        await socket.join(`group:${groupId}`);
        cb && cb({ ok: true });
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });

    socket.on('chat:leave', async ({ groupId }) => {
      try { await socket.leave(`group:${Number(groupId)}`); } catch {}
    });

    socket.on('chat:typing', ({ groupId, typing }) => {
      const room = `group:${Number(groupId)}`;
      socket.to(room).emit('chat:typing', { userId: socket.userId, typing: !!typing });
    });

    // Send message via socket (DB write + broadcast)
    socket.on('chat:send', async ({ groupId, content, messageType = 'text' }, cb) => {
      try {
        groupId = Number(groupId);
        if (!groupId) throw new Error('Invalid groupId');
        if (typeof content !== 'string' || !content.trim()) throw new Error('Content required');
        if (!['text', 'image', 'file'].includes(messageType)) messageType = 'text';

        const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: socket.userId } } }));
        if (!membership) throw new Error('Forbidden');

        let chat = await withPrismaRetry(() => prisma.chat.findUnique({ where: { groupId } }));
        if (!chat) {
          try { chat = await withPrismaRetry(() => prisma.chat.create({ data: { groupId } })); }
          catch { chat = await withPrismaRetry(() => prisma.chat.findUnique({ where: { groupId } })); }
        }

        const message = await withPrismaRetry(() => prisma.chatMessage.create({
          data: { chatId: chat.id, userId: socket.userId, content: content.trim().slice(0, 2000), messageType },
          include: { user: { select: { id: true, fullName: true, picture: true } } }
        }));

        const payload = { id: message.id, chatId: message.chatId, user: message.user, content: message.content, messageType: message.messageType, createdAt: message.createdAt };
        io.to(`group:${groupId}`).emit('chat:message', payload);
        cb && cb({ ok: true, data: payload });
      } catch (e) {
        cb && cb({ ok: false, error: e.message });
      }
    });
  });

  return io;
}

function emitGroupMessage(groupId, messagePayload) {
  if (!ioInstance) return;
  ioInstance.to(`group:${Number(groupId)}`).emit('chat:message', messagePayload);
}

function emitUserNotification(userId, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${Number(userId)}`).emit('notify:new', payload);
}

function getIo() { return ioInstance; }

module.exports = { initSocket, emitGroupMessage, emitUserNotification, getIo };
