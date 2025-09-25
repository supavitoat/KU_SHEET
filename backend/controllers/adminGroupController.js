const { prisma } = require('../config/database');
const { sanitizePagination } = require('../utils/validation');
const { withPrismaRetry } = require('../utils/prismaRetry');

const ALLOWED_GROUP_STATUSES = new Set(['upcoming','completed','cancelled']);
const MAX_SEARCH_LEN = 100;

// List all study groups with filters + validation + retry + logging
const adminListGroups = async (req, res) => {
  try {
    let { page = 1, limit = 20, status, text } = req.query;
    const { page: pageNum, limit: limitNum, skip } = sanitizePagination(page, limit, { maxLimit: 100 });
    if (status && !ALLOWED_GROUP_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (text) {
      text = String(text).trim();
      if (text.length > MAX_SEARCH_LEN) text = text.slice(0, MAX_SEARCH_LEN);
    }
    const where = {};
    if (status) where.status = status;
    if (text) {
      where.OR = [
        { title: { contains: text } },
        { description: { contains: text } },
        { locationName: { contains: text } },
        { address: { contains: text } },
      ];
    }
    const [totalCount, groups] = await Promise.all([
      withPrismaRetry(()=>prisma.group.count({ where })),
      withPrismaRetry(()=>prisma.group.findMany({
        where,
        include: { organizer: { select: { id: true, fullName: true, email: true, picture: true } } },
        orderBy: { startAt: 'desc' },
        skip,
        take: limitNum,
      }))
    ]);
    const groupIds = groups.map(g => g.id);
    let counts = {};
    let reportCountByGroupId = {};
    if (groupIds.length) {
      const [memberCounts, pendingReports] = await Promise.all([
        withPrismaRetry(()=>prisma.groupMember.groupBy({ by: ['groupId'], where: { groupId: { in: groupIds }, status: 'approved' }, _count: { _all: true } })),
        withPrismaRetry(()=>prisma.report.groupBy({ by: ['groupId'], where: { groupId: { in: groupIds }, status: 'open' }, _count: { _all: true } }))
      ]);
      memberCounts.forEach(r => { counts[r.groupId] = r._count._all; });
      pendingReports.forEach(r => { reportCountByGroupId[r.groupId] = r._count._all; });
    }
    const data = groups.map(g => ({
      ...g,
      approvedCount: counts[g.id] || 0,
      reportCount: reportCountByGroupId[g.id] || 0,
    }));
    res.json({ success: true, data, pagination: { totalCount, page: pageNum, limit: limitNum } });
  } catch (error) {
    console.error('[AdminGroup] adminListGroups failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get a group with members
const adminGetGroupById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
    const group = await withPrismaRetry(()=>prisma.group.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, fullName: true, email: true, picture: true } },
        members: { include: { user: { select: { id: true, fullName: true, email: true, picture: true } } } },
      }
    }));
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, data: group });
  } catch (error) {
    console.error('[AdminGroup] adminGetGroupById failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update status (e.g., cancel)
const adminUpdateGroupStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
    const { status } = req.body;
    if (!ALLOWED_GROUP_STATUSES.has(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const updated = await withPrismaRetry(()=>prisma.group.update({ where: { id }, data: { status } }));
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[AdminGroup] adminUpdateGroupStatus failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a group (force)
const adminDeleteGroup = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid id' });
    const exists = await withPrismaRetry(()=>prisma.group.findUnique({ where: { id }, select: { id: true } }));
    if (!exists) return res.status(404).json({ success: false, message: 'Group not found' });
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.deleteMany({ where: { groupId: id } });
      await tx.group.delete({ where: { id } });
    });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error('[AdminGroup] adminDeleteGroup failed', { message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  adminListGroups,
  adminGetGroupById,
  adminUpdateGroupStatus,
  adminDeleteGroup,
};