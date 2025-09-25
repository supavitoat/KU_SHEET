const { prisma } = require('../config/database');

const PRIOR_MEAN = 3.8;
const PRIOR_WEIGHT = 10;

// Submit feedback (checked-in participants only)
const submitFeedback = async (req, res) => {
  try {
    const raterUserId = req.user.id;
    const { targetUserId, groupId, rating, dimensions, tags, comment, isPublic } = req.body;

    if (!targetUserId || !groupId || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (Number(targetUserId) === raterUserId) {
      return res.status(400).json({ success: false, message: 'Cannot rate yourself' });
    }

    // Validate group completed and both checked in
    const group = await prisma.group.findUnique({ where: { id: Number(groupId) } });
    if (!group || group.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Feedback allowed after activity is completed' });
    }

    const [raterMember, targetMember] = await Promise.all([
      prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: Number(groupId), userId: raterUserId } } }),
      prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: Number(groupId), userId: Number(targetUserId) } } }),
    ]);
    if (!raterMember || !targetMember || !raterMember.checkedInAt || !targetMember.checkedInAt) {
      return res.status(403).json({ success: false, message: 'Only checked-in participants can rate' });
    }

    // Enforce: One feedback per rater per target in a group
    const existingForTarget = await prisma.userFeedback.findFirst({
      where: { raterUserId, groupId: Number(groupId), targetUserId: Number(targetUserId) },
      select: { id: true }
    });
    if (existingForTarget) {
      return res.status(400).json({ success: false, message: 'คุณให้คะแนนผู้ใช้งานคนนี้ไปแล้วในกิจกรรมนี้' });
    }

    const created = await prisma.userFeedback.create({
      data: {
        targetUserId: Number(targetUserId),
        raterUserId,
        groupId: Number(groupId),
        rating: Number(rating),
        dimensions: dimensions || null,
        tags: tags || null,
        comment: comment || null,
        isPublic: Boolean(isPublic)
      }
    });

    // Recalculate reputation for target (simple average now; Bayesian displayed on read)
    const agg = await prisma.userFeedback.aggregate({ where: { targetUserId: Number(targetUserId) }, _count: true, _avg: { rating: true } });
    const count = agg._count;
    const avg = agg._avg.rating || 0;
    await prisma.user.update({ where: { id: Number(targetUserId) }, data: { reputationScore: avg, reputationCount: count } });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('[Reputation] submitFeedback error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get reputation summary
const getReputation = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { _count, _avg } = await prisma.userFeedback.aggregate({ where: { targetUserId: userId }, _count: true, _avg: { rating: true } });
    const count = _count;
    const mean = _avg.rating || 0;
    const displayScore = ((_count ? PRIOR_MEAN * PRIOR_WEIGHT : PRIOR_MEAN * PRIOR_WEIGHT) + (mean * count)) / (PRIOR_WEIGHT + count);

    res.json({ success: true, data: { score: Number(displayScore.toFixed(2)), count, noShowCount: user.noShowCount } });
  } catch (error) {
    console.error('[Reputation] getReputation error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current user's feedbacks for a group
const getMyFeedbackForGroup = async (req, res) => {
  try {
    const raterUserId = req.user.id;
    const groupId = Number(req.params.id);
    const rows = await prisma.userFeedback.findMany({
      where: { raterUserId, groupId },
      select: { targetUserId: true, rating: true }
    });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Reputation] getMyFeedbackForGroup error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitFeedback, getReputation, getMyFeedbackForGroup };


