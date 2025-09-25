const { prisma } = require('../config/database');
const { withPrismaRetry } = require('../utils/prismaRetry');
const { sanitizePagination } = require('../utils/validation');
const jwt = require('jsonwebtoken');
const { register: sseRegister, broadcast: sseBroadcast, ping: ssePing } = require('../utils/sseHub');
const { emitGroupMessage } = require('../realtime/socket');

// Small helpers
const toInt = (v, d = 0) => {
  const n = parseInt(v, 10); return Number.isFinite(n) ? n : d;
};

// Get or create chat for a group
const getOrCreateChat = async (req, res) => {
  try {
    const groupId = toInt(req.params.id);
    const userId = req.user?.id;

    if (!groupId || groupId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid group id' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is a member of the group
    const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }));

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only group members can access chat' });
    }

    // Get or create chat, include last 200 messages to protect payload size
    let chat = await withPrismaRetry(() => prisma.chat.findUnique({
      where: { groupId },
      include: {
        messages: {
          include: { user: { select: { id: true, fullName: true, picture: true } } },
          orderBy: { createdAt: 'asc' },
          take: 200
        }
      }
    }));

    if (!chat) {
      try {
        chat = await withPrismaRetry(() => prisma.chat.create({
          data: { groupId },
          include: {
            messages: {
              include: { user: { select: { id: true, fullName: true, picture: true } } },
              orderBy: { createdAt: 'asc' },
              take: 200
            }
          }
        }));
      } catch (err) {
        // Handle race condition on create (unique constraint)
        console.warn('[Chat] Race creating chat, fetching existing', { groupId, err: err.code || err.message });
        chat = await withPrismaRetry(() => prisma.chat.findUnique({
          where: { groupId },
          include: {
            messages: {
              include: { user: { select: { id: true, fullName: true, picture: true } } },
              orderBy: { createdAt: 'asc' },
              take: 200
            }
          }
        }));
      }
    }

    return res.json({ success: true, data: chat });
  } catch (error) {
    console.error('[Chat] getOrCreateChat error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const groupId = toInt(req.params.id);
    const userId = req.user?.id;
    let { content, messageType = 'text' } = req.body || {};

    if (!groupId || groupId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid group id' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }
    content = content.trim();
    if (content.length > 2000) {
      content = content.slice(0, 2000);
    }

    const allowedTypes = new Set(['text', 'image', 'file']);
    if (!allowedTypes.has(messageType)) messageType = 'text';

    // Check if user is a member of the group
    const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }));
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only group members can send messages' });
    }

    // Get or create chat (with race handling)
    let chat = await withPrismaRetry(() => prisma.chat.findUnique({ where: { groupId } }));
    if (!chat) {
      try {
        chat = await withPrismaRetry(() => prisma.chat.create({ data: { groupId } }));
      } catch (err) {
        console.warn('[Chat] Race creating chat in sendMessage, fetching existing', { groupId, err: err.code || err.message });
        chat = await withPrismaRetry(() => prisma.chat.findUnique({ where: { groupId } }));
      }
    }

    // Create message
    const message = await withPrismaRetry(() => prisma.chatMessage.create({
      data: { chatId: chat.id, userId, content, messageType },
      include: { user: { select: { id: true, fullName: true, picture: true } } }
    }));

    // Broadcast to SSE subscribers of this group
    try {
      sseBroadcast(groupId, 'message', {
        id: message.id,
        chatId: message.chatId,
        user: message.user,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
      });
    } catch (e) {
      console.warn('[Chat] SSE broadcast failed', e?.message);
    }

    // Emit over Socket.IO room as well (if initialized)
    try {
      emitGroupMessage(groupId, {
        id: message.id,
        chatId: message.chatId,
        user: message.user,
        content: message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
      });
    } catch {}

    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[Chat] sendMessage error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get messages for a group
const getMessages = async (req, res) => {
  try {
    const groupId = toInt(req.params.id);
    const userId = req.user?.id;
    const { page, limit } = req.query || {};

    if (!groupId || groupId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid group id' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { page: pageNum, limit: limitNum, skip } = sanitizePagination(page, limit || 50, { maxLimit: 100 });

    // Check if user is a member of the group
    const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }));
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only group members can access messages' });
    }

    // Get chat
    const chat = await withPrismaRetry(() => prisma.chat.findUnique({ where: { groupId } }));
    if (!chat) {
      return res.json({ success: true, data: { messages: [], pagination: { currentPage: 1, totalPages: 0, totalCount: 0 } } });
    }

    const [totalCount, messages] = await Promise.all([
      withPrismaRetry(() => prisma.chatMessage.count({ where: { chatId: chat.id } })),
      withPrismaRetry(() => prisma.chatMessage.findMany({
        where: { chatId: chat.id },
        include: { user: { select: { id: true, fullName: true, picture: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }))
    ]);

    return res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to oldest-first
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('[Chat] getMessages error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SSE stream for group chat
const streamGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isFinite(groupId) || groupId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid group id' });
    }

  // Authenticate by Authorization: Bearer <token> or query ?token=
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) token = req.query?.token || null;
    if (!token) return res.status(401).end();

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded?.id;
    } catch {
      return res.status(401).end();
    }
    if (!userId) return res.status(401).end();

    // Ensure membership
    const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    }));
    if (!membership) return res.status(403).end();

    // Set headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Register and clean up on close
    const unregister = sseRegister(groupId, res);
    req.on('close', () => {
      unregister();
      try { res.end(); } catch {}
    });

    // Send hello + heartbeat pings
    res.write(`event: hello\ndata: {\"groupId\":${groupId}}\n\n`);
    const interval = setInterval(() => { ssePing(groupId); }, 25000);
    req.on('close', () => clearInterval(interval));
  } catch (error) {
    console.error('[Chat] streamGroup error', { message: error.message });
    try { res.end(); } catch {}
  }
};

module.exports = {
  getOrCreateChat,
  sendMessage,
  getMessages,
  streamGroup
};
