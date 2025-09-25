const { prisma } = require('../config/database');
const {
  getCommissionRateFraction,
  getCommissionRatePercent,
  setCommissionRatePercent,
  getPayoutSchedule,
  setPayoutSchedule,
  getSettings
} = require('../utils/appSettings');

// @desc    Get financial statistics
// @route   GET /api/admin/finance/stats
// @access  Private (Admin)
const getFinanceStats = async (req, res) => {
  try {
    // Get total revenue from orders
    const totalRevenue = await prisma.order.aggregate({
      where: {
        status: 'VERIFIED'
      },
      _sum: {
        amount: true
      }
    });

    // Get this month's revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthRevenue = await prisma.order.aggregate({
      where: {
        status: 'VERIFIED',
        createdAt: {
          gte: thisMonth
        }
      },
      _sum: {
        amount: true
      }
    });

  // Get current commission rate from AppSettings
  const commissionRate = await getCommissionRateFraction();

    // Calculate commission based on current rate
    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const thisMonthRevenueAmount = thisMonthRevenue._sum.amount || 0;
    
    const totalCommission = Math.round((totalRevenueAmount * commissionRate) * 100) / 100;
    const thisMonthCommission = Math.round((thisMonthRevenueAmount * commissionRate) * 100) / 100;

    // Get payout sums from payouts table (status COMPLETED)
    const payoutAggAll = await prisma.payout.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { netAmount: true }
    });
    const payoutAggMonth = await prisma.payout.aggregate({
      where: { status: 'COMPLETED', confirmedAt: { gte: thisMonth } },
      _sum: { netAmount: true }
    });
    const totalPayout = payoutAggAll._sum.netAmount || 0;
    const thisMonthPayout = payoutAggMonth._sum.netAmount || 0;
     
  // Calculate this month pending payout
  const thisMonthPendingPayout = thisMonthRevenueAmount - thisMonthCommission;

  // Calculate pending payout (total revenue - commission = money for sheet owners)
  const pendingPayout = totalRevenueAmount - totalCommission;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenueAmount,
        totalCommission,
        totalPayout,
        pendingPayout,
        thisMonthRevenue: thisMonthRevenueAmount,
        thisMonthCommission,
        thisMonthPayout: thisMonthPendingPayout
      }
    });
  } catch (error) {
    console.error('[Finance] getFinanceStats error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while fetching finance stats' });
  }
};

// @desc    Get pending payouts
// @route   GET /api/admin/finance/pending-payouts
// @access  Private (Admin)
const getPendingPayouts = async (req, res) => {
  try {
    // Get sellers with pending payouts
    const sellers = await prisma.seller.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        },
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

  // Get current commission rate from AppSettings
  const commissionRate = await getCommissionRateFraction();

    const pendingPayouts = await Promise.all(sellers.map(async (seller) => {
      const totalAmount = seller.orders.reduce((sum, order) => sum + order.amount, 0);
      const commission = Math.round((totalAmount * commissionRate) * 100) / 100;
      const netAmount = totalAmount - commission; // เงินที่เจ้าของชีทได้ (หลังหักค่าคอมมิชชัน)

      // ดึงข้อมูลการโอนล่าสุดจาก Payout table
      
      const lastPayout = await prisma.payout.findFirst({
        where: {
          sellerId: seller.id,
          status: 'COMPLETED'
        },
        orderBy: {
          confirmedAt: 'desc'
        },
        select: {
          confirmedAt: true,
          netAmount: true,
          status: true
        }
      });


      // สร้างข้อความการโอนล่าสุด
      let lastTransferText = 'ไม่ระบุ';
      if (lastPayout) {
        const lastTransferDate = new Date(lastPayout.confirmedAt);
        const formattedDate = lastTransferDate.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = lastTransferDate.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit'
        });
        lastTransferText = `${formattedDate} เวลา ${formattedTime}`;
      }

      // ตรวจสอบสถานะ: ถ้ามี payout ที่ COMPLETED แล้ว ให้แสดงเป็น COMPLETED
      const status = lastPayout ? 'COMPLETED' : 'PENDING';

      return {
        id: seller.id, // ใช้ seller.id เป็นหลัก (ตัวเลข)
        sellerId: seller.id, // ใช้ seller.id แทน seller.sellerId
        sellerName: seller.penName,
        email: seller.user.email,
        amount: totalAmount, // รายได้รวม (เงินที่ลูกค้าจ่าย)
        commission, // ค่าคอมมิชชัน 15% (ที่ระบบเก็บ)
        netAmount, // เงินที่เจ้าของชีทได้ (หลังหักค่าคอมมิชชัน)
        // ข้อมูลธนาคาร
        bankName: seller.bankName || seller.bank_name || 'ไม่ระบุ',
        bankAccount: seller.bankAccount || seller.bank_account || 'ไม่ระบุ',
        accountName: seller.accountName || seller.account_name || 'ไม่ระบุ',
        promptPayId: seller.promptPayId || seller.prompt_pay_id || null,
        phoneNumber: seller.phone || 'ไม่ระบุ',
        status: status, // ใช้สถานะที่ตรวจสอบแล้ว
        createdAt: seller.createdAt,
        orders: seller.orders.length,
        lastTransfer: lastTransferText
      };
    }));

    const filteredPayouts = pendingPayouts.filter(payout => payout.amount > 0);

    res.json({
      success: true,
      data: filteredPayouts
    });
  } catch (error) {
    console.error('[Finance] getPendingPayouts error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending payouts'
    });
  }
};

