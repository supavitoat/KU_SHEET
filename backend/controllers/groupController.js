const { prisma } = require('../config/database');
// Removed logger import
const { withPrismaRetry } = require('../utils/prismaRetry');
const { sanitizePagination } = require('../utils/validation');
const { createAndEmitNotification } = require('./notificationController');

// Helpers
const buildGroupsWhereClause = (query) => {
  const { text, mode, faculty, major, subjectCode, dateFrom, dateTo, organizerId, status } = query; // eslint-disable-line no-unused-vars
  const where = {};
  if (text) {
    where.OR = [
      { title: { contains: text } },
      { description: { contains: text } },
      { locationName: { contains: text } },
    ];
  }
  if (organizerId) where.organizerId = Number(organizerId);
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.AND = where.AND || [];
    if (dateFrom) where.AND.push({ startAt: { gte: new Date(dateFrom) } });
    if (dateTo) where.AND.push({ endAt: { lte: new Date(dateTo) } });
  }
  return where;
};

const countApprovedMembers = async (groupId) => withPrismaRetry(() => prisma.groupMember.count({ where: { groupId, status: 'approved' } }));

// Utility id validator
function parseId(raw) { const n = Number(raw); return Number.isInteger(n) && n > 0 ? n : null; }

// Create a study group
async function createGroup(req, res) { try {
  const organizerId = req.user.id;
  const { title, description, locationName, address, latitude, longitude, startAt, endAt, capacity = 10, joinPolicy = 'auto' } = req.body;
  if (!title || !startAt || !endAt) return res.status(400).json({ success: false, message: 'Missing required fields' });
  const data = { title, description: description || null, organizerId, locationName: locationName || null, address: address || null, latitude: latitude !== undefined ? Number(latitude) : null, longitude: longitude !== undefined ? Number(longitude) : null, startAt: new Date(startAt), endAt: new Date(endAt), capacity: Number(capacity), joinPolicy, status: 'upcoming' };
  const created = await withPrismaRetry(() => prisma.$transaction(async (tx) => { const group = await tx.group.create({ data }); await tx.groupMember.create({ data: { groupId: group.id, userId: organizerId, role: 'organizer', status: 'approved' } }); return group; }));
  res.status(201).json({ success: true, data: created });
} catch (error) { console.error('createGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// List groups with filters
async function listGroups(req, res) { try {
  const { sortBy = 'createdAt', order = 'desc', status } = req.query;
  const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { maxLimit: 50 });
  const allowedSort = ['createdAt','startAt','endAt','capacity','title'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
  const where = buildGroupsWhereClause(req.query);
  if (status) { const allowedStatus = ['upcoming','ongoing','completed','cancelled']; if (allowedStatus.includes(String(status))) where.status = String(status); }
  const [totalCount, groups] = await Promise.all([
    withPrismaRetry(() => prisma.group.count({ where })),
    withPrismaRetry(() => prisma.group.findMany({ where, include: { organizer: { select: { id: true, fullName: true, picture: true } }, members: req.user ? { where: { userId: req.user.id }, select: { id: true, status: true, role: true }, take: 1 } : false }, orderBy: { [sortField]: sortDir }, skip, take: limit }))
  ]);
  const groupIds = groups.map(g => g.id);
  let approvedCountsByGroupId = {}, pendingCountsByGroupId = {};
  if (groupIds.length) {
    const [approvedGrouped, pendingGrouped] = await Promise.all([
      withPrismaRetry(() => prisma.groupMember.groupBy({ by: ['groupId'], where: { groupId: { in: groupIds }, status: 'approved' }, _count: { _all: true } })),
      withPrismaRetry(() => prisma.groupMember.groupBy({ by: ['groupId'], where: { groupId: { in: groupIds }, status: 'pending' }, _count: { _all: true } }))
    ]);
    approvedGrouped.forEach(r => { approvedCountsByGroupId[r.groupId] = r._count._all; });
    pendingGrouped.forEach(r => { pendingCountsByGroupId[r.groupId] = r._count._all; });
  }
  const groupsWithCounts = groups.map(g => ({ ...g, approvedCount: approvedCountsByGroupId[g.id] || 0, pendingCount: pendingCountsByGroupId[g.id] || 0 }));
  res.json({ success: true, data: groupsWithCounts, pagination: { currentPage: page, totalPages: Math.ceil(totalCount / limit), totalCount, limit } });
} catch (error) { console.error('listGroups error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Get group details
async function getGroupById(req, res) { try { const id = parseId(req.params.id); if (!id) return res.status(400).json({ success: false, message: 'Invalid id' }); const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id }, include: { organizer: { select: { id: true, fullName: true, picture: true, reputationScore: true, reputationCount: true, noShowCount: true } }, members: { include: { user: { select: { id: true, fullName: true, picture: true, reputationScore: true, reputationCount: true, noShowCount: true } } } } } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); res.json({ success: true, data: group }); } catch (error) { console.error('getGroupById error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Join a group
async function joinGroup(req, res) { try {
  const groupId = parseId(req.params.id);
  if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const userId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.status !== 'upcoming') return res.status(400).json({ success: false, message: 'Cannot join this group' });
  const existing = await withPrismaRetry(() => prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }));
  if (existing) return res.status(400).json({ success: false, message: 'Already requested or joined' });
  const approvedCount = await countApprovedMembers(groupId);
  const isFull = approvedCount >= group.capacity;
  let status = group.joinPolicy === 'approval' ? 'pending' : 'approved';
  if (isFull) status = 'waitlist';
  const member = await withPrismaRetry(() => prisma.groupMember.create({ data: { groupId, userId, role: 'member', status } }));

  // Notify organizer when a new request requires approval
  if (status === 'pending') {
    try {
      const requesterName = req.user?.fullName || 'ผู้ใช้';
      await createAndEmitNotification({
        userId: group.organizerId,
        type: 'system',
        title: 'มีคำขอเข้าร่วมกลุ่มใหม่',
        body: `${requesterName} ขอเข้าร่วม: ${group.title || ''}`.trim(),
        link: `/groups/${groupId}`,
        data: { groupId, requesterId: userId, memberId: member.id }
      });
    } catch {}
  }

  res.status(201).json({ success: true, data: member });
} catch (error) { console.error('joinGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Approve a pending or waitlist member
async function approveMember(req, res) { try {
  const groupId = parseId(req.params.id); const memberId = parseId(req.params.memberId);
  if (!groupId || !memberId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const requesterId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== requesterId) return res.status(403).json({ success: false, message: 'Only organizer can approve' });
  const approvedCount = await countApprovedMembers(groupId);
  if (approvedCount >= group.capacity) return res.status(400).json({ success: false, message: 'Group is full' });
  const updated = await withPrismaRetry(() => prisma.groupMember.update({ where: { id: memberId }, data: { status: 'approved' } }));
  try {
    await createAndEmitNotification({ userId: updated.userId, type: 'system', title: 'คำขอเข้าร่วมกลุ่มได้รับการอนุมัติแล้ว', body: group.title || undefined, link: `/groups/${groupId}`, data: { groupId } });
  } catch {}
  res.json({ success: true, data: updated });
} catch (error) { console.error('approveMember error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Leave group
async function leaveGroup(req, res) { try { const groupId = parseId(req.params.id); if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' }); const userId = req.user.id; const membership = await withPrismaRetry(() => prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } })); if (!membership) return res.status(404).json({ success: false, message: 'Membership not found' }); if (membership.role === 'organizer') return res.status(400).json({ success: false, message: 'Organizer cannot leave the group' }); await withPrismaRetry(() => prisma.groupMember.delete({ where: { id: membership.id } })); const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (group) { const approvedCount = await countApprovedMembers(groupId); if (approvedCount < group.capacity) { const nextWaiter = await withPrismaRetry(() => prisma.groupMember.findFirst({ where: { groupId, status: 'waitlist' }, orderBy: { joinedAt: 'asc' } })); if (nextWaiter) { await withPrismaRetry(() => prisma.groupMember.update({ where: { id: nextWaiter.id }, data: { status: 'approved' } })); } } } res.json({ success: true, message: 'Left group' }); } catch (error) { console.error('leaveGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Cancel group
async function cancelGroup(req, res) { try {
  const groupId = parseId(req.params.id);
  if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const userId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can cancel' });
  const updated = await withPrismaRetry(() => prisma.group.update({ where: { id: groupId }, data: { status: 'cancelled' } }));
  try {
    const members = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { groupId, status: 'approved' }, select: { userId: true } }));
    await Promise.all(members.map(m => createAndEmitNotification({ userId: m.userId, type: 'system', title: 'กิจกรรมถูกยกเลิก', body: group.title || undefined, link: `/groups/${groupId}`, data: { groupId } })));
  } catch {}
  res.json({ success: true, data: updated });
} catch (error) { console.error('cancelGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Start group
async function startGroup(req, res) { try {
  const groupId = parseId(req.params.id);
  if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const userId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can start group' });
  if (group.status !== 'upcoming') return res.status(400).json({ success: false, message: 'Group cannot be started' });
  const updated = await withPrismaRetry(() => prisma.$transaction(async (tx) => { const g = await tx.group.update({ where: { id: groupId }, data: { status: 'ongoing' } }); const organizerMember = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }); if (organizerMember && !organizerMember.checkedInAt) { await tx.groupMember.update({ where: { id: organizerMember.id }, data: { status: 'checked_in', checkedInAt: new Date() } }); } return g; }));
  try {
    const members = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { groupId, status: 'approved' }, select: { userId: true } }));
    await Promise.all(members.map(m => createAndEmitNotification({ userId: m.userId, type: 'system', title: 'กิจกรรมเริ่มแล้ว', body: group.title || undefined, link: `/groups/${groupId}`, data: { groupId } })));
  } catch {}
  res.json({ success: true, data: updated });
} catch (error) { console.error('startGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Finish group
async function finishGroup(req, res) { try {
  const groupId = parseId(req.params.id);
  if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const userId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can finish group' });
  if (!(group.status === 'ongoing' || group.status === 'upcoming')) return res.status(400).json({ success: false, message: 'Group cannot be finished' });
  const updated = await withPrismaRetry(() => prisma.$transaction(async (tx) => { const organizerMember = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }); if (organizerMember && !organizerMember.checkedInAt) { await tx.groupMember.update({ where: { id: organizerMember.id }, data: { status: 'checked_in', checkedInAt: new Date() } }); } return tx.group.update({ where: { id: groupId }, data: { status: 'completed' } }); }));
  try {
    const members = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { groupId, status: 'approved' }, select: { userId: true } }));
    await Promise.all(members.map(m => createAndEmitNotification({ userId: m.userId, type: 'system', title: 'กิจกรรมสิ้นสุดแล้ว', body: group.title || undefined, link: `/groups/${groupId}`, data: { groupId } })));
  } catch {}
  res.json({ success: true, data: updated });
} catch (error) { console.error('finishGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Mark no-show
async function markNoShow(req, res) { try {
  const groupId = parseId(req.params.id); const memberId = parseId(req.params.memberId);
  if (!groupId || !memberId) return res.status(400).json({ success: false, message: 'Invalid id' });
  const userId = req.user.id;
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can mark no-show' });
  if (group.status !== 'completed') return res.status(400).json({ success: false, message: 'No-show can be marked after completion' });
  const member = await withPrismaRetry(() => prisma.groupMember.findFirst({ where: { id: memberId, groupId } }));
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  if (member.checkedInAt) return res.status(400).json({ success: false, message: 'Checked-in member cannot be marked no-show' });
  await withPrismaRetry(() => prisma.$transaction(async (tx) => { const updatedUser = await tx.user.update({ where: { id: member.userId }, data: { noShowCount: { increment: 1 }, reputationScore: { decrement: 0.2 } } }); if (updatedUser.reputationScore < 0) { await tx.user.update({ where: { id: member.userId }, data: { reputationScore: 0 } }); } }));
  try { await createAndEmitNotification({ userId: member.userId, type: 'system', title: 'ถูกบันทึกว่าไม่มาร่วมกิจกรรม', body: group.title || undefined, link: `/groups/${groupId}`, data: { groupId } }); } catch {}
  res.json({ success: true, message: 'Marked as no-show' });
} catch (error) { console.error('markNoShow error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Update group
async function updateGroup(req, res) { try { const groupId = parseId(req.params.id); if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' }); const userId = req.user.id; const { title, description, locationName, address, latitude, longitude, startAt, endAt, capacity, joinPolicy } = req.body; const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can update group' }); const data = {}; if (title !== undefined) data.title = title; if (description !== undefined) data.description = description; if (locationName !== undefined) data.locationName = locationName; if (address !== undefined) data.address = address || null; if (latitude !== undefined) data.latitude = latitude !== null && latitude !== '' ? Number(latitude) : null; if (longitude !== undefined) data.longitude = longitude !== null && longitude !== '' ? Number(longitude) : null; if (startAt !== undefined) data.startAt = new Date(startAt); if (endAt !== undefined) data.endAt = new Date(endAt); if (capacity !== undefined) data.capacity = Number(capacity); if (joinPolicy !== undefined) { const allowed = ['auto','approval']; if (!allowed.includes(joinPolicy)) return res.status(400).json({ success: false, message: 'Invalid joinPolicy' }); data.joinPolicy = joinPolicy; } const updated = await withPrismaRetry(() => prisma.group.update({ where: { id: groupId }, data })); res.json({ success: true, data: updated }); } catch (error) { console.error('updateGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Delete group
async function deleteGroup(req, res) { try { const groupId = parseId(req.params.id); if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' }); const userId = req.user.id; const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can delete group' }); await withPrismaRetry(() => prisma.$transaction(async (tx) => { await tx.groupMember.deleteMany({ where: { groupId } }); await tx.group.delete({ where: { id: groupId } }); })); res.json({ success: true, message: 'Group deleted successfully' }); } catch (error) { console.error('deleteGroup error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Check-in member
async function checkInMember(req, res) { try { const groupId = parseId(req.params.id); const memberId = parseId(req.params.memberId); if (!groupId || !memberId) return res.status(400).json({ success: false, message: 'Invalid id' }); const userId = req.user.id; const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can check-in' }); if (group.status !== 'ongoing') return res.status(400).json({ success: false, message: 'Check-in is allowed only during the activity' }); const member = await withPrismaRetry(() => prisma.groupMember.findFirst({ where: { id: memberId, groupId } })); if (!member) return res.status(404).json({ success: false, message: 'Member not found' }); if (!['approved','checked_in'].includes(member.status)) return res.status(400).json({ success: false, message: 'Only approved members can be checked-in' }); const updated = await withPrismaRetry(() => prisma.groupMember.update({ where: { id: member.id }, data: { status: 'checked_in', checkedInAt: new Date() } })); res.json({ success: true, data: updated }); } catch (error) { console.error('checkInMember error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

// Export attendees CSV
async function exportAttendeesCsv(req, res) { try { const groupId = parseId(req.params.id); const userId = req.user.id; if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' }); const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can export attendees' }); const members = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { groupId }, include: { user: { select: { id: true, fullName: true, email: true } } }, orderBy: { joinedAt: 'asc' } })); const headers = ['Name','Email','Role','Status','CheckedInAt']; const escapeCsv = (val) => { if (val === null || val === undefined) return ''; const s = String(val); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }; const rows = members.map(m => [ escapeCsv(m.user?.fullName || ''), escapeCsv(m.user?.email || ''), escapeCsv(m.role), escapeCsv(m.status), escapeCsv(m.checkedInAt ? new Date(m.checkedInAt).toISOString() : '') ].join(',')); const csv = [headers.join(','), ...rows].join('\n'); res.setHeader('Content-Type','text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="group-${groupId}-attendees.csv"`); return res.status(200).send(csv); } catch (error) { console.error('exportAttendeesCsv error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

async function setPinnedAnnouncement(req, res) { try {
  const groupId = parseId(req.params.id); const userId = req.user.id; const { text } = req.body;
  if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' });
  if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Announcement text is required' });
  const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } }));
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can pin announcement' });
  const updated = await withPrismaRetry(() => prisma.group.update({ where: { id: groupId }, data: { pinnedAnnouncementText: text.trim(), pinnedAnnouncementAt: new Date(), pinnedByUserId: userId } }));
  try {
    const members = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { groupId, status: 'approved' }, select: { userId: true } }));
    await Promise.all(members.map(m => createAndEmitNotification({ userId: m.userId, type: 'system', title: 'ประกาศใหม่ในกลุ่ม', body: text.trim().slice(0, 100), link: `/groups/${groupId}`, data: { groupId } })));
  } catch {}
  res.json({ success: true, data: updated });
} catch (error) { console.error('setPinnedAnnouncement error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

async function clearPinnedAnnouncement(req, res) { try { const groupId = parseId(req.params.id); const userId = req.user.id; if (!groupId) return res.status(400).json({ success: false, message: 'Invalid id' }); const group = await withPrismaRetry(() => prisma.group.findUnique({ where: { id: groupId } })); if (!group) return res.status(404).json({ success: false, message: 'Group not found' }); if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can clear announcement' }); const updated = await withPrismaRetry(() => prisma.group.update({ where: { id: groupId }, data: { pinnedAnnouncementText: null, pinnedAnnouncementAt: null, pinnedByUserId: null } })); res.json({ success: true, data: updated }); } catch (error) { console.error('clearPinnedAnnouncement error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

async function getMyGroups(req, res) { try { const userId = req.user.id; const organized = await withPrismaRetry(() => prisma.group.findMany({ where: { organizerId: userId }, include: { organizer: { select: { id: true, fullName: true, picture: true } }, members: { where: { userId }, select: { id: true, status: true, role: true }, take: 1 } }, orderBy: { startAt: 'asc' } })); const memberships = await withPrismaRetry(() => prisma.groupMember.findMany({ where: { userId, role: 'member' }, include: { group: { include: { organizer: { select: { id: true, fullName: true, picture: true } }, members: { where: { userId }, select: { id: true, status: true, role: true }, take: 1 } } } }, orderBy: { group: { startAt: 'asc' } } })); const allGroupIds = [...organized.map(g => g.id), ...memberships.map(m => m.group.id)]; let approvedCountsByGroupId = {}, pendingCountsByGroupId = {}; if (allGroupIds.length) { const [approvedGrouped, pendingGrouped] = await Promise.all([
    withPrismaRetry(() => prisma.groupMember.groupBy({ by: ['groupId'], where: { groupId: { in: allGroupIds }, status: 'approved' }, _count: { _all: true } })),
    withPrismaRetry(() => prisma.groupMember.groupBy({ by: ['groupId'], where: { groupId: { in: allGroupIds }, status: 'pending' }, _count: { _all: true } }))
  ]); approvedGrouped.forEach(r => { approvedCountsByGroupId[r.groupId] = r._count._all; }); pendingGrouped.forEach(r => { pendingCountsByGroupId[r.groupId] = r._count._all; }); } const organizedWithCounts = organized.map(g => ({ ...g, approvedCount: approvedCountsByGroupId[g.id] || 0, pendingCount: pendingCountsByGroupId[g.id] || 0 })); const joinedWithCounts = memberships.map(m => ({ ...m.group, approvedCount: approvedCountsByGroupId[m.group.id] || 0, pendingCount: pendingCountsByGroupId[m.group.id] || 0 })); res.json({ success: true, data: { organized: organizedWithCounts, joined: joinedWithCounts } }); } catch (error) { console.error('getMyGroups error', { message: error.message, stack: error.stack }); res.status(500).json({ success: false, message: 'Server error' }); } }

module.exports = { createGroup, listGroups, getGroupById, updateGroup, deleteGroup, joinGroup, approveMember, leaveGroup, cancelGroup, getMyGroups, startGroup, finishGroup, checkInMember, exportAttendeesCsv, setPinnedAnnouncement, clearPinnedAnnouncement, markNoShow };


