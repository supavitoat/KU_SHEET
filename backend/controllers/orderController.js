const { prisma } = require('../config/database');
const path = require('path');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { sheet_id } = req.body;
    const sheet = await prisma.sheet.findFirst({
      where: { id: Number(sheet_id), status: 'APPROVED' },
      include: { seller: { select: { id: true, penName: true, bankName: true, bankAccount: true, accountName: true } } }
    });
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found or not approved' });
    if (sheet.isFree) return res.status(400).json({ success: false, message: 'Cannot create order for free sheet' });

    const existingOrder = await prisma.order.findFirst({
      where: { userId: req.user.id, sheetId: sheet.id, status: { in: ['pending', 'paid', 'verified'] } }
    });
    if (existingOrder) return res.status(400).json({ success: false, message: 'Order already exists for this sheet', data: existingOrder });

    const order = await prisma.order.create({
      data: { userId: req.user.id, sheetId: sheet.id, sellerId: sheet.sellerId, amount: sheet.price, status: 'pending' }
    });
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        sheet: { select: { title: true, subjectCode: true, price: true } },
        seller: { select: { penName: true, bankName: true, bankAccount: true, accountName: true } }
      }
    });
    res.status(201).json({ success: true, message: 'Order created successfully', data: completeOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error during order creation', error: error.message });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;
    const [count, rows] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          sheet: { select: { title: true, subjectCode: true, price: true, coverImage: true } },
          seller: { select: { penName: true, bankName: true, bankAccount: true, accountName: true } },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
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
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
      include: {
        sheet: { select: { title: true, subjectCode: true, price: true, coverImage: true } },
        seller: { select: { penName: true, bankName: true, bankAccount: true, accountName: true } },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Upload payment slip
// @route   POST /api/orders/:id/payment-slip
// @access  Private
const uploadPaymentSlip = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({ where: { id: Number(id), userId: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ success: false, message: 'Can only upload payment slip for pending orders' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Payment slip file is required' });
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paymentSlip: req.file.filename, paymentDate: new Date(), status: 'paid' },
    });
    res.json({ success: true, message: 'Payment slip uploaded successfully', data: updatedOrder });
  } catch (error) {
    console.error('Upload payment slip error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment slip upload', error: error.message });
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({ where: { id: Number(id), userId: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ success: false, message: 'Can only cancel pending orders' });
    await prisma.order.delete({ where: { id: order.id } });
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error during order cancellation', error: error.message });
  }
};

// @desc    Get order statistics for user
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = async (req, res) => {
  try {
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: req.user.id },
      _count: { _all: true },
    });
    const totalSpent = await prisma.order.aggregate({
      _sum: { amount: true },
      where: { userId: req.user.id, status: 'verified' },
    });
    const formattedStats = {
      total_orders: 0,
      total_spent: 0,
      pending: 0,
      paid: 0,
      verified: 0,
      rejected: 0,
    };
    statusCounts.forEach(stat => {
      formattedStats[stat.status] = stat._count._all;
      formattedStats.total_orders += stat._count._all;
    });
    formattedStats.total_spent = totalSpent._sum.amount || 0;
    res.json({ success: true, data: formattedStats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  uploadPaymentSlip,
  cancelOrder,
  getOrderStats,
};