// @desc    Get recent transactions
// @route   GET /api/admin/finance/recent-transactions
// @access  Private (Admin)
const getRecentTransactions = async (req, res) => {
  try {
    // Get recent verified orders
    const recentOrders = await prisma.order.findMany({
      where: {
        status: 'VERIFIED'
      },
      include: {
        sheet: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

  // Get current commission rate from AppSettings
  const commissionRate = await getCommissionRateFraction();

    const transactions = recentOrders.map(order => {
      const commission = Math.round((order.amount * commissionRate) * 100) / 100;
      const sellerAmount = order.amount - commission;

      return {
        id: order.id,
        orderId: order.id,
        customerName: order.user.fullName,
        sheetTitle: order.sheet.title,
        amount: order.amount,
        commission,
        sellerAmount,
        date: order.createdAt.toISOString().split('T')[0],
        status: 'completed'
      };
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('[Finance] getRecentTransactions error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent transactions'
    });
  }
};

// @desc    Get payout history
// @route   GET /api/admin/finance/payout-history
// @access  Private (Admin)
const getPayoutHistory = async (req, res) => {
  try {
    // Get completed payouts from database
    const payouts = await prisma.payout.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        seller: {
          select: {

            penName: true
          }
        }
      },
      orderBy: {
        confirmedAt: 'desc'
      },
      take: 20
    });

    const payoutHistory = await Promise.all(payouts.map(async (payout) => {
      // ใช้วิธีเดียวกับ pending payouts - ดึง orders ของ seller โดยตรง
      
      // ดึง seller พร้อม orders (เหมือน pending payouts)
      const sellerWithOrders = await prisma.seller.findUnique({
        where: { id: payout.sellerId },
        include: {
          orders: {
            where: {
              status: 'VERIFIED'  // ใช้ filter เดียวกับ pending payouts
            }
          }
        }
      });
      
      const orders = sellerWithOrders ? sellerWithOrders.orders.length : 0;

      return {
        id: payout.id,
        sellerName: payout.seller.penName,
        amount: payout.netAmount,
        orders: orders,
        date: payout.confirmedAt.toISOString().split('T')[0],
        status: 'completed',
        reference: `PAY${payout.id.toString().padStart(3, '0')}`
      };
    }));

    res.json({
      success: true,
      data: payoutHistory
    });
  } catch (error) {
    console.error('[Finance] getPayoutHistory error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payout history'
    });
  }
};

