const { prisma } = require('../config/database');

// Submit a report (group or user)
exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { targetType = 'group', groupId, reportedUserId, reason, description } = req.body;
    if (!reason || (!groupId && !reportedUserId)) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลและเป้าหมายที่จะรายงาน' });
    }

    // Enforce one report per reporter per group (person-level reporting removed)
    if (groupId) {
      const existed = await prisma.report.findFirst({
        where: { reporterId, targetType: 'group', groupId: Number(groupId) }
      });
      if (existed) {
        return res.status(409).json({ success: false, message: 'คุณได้รายงานกลุ่มนี้แล้ว' });
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: 'group',
        groupId: groupId ? Number(groupId) : null,
        reportedUserId: null,
        reason,
        description: description || null,
      }
    });

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('[submitReport] error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งรายงาน' });
  }
};

// Admin: list reports
exports.listReports = async (req, res) => {
  try {
    const { status, targetType, groupId, reportedUserId } = req.query;
    const reports = await prisma.report.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(targetType ? { targetType } : {}),
        ...(groupId ? { groupId: Number(groupId) } : {}),
        ...(reportedUserId ? { reportedUserId: Number(reportedUserId) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        reportedUser: { select: { id: true, fullName: true, email: true } },
        group: { select: { id: true, title: true, startAt: true, _count: { select: { feedbacks: true } } } },
      }
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('[listReports] error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายการรายงาน' });
  }
};

// Admin: update report status / add note
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        ...(status ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[updateReport] error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตรายงานได้' });
  }
};

// Get my report for a specific target
exports.getMyReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { groupId, reportedUserId, targetType = 'group' } = req.query;
    const report = await prisma.report.findFirst({
      where: {
        reporterId,
        ...(targetType ? { targetType: String(targetType) } : {}),
        ...(groupId ? { groupId: Number(groupId) } : {}),
        ...(reportedUserId ? { reportedUserId: Number(reportedUserId) } : {}),
      }
    });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('[getMyReport] error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรายงานของคุณ' });
  }
};


