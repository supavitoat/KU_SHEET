const express = require('express');
const router = express.Router();
// Debug logger (disabled in production)
const debug = (...args) => { if (process.env.NODE_ENV !== 'production') console.log(...args); };
const { protect, requireAdmin } = require('../middleware/auth');
const { prisma } = require('../config/database');
const {
  getDashboardStats,
  getUsers,
  getUserById,
  getUserAnalytics,
  getSystemHealth,
  getSheetAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  banUser,
  unbanUser,
  deleteUser,
  getSheets,
  getSheetById,
  approveSheet,
  rejectSheet,
  deleteSheet,
  getOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/adminController');

const {
  getFinanceStats,
  getPendingPayouts,
  getRecentTransactions,
  getPayoutHistory,
  processPayout,
  updateCommissionRate,
  updatePayoutSchedule,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/financeController');

// Discount codes admin
const {
  listDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount,
} = require('../controllers/discountController');

// Admin Study Group management
const {
  adminListGroups,
  adminGetGroupById,
  adminUpdateGroupStatus,
  adminDeleteGroup,
} = require('../controllers/adminGroupController');

// Dashboard routes
router.get('/dashboard/stats', protect, requireAdmin, getDashboardStats);

// User management routes
router.get('/users', protect, requireAdmin, getUsers);
router.get('/users/:id', protect, requireAdmin, getUserById);
router.post('/users/:id/ban', protect, requireAdmin, banUser);
router.post('/users/:id/unban', protect, requireAdmin, unbanUser);
router.delete('/users/:id', protect, requireAdmin, deleteUser);

// Sheet management routes
router.get('/sheets', protect, requireAdmin, getSheets);
router.get('/sheets/:id', protect, requireAdmin, getSheetById);
router.post('/sheets/:id/approve', protect, requireAdmin, approveSheet);
router.post('/sheets/:id/reject', protect, requireAdmin, rejectSheet);
router.delete('/sheets/:id', protect, requireAdmin, deleteSheet);

// Order management routes
router.get('/orders', protect, requireAdmin, getOrders);
router.get('/orders/:id', protect, requireAdmin, getOrderById);
router.put('/orders/:id/status', protect, requireAdmin, updateOrderStatus);

// Analytics routes
router.get('/analytics/users', (req, res, next) => {
  debug('🔍 Analytics route hit:', req.method, req.originalUrl);
  debug('🔍 Headers:', req.headers);
  next();
}, protect, requireAdmin, getUserAnalytics);

router.get('/analytics/sheets', protect, requireAdmin, getSheetAnalytics);
router.get('/analytics/orders', protect, requireAdmin, getOrderAnalytics);
router.get('/analytics/revenue', protect, requireAdmin, getRevenueAnalytics);

// System health routes
router.get('/system/health', protect, requireAdmin, getSystemHealth);

// Finance management routes
router.get('/finance/stats', protect, requireAdmin, getFinanceStats);
router.get('/finance/pending-payouts', protect, requireAdmin, getPendingPayouts);
router.get('/finance/recent-transactions', protect, requireAdmin, getRecentTransactions);
router.get('/finance/payout-history', protect, requireAdmin, getPayoutHistory);
router.post('/finance/payouts/:id/process', protect, requireAdmin, processPayout);
router.put('/finance/commission-rate', protect, requireAdmin, updateCommissionRate);
router.put('/finance/payout-schedule', protect, requireAdmin, updatePayoutSchedule);
router.get('/finance/settings', protect, requireAdmin, getSystemSettings);
router.get('/settings', protect, requireAdmin, getSystemSettings);
router.put('/settings', protect, requireAdmin, updateSystemSettings);

// Discount codes management
router.get('/discounts', protect, requireAdmin, listDiscounts);
router.post('/discounts', protect, requireAdmin, createDiscount);
router.put('/discounts/:id', protect, requireAdmin, updateDiscount);
router.put('/discounts/:id/toggle', protect, requireAdmin, toggleDiscount);
router.delete('/discounts/:id', protect, requireAdmin, deleteDiscount);

// Study Groups admin routes
router.get('/groups', protect, requireAdmin, adminListGroups);
router.get('/groups/:id', protect, requireAdmin, adminGetGroupById);
router.put('/groups/:id/status', protect, requireAdmin, adminUpdateGroupStatus);
router.delete('/groups/:id', protect, requireAdmin, adminDeleteGroup);

// Helper to support both legacy :payoutId and new :sellerId params
const getSellerIdParam = (req) => {
  const raw = req.params.sellerId ?? req.params.payoutId;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

// Unified handler: ดึงประวัติการโอนเงินรายสัปดาห์ ของ seller
const getWeeklyHistoryHandler = async (req, res) => {
  try {
    const sellerId = getSellerIdParam(req);
  debug('🔍 Weekly history endpoint (sellerId):', sellerId, '| params:', req.params);
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId ไม่ถูกต้อง' });
    }
    
    // ดึงข้อมูล seller จาก ID ที่ส่งมา
    const seller = await prisma.seller.findFirst({
      where: { id: sellerId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ 
        error: 'Seller not found', 
        message: `ไม่พบข้อมูลผู้ขายที่มี ID: ${sellerId}` 
      });
    }

    // ดึงประวัติการโอนเงินทั้งหมดของ seller นี้จากตาราง payout เท่านั้น
    const payouts = await prisma.payout.findMany({
      where: {
        sellerId: seller.id,
        status: 'COMPLETED' // เฉพาะการโอนเงินที่เสร็จสิ้นแล้ว
      },
      orderBy: {
        confirmedAt: 'desc'
      }
    });

  debug('🔍 Found completed payouts:', payouts.length);
    
    // helper: คำนวณช่วงสัปดาห์ (จันทร์ 09:00 - จันทร์ถัดไป 08:59:59.999)
    const getWeeklyWindow = (baseDate) => {
      const ref = new Date(baseDate);
      const dayOfWeek = ref.getDay(); // 0=Sun,1=Mon,...
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = new Date(ref);
      start.setDate(ref.getDate() - daysToMonday);
      start.setHours(9, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(8, 59, 59, 999);
      return { start, end };
    };

    // แปลงข้อมูล payout เป็น weeklyHistory format พร้อมคำนวณจำนวนออเดอร์ในช่วงสัปดาห์นั้น
    const weeklyHistory = await Promise.all(payouts.map(async (payout) => {
      const refTime = payout.confirmedAt || payout.createdAt || new Date();
      const { start, end } = getWeeklyWindow(refTime);

      // นับจำนวนออเดอร์ของผู้ขายในช่วงสัปดาห์นี้ (เฉพาะ VERIFIED)
  const orders = await prisma.order.findMany({
        where: {
          sellerId: seller.id,
          status: 'VERIFIED',
          createdAt: {
            gte: start,
            lte: end,
          }
        },
        select: { amount: true }
      });

      const totalOrders = orders.length;
      const totalAmountInWeek = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        id: payout.id,
        weekStart: start.toISOString().split('T')[0],
        weekEnd: end.toISOString().split('T')[0],
        totalOrders,
        totalAmount: payout.amount ?? totalAmountInWeek,
        commission: payout.commission ?? 0,
        netAmount: payout.netAmount ?? Math.max((payout.amount || 0) - (payout.commission || 0), 0),
        confirmedAt: payout.confirmedAt ? payout.confirmedAt.toISOString().split('T')[0] : 'ไม่ระบุ',
        status: payout.status,
        reference: `PAY${payout.id.toString().padStart(3, '0')}`
      };
    }));
    
  debug('🔍 Weekly history from payouts:', JSON.stringify(weeklyHistory, null, 2));

  res.json({
      success: true,
      data: {
        seller: {
          id: seller.id,
          name: seller.penName,
          email: seller.user.email
        },
        weeklyHistory
      }
    });

  } catch (error) {
    console.error('❌ Error fetching weekly history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching weekly history'
    });
  }
};

// New route (preferred)
router.get('/payouts/seller/:sellerId/weekly-history', protect, requireAdmin, getWeeklyHistoryHandler);
// Legacy route (kept for backward compatibility)
router.get('/payouts/:payoutId/weekly-history', protect, requireAdmin, getWeeklyHistoryHandler);

// Unified handler: ดึงข้อมูลการโอนเงินรายละเอียด ของ seller
const getPayoutDetailsHandler = async (req, res) => {
  try {
    const sellerId = getSellerIdParam(req);
  debug('🔍 Payout details endpoint (sellerId):', sellerId, '| params:', req.params);
    if (!sellerId) {
      return res.status(400).json({ error: 'Bad request', message: 'sellerId ไม่ถูกต้อง' });
    }
    
    // ดึงข้อมูล seller
    const seller = await prisma.seller.findFirst({
      where: { id: sellerId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });
    
  debug('🔍 Seller found:', seller ? 'Yes' : 'No');
    if (seller) {
  debug('🔍 Seller details:', {
        id: seller.id,
        penName: seller.penName,
        userName: seller.user.fullName,
        userEmail: seller.user.email
      });
    }

  if (!seller) {
      return res.status(404).json({ 
        error: 'Seller not found', 
    message: `ไม่พบข้อมูลผู้ขายที่มี ID: ${sellerId}` 
      });
    }

    // คำนวณช่วงเวลารายสัปดาห์ (จันทร์ 09:00 - จันทร์ 08:59)
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(9, 0, 0, 0);
    
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    nextMonday.setHours(8, 59, 59, 999);

    // ดึงข้อมูลการขายชีทเฉพาะสัปดาห์ปัจจุบัน (จันทร์ 09:00 - จันทร์ 08:59)
  debug('🔍 Fetching orders for seller ID:', seller.id);
    debug('📅 Weekly period:', monday.toISOString(), 'to', nextMonday.toISOString());
    
    // ดึงข้อมูลการขายชีททั้งหมด (ไม่จำกัดสัปดาห์)
    const orders = await prisma.order.findMany({
      where: {
        sellerId: seller.id,
        status: 'VERIFIED'
        // ไม่จำกัด paymentStatus เพื่อให้ได้ทั้งฟรีและเสียเงิน
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        sheet: {
          select: {
            title: true,
            price: true,
            subjectNameJSON: true // เพิ่มชื่อวิชาที่สมบูรณ์
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
  debug('🔍 Orders found:', orders.length);
    if (orders.length > 0) {
  debug('🔍 First order:', {
        id: orders[0].id,
        amount: orders[0].amount,
        createdAt: orders[0].createdAt
      });
  debug('🔍 Last order:', {
        id: orders[orders.length - 1].id,
        amount: orders[orders.length - 1].amount,
        createdAt: orders[orders.length - 1].createdAt
      });
    }

    // คำนวณสถิติรายสัปดาห์
    let weeklyOrders = orders.length;
    let weeklyFreeSheets = orders.filter(order => order.amount === 0).length;
    let weeklyPaidSheets = orders.filter(order => order.amount > 0).length;
    
    // ยอดรวมรายสัปดาห์ = เงินที่เจ้าของชีทขายชีทได้ในสัปดาห์นี้ (ยังไม่หักค่าคอมมิชชัน)
    let weeklyAmount = orders.reduce((sum, order) => sum + order.amount, 0);
    
    // ค่าคอมมิชชันรายสัปดาห์ = ส่วนที่ถูกหักออกมา 15% จากยอดรวมรายสัปดาห์
    let weeklyCommission = orders.reduce((sum, order) => {
      if (order.amount === 0) return sum; // ชีทฟรีไม่มีค่าคอมมิชชัน
      return sum + Math.round((order.amount * 0.15) * 100) / 100; // ค่าคอมมิชชัน 15%
    }, 0);
    
    // จำนวนเงินสุทธิรายสัปดาห์ = เงินที่เจ้าของชีทขายชีทได้ในสัปดาห์นี้ (หักค่าคอมมิชชันแล้ว)
    let weeklySellerAmount = weeklyAmount - weeklyCommission;

    // ดึงข้อมูลยอดรวมทั้งหมด (สำหรับเปรียบเทียบ)
    const allOrders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      select: { amount: true }
    });
    
    const totalAllOrders = allOrders.length;
    const totalAllAmount = allOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalAllCommission = allOrders.reduce((sum, order) => {
      if (order.amount === 0) return sum;
      return sum + Math.round((order.amount * 0.15) * 100) / 100;
    }, 0);
    const totalAllSellerAmount = totalAllAmount - totalAllCommission;
    
  debug('💰 Weekly calculation results:');
  debug('💰 Weekly Orders:', weeklyOrders);
  debug('💰 Weekly Free Sheets:', weeklyFreeSheets);
  debug('💰 Weekly Paid Sheets:', weeklyPaidSheets);
  debug('💰 Weekly Amount:', weeklyAmount);
  debug('💰 Weekly Commission (15%):', weeklyCommission);
  debug('💰 Weekly Seller Amount:', weeklySellerAmount);
    
  debug('💰 All-time totals:');
  debug('💰 Total All Orders:', totalAllOrders);
  debug('💰 Total All Amount:', totalAllAmount);
  debug('💰 Total All Commission:', totalAllCommission);
  debug('💰 Total All Seller Amount:', totalAllSellerAmount);
    
    // ประกาศ orderDetails
    let orderDetails = [];
    
    // สร้าง orderDetails จากข้อมูลจริง
    if (orders.length > 0) {
      // สร้าง orderDetails
      orderDetails = orders.map((order, index) => {
      // ใช้ชื่อวิชาที่สมบูรณ์จาก subjectNameJSON หรือ fallback ไปที่ title
      let sheetTitle = order.sheet.title;
      try {
        if (order.sheet.subjectNameJSON) {
          const subjectData = JSON.parse(order.sheet.subjectNameJSON);
          // ถ้ามีชื่อวิชาภาษาไทย ให้ใช้ภาษาไทย ถ้าไม่มีให้ใช้ภาษาอังกฤษ
          if (subjectData.thai && subjectData.thai.trim()) {
            sheetTitle = subjectData.thai;
          } else if (subjectData.english && subjectData.english.trim()) {
            sheetTitle = subjectData.english;
          }
        }
      } catch (error) {
        debug('⚠️ Error parsing subjectNameJSON, using title:', error.message);
      }
      
      return {
        id: order.id,
        customerName: order.user.fullName,
        customerEmail: order.user.email,
        sheetTitle: sheetTitle, // ใช้ชื่อวิชาที่สมบูรณ์
        amount: order.amount,
        commission: order.amount === 0 ? 0 : order.amount * 0.15, // ค่าคอมมิชชัน 15%
        sellerAmount: order.amount === 0 ? 0 : order.amount * 0.85, // เจ้าของชีทได้ 85%
        date: order.createdAt,
        isFree: order.amount === 0
      };
      });
      
  debug('📋 Order details created:', orderDetails.length);
  debug('📋 Free sheets in details:', orderDetails.filter(order => order.isFree).length);
  debug('📋 Paid sheets in details:', orderDetails.filter(order => !order.isFree).length);
      
      // แสดงชื่อวิชาที่ดึงมา
      orderDetails.forEach((order, index) => {
  debug(`📋 Order ${index + 1}:`, {
          id: order.id,
          sheetTitle: order.sheetTitle,
          amount: order.amount,
          isFree: order.isFree
        });
      });
    }

    // ดึงข้อมูล Payout จากฐานข้อมูล (ถ้ามี) - ใช้ orderBy เพื่อให้ได้ข้อมูลล่าสุด
  const existingPayout = await prisma.payout.findFirst({
        where: { sellerId: seller.id },
        orderBy: { createdAt: 'desc' } // ดึงข้อมูลล่าสุด
      });

  debug('🔍 Existing payout found:', existingPayout ? {
        id: existingPayout.id,
        status: existingPayout.status,
        confirmedAt: existingPayout.confirmedAt
      } : 'None');

      const payoutData = {
        id: sellerId,
        sellerName: seller.user.fullName,
        email: seller.user.email,
        bankName: seller.bankName || '',
        bankAccount: seller.bankAccount || '',
        accountName: seller.accountName || '',
        promptPayId: seller.promptPayId || '',
        // ข้อมูลทั้งหมด (ไม่จำกัดสัปดาห์)
        amount: totalAllAmount, // ยอดรวมทั้งหมด (ยังไม่หักค่าคอม)
        netAmount: totalAllSellerAmount, // จำนวนเงินสุทธิทั้งหมด (หักค่าคอม 15% แล้ว)
        commission: totalAllCommission, // ค่าคอมมิชชันทั้งหมด (15% จากยอดรวม)
        orders: totalAllOrders, // จำนวนคำสั่งซื้อทั้งหมด
        // ข้อมูลยอดรวมทั้งหมด (สำหรับเปรียบเทียบ)
        totalAllAmount: totalAllAmount,
        totalAllNetAmount: totalAllSellerAmount,
        totalAllCommission: totalAllCommission,
        totalAllOrders: totalAllOrders,
        lastPayout: existingPayout?.confirmedAt || null,
        status: existingPayout?.status || 'PENDING',
        orderDetails: orderDetails,
        slipImagePath: existingPayout?.slipImagePath || null,
      };

  debug('✅ Sending response:', JSON.stringify(payoutData, null, 2));
    res.json(payoutData);
  } catch (error) {
    console.error('❌ Error fetching payout data:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// New route (preferred)
router.get('/payouts/seller/:sellerId', protect, requireAdmin, getPayoutDetailsHandler);
// Legacy route (kept for backward compatibility)
router.get('/payouts/:payoutId', protect, requireAdmin, getPayoutDetailsHandler);

// POST /api/admin/payouts/upload-slip - อัพโหลดสลิปการโอนเงิน
const upload = require('../middleware/upload');
const { enforceFieldLimits } = require('../middleware/upload');
const uploadSlip = upload.single('slipImage');
const enforceSlipMax5MB = (req, res, next) => {
  const file = req.file;
  if (file && file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'ไฟล์ใหญ่เกิน 5MB' });
  }
  next();
};

// Error handling middleware สำหรับ multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ขนาดไฟล์ต้องไม่เกิน 5MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'ไฟล์ไม่ถูกต้อง'
      });
    }
  }
  next(error);
};

router.post('/payouts/upload-slip', protect, requireAdmin, uploadSlip, enforceSlipMax5MB, enforceFieldLimits({ slipImage: 5*1024*1024 }), handleUploadError, async (req, res) => {
  try {
    // ตรวจสอบว่ามีไฟล์อัพโหลดหรือไม่
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'ไม่พบไฟล์สลิปที่อัพโหลด' 
      });
    }

    const slipFile = req.file;
  debug('🔍 Slip file received:', {
      originalname: slipFile.originalname,
      filename: slipFile.filename,
      mimetype: slipFile.mimetype,
      size: slipFile.size
    });

    const { payoutId, sellerId, amount, uploadDate } = req.body;
  debug('🔍 Request body:', { payoutId, sellerId, amount, uploadDate });



    // ตรวจสอบข้อมูลที่จำเป็น
    if (!payoutId || !sellerId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ครบถ้วน' 
      });
    }

    // ตรวจสอบประเภทไฟล์
    if (!slipFile.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        success: false, 
        message: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' 
      });
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (slipFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false, 
        message: 'ขนาดไฟล์ต้องไม่เกิน 5MB' 
      });
    }

    // multer บันทึกไฟล์ไปยัง destination แล้ว ใช้ filename ที่ multer สร้างให้
    const fileName = slipFile.filename; // multer สร้างชื่อไฟล์ให้แล้ว
  debug('🔍 File saved by multer:', {
      filename: fileName,
      path: slipFile.path,
      destination: slipFile.destination
    });

    // หา payoutId ที่ถูกต้องจากตาราง Payout
    const existingPayout = await prisma.payout.findFirst({
      where: {
        sellerId: parseInt(sellerId),
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!existingPayout) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลการโอนเงินที่เสร็จสิ้นแล้ว'
      });
    }

  debug('🔍 Found existing payout:', {
      id: existingPayout.id,
      sellerId: existingPayout.sellerId,
      status: existingPayout.status
    });

    // ถ้ามีสลิปเดิมอยู่แล้ว อนุญาตให้แทนที่และลบไฟล์เก่า
    if (existingPayout.slipImagePath) {
      try {
        const oldPath = require('path').join(__dirname, '../uploads/slips', existingPayout.slipImagePath);
        require('fs').existsSync(oldPath) && require('fs').unlinkSync(oldPath);
      } catch (e) {
        debug('⚠️ Cannot remove old slip:', e.message);
      }
    }

    // อัพเดทข้อมูลสลิปในตาราง Payout
    const updatedPayout = await prisma.payout.update({
      where: {
        id: existingPayout.id
      },
      data: {
        slipImagePath: fileName,
        slipUploadDate: new Date(uploadDate),
        slipUploadedBy: req.user.id
      }
    });

    // อัพเดทสถานะการโอนเงินในตาราง seller (ถ้ามี)
    // หมายเหตุ: ไม่มีฟิลด์ lastPayoutDate และ lastPayoutAmount ใน Seller model
    // จึงไม่ต้องอัพเดทตาราง seller



    res.json({
      success: true,
      message: 'อัพโหลดสลิปสำเร็จ',
      data: {
        payoutId: updatedPayout.id,
        sellerId: updatedPayout.sellerId,
        amount: updatedPayout.amount,
        slipImagePath: updatedPayout.slipImagePath,
        uploadDate: updatedPayout.slipUploadDate
      }
    });

  } catch (error) {
    console.error('❌ Error uploading slip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการอัพโหลดสลิป',
      error: error.message 
    });
  }
});