// @desc    Process payout
// @route   POST /api/admin/finance/payouts/:id/process
// @access  Private (Admin)
const processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the seller
    const seller = await prisma.seller.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            email: true
          }
        },
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

  // Get current commission rate from AppSettings
  const commissionRate = await getCommissionRateFraction();

    // Calculate payout amount
    const totalAmount = seller.orders.reduce((sum, order) => sum + order.amount, 0);
    const commission = Math.round((totalAmount * commissionRate) * 100) / 100;
    const netAmount = totalAmount - commission;

    if (netAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีเงินรอโอน'
      });
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        sellerId: seller.id,
        amount: totalAmount,
        netAmount: netAmount,
        commission: commission,
        status: 'COMPLETED',
        weekStart: new Date(),
        weekEnd: new Date(),
        confirmedAt: new Date()
      }
    });

    // Create payout slip record
    await prisma.payoutSlip.create({
      data: {
        sellerId: seller.id,
        payoutId: payout.id,
        amount: netAmount,
        slipImagePath: 'PROCESSED_PAYOUT',
        uploadDate: new Date(),
        uploadedBy: req.user.id,
        status: 'VERIFIED'
      }
    });

    res.json({
      success: true,
      data: {
        id: payout.id,
        sellerName: seller.penName,
        amount: netAmount,
        orders: seller.orders.length,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('[Finance] processPayout error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while processing payout'
    });
  }
};

// @desc    Update commission rate
// @route   PUT /api/admin/finance/commission-rate
// @access  Private (Admin)
const updateCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    
    if (!commissionRate || isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'อัตราค่าคอมมิชชันต้องเป็นตัวเลขระหว่าง 0-100'
      });
    }

  // Store commission rate in AppSettings (percentage)
  await setCommissionRatePercent(parseFloat(commissionRate));
    
    
    res.json({
      success: true,
      data: {
        commissionRate: parseFloat(commissionRate)
      }
    });
  } catch (error) {
    console.error('[Finance] updateCommissionRate error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while updating commission rate'
    });
  }
};

// @desc    Get system settings
// @route   GET /api/admin/finance/settings
// @access  Private (Admin)
const getSystemSettings = async (req, res) => {
  try {
    // Get settings from AppSettings
    const raw = await getSettings();
    const settings = {
      commissionRate: typeof raw.commissionRate === 'number' ? raw.commissionRate : parseFloat(raw.commissionRate || '15'),
      payoutSchedule: raw.payoutSchedule || 'weekly'
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('[Finance] getSystemSettings error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system settings'
    });
  }
};

// @desc    Update payout schedule
// @route   PUT /api/admin/finance/payout-schedule
// @access  Private (Admin)
const updatePayoutSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    if (!schedule || !['weekly', 'monthly'].includes(schedule)) {
      return res.status(400).json({
        success: false,
        message: 'รอบการโอนเงินต้องเป็น weekly หรือ monthly'
      });
    }

  // Store payout schedule in AppSettings
  await setPayoutSchedule(schedule);
    
    
    res.json({
      success: true,
      data: {
        payoutSchedule: schedule
      }
    });
  } catch (error) {
    console.error('[Finance] updatePayoutSchedule error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while updating payout schedule'
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
const updateSystemSettings = async (req, res) => {
  try {
  const { commissionRate, payoutSchedule } = req.body;

    // Update commission rate if provided
    if (commissionRate !== undefined) {
      await setCommissionRatePercent(parseFloat(commissionRate));
    }

    // Update payout schedule if provided
    if (payoutSchedule !== undefined) {
      await setPayoutSchedule(payoutSchedule);
    }

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('[Finance] updateSystemSettings error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error while updating system settings'
    });
  }
};

module.exports = {
  getFinanceStats,
  getPendingPayouts,
  getRecentTransactions,
  getPayoutHistory,
  processPayout,
  updateCommissionRate,
  updatePayoutSchedule,
  getSystemSettings,
  updateSystemSettings
};
