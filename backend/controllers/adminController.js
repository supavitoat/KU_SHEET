const { prisma } = require('../config/database');
const path = require('path');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const [totalUsers, totalSellers, totalSheets, pendingSheets, approvedSheets, totalOrders, pendingOrders, verifiedOrders, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.sheet.count(),
      prisma.sheet.count({ where: { status: 'PENDING' } }),
      prisma.sheet.count({ where: { status: 'APPROVED' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.order.count({ where: { status: 'verified' } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'verified' } })
    ]);

    // Get recent activities
    const recentSheets = await prisma.sheet.findMany({
      where: { status: 'PENDING' },
      include: {
        seller: {
          select: {
            penName: true,
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentOrders = await prisma.order.findMany({
      where: { status: 'paid' },
      include: {
        sheet: { select: { title: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          totalSheets,
          pendingSheets,
          approvedSheets,
          totalOrders,
          pendingOrders,
          verifiedOrders,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentSheets,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get pending sheets for approval
// @route   GET /api/admin/sheets/pending
// @access  Private (Admin)
const getPendingSheets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [count, rows] = await Promise.all([
      prisma.sheet.count({ where: { status: 'PENDING' } }),
      prisma.sheet.findMany({
        where: { status: 'PENDING' },
        include: {
          seller: {
            select: {
              penName: true,
              realName: true,
              user: { select: { fullName: true, email: true } },
            },
          },
          faculty: { select: { name: true, code: true } },
          subject: { select: { name: true, code: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        sheets: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get pending sheets error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get sheet by ID for admin review
// @route   GET /api/admin/sheets/:id
// @access  Private (Admin)
const getSheetForReview = async (req, res) => {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        seller: {
          select: {
            penName: true,
            realName: true,
            phone: true,
            user: { select: { fullName: true, email: true } },
          },
        },
        faculty: { select: { name: true, code: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    res.json({ success: true, data: sheet });
  } catch (error) {
    console.error('Get sheet for review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Approve sheet
// @route   PUT /api/admin/sheets/:id/approve
// @access  Private (Admin)
const approveSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_message } = req.body;

    const sheet = await prisma.sheet.findUnique({ where: { id: Number(id) } });
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    const updatedSheet = await prisma.sheet.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        adminMessage: admin_message || 'Sheet approved',
      },
    });

    res.json({
      success: true,
      message: 'Sheet approved successfully',
      data: updatedSheet,
    });
  } catch (error) {
    console.error('Approve sheet error:', error);
    res.status(500).json({ success: false, message: 'Server error during sheet approval', error: error.message });
  }
};

// @desc    Reject sheet
// @route   PUT /api/admin/sheets/:id/reject
// @access  Private (Admin)
const rejectSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_message } = req.body;

    if (!admin_message) {
      return res.status(400).json({ success: false, message: 'Admin message is required for rejection' });
    }

    const sheet = await prisma.sheet.findUnique({ where: { id: Number(id) } });
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    const updatedSheet = await prisma.sheet.update({
      where: { id: Number(id) },
      data: {
        status: 'REJECTED',
        adminMessage: admin_message,
      },
    });

    res.json({
      success: true,
      message: 'Sheet rejected successfully',
      data: updatedSheet,
    });
  } catch (error) {
    console.error('Reject sheet error:', error);
    res.status(500).json({ success: false, message: 'Server error during sheet rejection', error: error.message });
  }
};

// @desc    Get pending payment slips
// @route   GET /api/admin/orders/pending
// @access  Private (Admin)
const getPendingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [count, rows] = await Promise.all([
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.order.findMany({
        where: { status: 'paid' },
        include: {
          sheet: { select: { title: true, subjectCode: true, price: true } },
          user: { select: { fullName: true, email: true } },
          seller: { select: { penName: true, bankName: true, bankAccount: true, accountName: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { paymentDate: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Verify payment
// @route   PUT /api/admin/orders/:id/verify
// @access  Private (Admin)
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { seller: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Can only verify paid orders' });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        status: 'verified',
        verifiedDate: new Date(),
        adminNotes: admin_notes || 'Payment verified',
      },
    });

    // Update seller revenue
    if (order.seller) {
      await prisma.seller.update({
        where: { id: order.seller.id },
        data: { totalRevenue: { increment: parseFloat(order.amount) } },
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification', error: error.message });
  }
};

// @desc    Reject payment
// @route   PUT /api/admin/orders/:id/reject
// @access  Private (Admin)
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes) {
      return res.status(400).json({ success: false, message: 'Admin notes are required for rejection' });
    }

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Can only reject paid orders' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        adminNotes: admin_notes,
      },
    });

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment rejection', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [count, rows] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        include: {
          seller: {
            select: { penName: true, totalRevenue: true },
          },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get order by ID for admin
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
const getOrderForReview = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sheet: { select: { title: true, subjectCode: true, price: true } },
        user: { select: { fullName: true, email: true, faculty: true } },
        seller: { select: { penName: true, bankName: true, bankAccount: true, accountName: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order for review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getPendingSheets,
  getSheetForReview,
  approveSheet,
  rejectSheet,
  getPendingOrders,
  getOrderForReview,
  verifyPayment,
  rejectPayment,
  getAllUsers,
};