// Unified handler: ยืนยันการโอนเงินของ seller
const confirmTransferHandler = async (req, res) => {
  try {
    const sellerId = getSellerIdParam(req);
    const { status, confirmedAt } = req.body;

  debug('🔍 Confirming transfer for seller ID:', sellerId);
  debug('🔍 Request body:', req.body);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!status || !confirmedAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ครบถ้วน' 
      });
    }

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'sellerId ไม่ถูกต้อง' });
    }

    // ดึงข้อมูล seller และ orders เพื่อคำนวณจำนวนเงิน
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        orders: {
          where: {
            status: 'VERIFIED'
          },
          select: {
            amount: true
          }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบผู้ขาย' 
      });
    }

    // คำนวณจำนวนเงิน
    const totalAmount = seller.orders.reduce((sum, order) => sum + order.amount, 0);
    const commission = Math.round((totalAmount * 0.15) * 100) / 100; // ปัดเศษให้ถูกต้อง
    const netAmount = totalAmount - commission;

  debug('💰 Transfer amounts:', { totalAmount, commission, netAmount });

    // สร้าง Payout record ใหม่ (ตารางไม่มีเขตเวลา weekStart/weekEnd)
    const payoutRecord = await prisma.payout.create({
      data: {
  sellerId: sellerId,
        amount: totalAmount,
        netAmount: netAmount,
        commission: commission,
        status: status,
        confirmedAt: new Date(confirmedAt)
      }
    });

  debug('✅ Transfer confirmed successfully');

    res.json({
      success: true,
      message: 'ยืนยันการโอนเงินสำเร็จ',
      data: {
        payoutId: payoutRecord.id,
        status: status,
        confirmedAt: confirmedAt
      }
    });

  } catch (error) {
    console.error('❌ Error confirming transfer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการยืนยันการโอนเงิน',
      error: error.message 
    });
  }
};

// New route (preferred)
router.put('/payouts/seller/:sellerId/confirm-transfer', protect, requireAdmin, confirmTransferHandler);
// Legacy route (kept for backward compatibility)
router.put('/payouts/:payoutId/confirm-transfer', protect, requireAdmin, confirmTransferHandler);

module.exports = router;