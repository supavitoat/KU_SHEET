const { prisma } = require('../config/database');
const { getIo } = require('../realtime/socket');

// Helper to shape DB row to API payload
function mapRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    data: row.data ?? null,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

// GET /api/notifications
async function listNotifications(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const cursorId = req.query.cursor ? Number(req.query.cursor) : null;

    let rows;
    if (cursorId) {
      const [cursorRow] = await prisma.$queryRaw`SELECT id, created_at FROM notifications WHERE id = ${cursorId} AND user_id = ${userId} LIMIT 1`;
      if (!cursorRow) {
        rows = await prisma.$queryRaw`SELECT id, user_id, type, title, body, link, data, read_at, created_at FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC LIMIT ${limit}`;
      } else {
        rows = await prisma.$queryRaw`SELECT id, user_id, type, title, body, link, data, read_at, created_at
          FROM notifications
          WHERE user_id = ${userId}
            AND (created_at < ${cursorRow.created_at}
                 OR (created_at = ${cursorRow.created_at} AND id < ${cursorRow.id}))
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit}`;
      }
    } else {
      rows = await prisma.$queryRaw`SELECT id, user_id, type, title, body, link, data, read_at, created_at FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC LIMIT ${limit}`;
    }

    const [unreadCountRow] = await prisma.$queryRaw`SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ${userId} AND read_at IS NULL`;
    const unreadCount = Number(unreadCountRow?.cnt || 0);

    const items = rows.map(mapRow);
    const nextCursor = items.length ? items[items.length - 1].id : null;

    res.json({ success: true, data: { items, unreadCount, nextCursor } });
  } catch (error) {
    console.error('[Notification] list error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

// PATCH /api/notifications/:id/read
async function markRead(req, res) {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    await prisma.$executeRaw`UPDATE notifications SET read_at = NOW() WHERE id = ${id} AND user_id = ${userId} AND read_at IS NULL`;
    const [row] = await prisma.$queryRaw`SELECT id, user_id, type, title, body, link, data, read_at, created_at FROM notifications WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
    if (!row) return res.status(404).json({ success: false, message: 'Notification not found' });

    const [unreadCountRow] = await prisma.$queryRaw`SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ${userId} AND read_at IS NULL`;
    const unreadCount = Number(unreadCountRow?.cnt || 0);

    res.json({ success: true, data: { item: mapRow(row), unreadCount } });
  } catch (error) {
    console.error('[Notification] markRead error', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res) {
  try {
    const userId = req.user.id;
    await prisma.$executeRaw`UPDATE notifications SET read_at = NOW() WHERE user_id = ${userId} AND read_at IS NULL`;
    res.json({ success: true, data: { unreadCount: 0 } });
  } catch (error) {
    console.error('[Notification] markAllRead error', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
}

// Helper to create + emit a notification
async function createAndEmitNotification({ userId, type = 'general', title, body = null, link = null, data = null }) {
  if (!userId || !title) throw new Error('userId and title required');
  const jsonData = data ? JSON.stringify(data) : null;
  const result = await prisma.$executeRaw`INSERT INTO notifications (user_id, type, title, body, link, data, created_at, updated_at) VALUES (${userId}, ${type}, ${title}, ${body}, ${link}, ${jsonData}, NOW(), NOW())`;
  // Fetch inserted row (LAST_INSERT_ID())
  const [row] = await prisma.$queryRaw`SELECT id, user_id, type, title, body, link, data, read_at, created_at FROM notifications WHERE id = LAST_INSERT_ID()`;
  const payload = mapRow(row);
  try {
    const io = getIo();
    if (io) {
      io.to(`user:${userId}`).emit('notify:new', payload);
    }
  } catch {}
  return payload;
}

module.exports = { listNotifications, markRead, markAllRead, createAndEmitNotification };
