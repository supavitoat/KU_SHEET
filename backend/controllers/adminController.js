const { prisma } = require('../config/database');
const crypto = require('crypto');
const { THAI_MONTH_SHORT } = require('../utils/dateHelpers');

// Allowed activity types (moved from inline inside getDashboardStats for clarity)
const ALLOWED_ACTIVITY_TYPES = new Set(['user_registration','sheet_upload','order_complete']);

// Simple in-memory cache for expensive admin dashboard computations
// Structure: { data: <payload>, etag: <string>, expiresAt: <timestamp ms> }
let dashboardCache = null;
const DASHBOARD_CACHE_TTL_MS = parseInt(process.env.ADMIN_DASHBOARD_CACHE_TTL || '30000', 10); // default 30s

const isCacheValid = () => {
  return dashboardCache && dashboardCache.expiresAt > Date.now();
};

const setDashboardCache = (data, etag) => {
  dashboardCache = { data, etag, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS };
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} นาทีที่แล้ว`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ชั่วโมงที่แล้ว`;
  } else {
    return `${diffInDays} วันที่แล้ว`;
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    if (isCacheValid()) {
      // Support conditional requests with ETag
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && dashboardCache.etag && ifNoneMatch.replace(/"/g,'') === dashboardCache.etag) {
        return res.status(304).end();
      }
      res.set('ETag', `"${dashboardCache.etag}"`);
      return res.status(200).json({ success: true, data: dashboardCache.data, cached: true });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Date ranges for weekly growth (current 7 days vs previous 7 days)
    const currentWeekStart = new Date(now); currentWeekStart.setDate(now.getDate() - 6); // inclusive 7-day window
    const previousWeekEnd = new Date(currentWeekStart); previousWeekEnd.setDate(currentWeekStart.getDate() - 1);
    const previousWeekStart = new Date(previousWeekEnd); previousWeekStart.setDate(previousWeekEnd.getDate() - 6);

    const [
      totalUsers, totalSheets, totalOrders,
      monthlyUsers, monthlySheets, monthlyOrders,
      currentWeekUsers, previousWeekUsers,
      currentWeekSheets, previousWeekSheets,
      currentWeekOrders, previousWeekOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.sheet.count({ where: { status: 'APPROVED' } }),
      prisma.order.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.sheet.count({ where: { createdAt: { gte: startOfMonth }, status: 'APPROVED' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: currentWeekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: previousWeekStart, lte: previousWeekEnd } } }),
      prisma.sheet.count({ where: { createdAt: { gte: currentWeekStart }, status: 'APPROVED' } }),
      prisma.sheet.count({ where: { createdAt: { gte: previousWeekStart, lte: previousWeekEnd }, status: 'APPROVED' } }),
      prisma.order.count({ where: { createdAt: { gte: currentWeekStart } } }),
      prisma.order.count({ where: { createdAt: { gte: previousWeekStart, lte: previousWeekEnd } } })
    ]);

  const { getCommissionRateFraction } = require('../utils/appSettings');
  const commissionRate = await getCommissionRateFraction();

    const [totalRevenueAgg, monthlyRevenueAgg, currentWeekRevenueAgg, previousWeekRevenueAgg] = await Promise.all([
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' } } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' }, createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' }, createdAt: { gte: currentWeekStart } } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' }, createdAt: { gte: previousWeekStart, lte: previousWeekEnd } } })
    ]);
  const totalRevenueAmount = totalRevenueAgg._sum.amount || 0;
  const monthlyRevenueAmount = monthlyRevenueAgg._sum.amount || 0;
  const currentWeekRevenueAmount = currentWeekRevenueAgg._sum.amount || 0;
  const previousWeekRevenueAmount = previousWeekRevenueAgg._sum.amount || 0;
  const totalRevenue = Math.round((totalRevenueAmount * commissionRate) * 100) / 100;
  const monthlyRevenue = Math.round((monthlyRevenueAmount * commissionRate) * 100) / 100;
  const currentWeekRevenue = Math.round((currentWeekRevenueAmount * commissionRate) * 100) / 100;
  const previousWeekRevenue = Math.round((previousWeekRevenueAmount * commissionRate) * 100) / 100;

    const [recentUsers, recentSheets, recentOrders, topSheetsGroup] = await Promise.all([
      prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, email: true, createdAt: true, role: true, picture: true } }),
      prisma.sheet.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { seller: { include: { user: { select: { fullName: true, email: true, picture: true } } } } } }),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, where: { status: 'VERIFIED' }, include: { user: { select: { fullName: true, email: true, picture: true } } } }),
      // top sheets by number of VERIFIED orders
      prisma.order.groupBy({
        by: ['sheetId'],
        where: { status: 'VERIFIED' },
        _count: { sheetId: true },
        _sum: { amount: true },
        orderBy: { _count: { sheetId: 'desc' } },
        take: 5
      })
    ]);

    // Fetch sheet details for top sheets
    let topSheets = [];
    if (topSheetsGroup.length) {
      const sheetIds = topSheetsGroup.map(t => t.sheetId).filter(Boolean);
      const sheetsMap = sheetIds.length ? (await prisma.sheet.findMany({
        where: { id: { in: sheetIds } },
        include: { seller: { include: { user: { select: { fullName: true, email: true, picture: true } } } } }
      })).reduce((acc, s) => { acc[s.id] = s; return acc; }, {}) : {};
      topSheets = topSheetsGroup.map(g => {
        const sheet = sheetsMap[g.sheetId] || null;
        const gross = g._sum.amount || 0;
        return {
          sheetId: g.sheetId,
          salesCount: g._count.sheetId,
            grossAmount: gross,
          commissionAmount: Math.round((gross * commissionRate) * 100) / 100,
          sheet
        };
      });
    }

    const activities = [];
    recentUsers.forEach(u => activities.push({ id: `user_${u.id}`, type: 'user_registration', fullName: u.fullName, email: u.email, createdAt: u.createdAt, message: `ผู้ใช้ใหม่: ${u.fullName || u.email}` }));
    recentSheets.forEach(s => activities.push({ id: `sheet_${s.id}`, type: 'sheet_upload', fullName: s.seller?.user?.fullName, email: s.seller?.user?.email, createdAt: s.createdAt, message: `${s.seller?.user?.fullName || s.seller?.user?.email} อัพโหลดชีท: ${s.title}` }));
    recentOrders.forEach(o => activities.push({ id: `order_${o.id}`, type: 'order_complete', fullName: o.user?.fullName, email: o.user?.email, createdAt: o.createdAt, message: `${o.user?.fullName || o.user?.email} สั่งซื้อชีทสำเร็จ (฿${o.amount})` }));
  // Sanitize: allow only real activity types to avoid synthetic/statistical noise
  const recentActivities = activities
      .filter(a => ALLOWED_ACTIVITY_TYPES.has(a.type))
      .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
      .slice(0,5)
      .map(a=>({...a,time:formatTimeAgo(a.createdAt)}));

    // Weekly growth calculations helper
    const growth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const weeklyGrowth = {
      users: growth(currentWeekUsers, previousWeekUsers),
      sheets: growth(currentWeekSheets, previousWeekSheets),
      orders: growth(currentWeekOrders, previousWeekOrders),
      revenue: growth(currentWeekRevenue, previousWeekRevenue)
    };

    const systemHealth = { status: 'healthy', database: 'online', storage: 'online', api: 'online' };
    const stats = { totalUsers, totalSheets, totalOrders, totalRevenue, monthlyUsers, monthlySheets, monthlyOrders, monthlyRevenue, recentActivities, systemHealth, weeklyGrowth, topSheets };
    const dashboardSheets = recentSheets.slice(0,5);
    const payload = { ...stats, recentSheets: dashboardSheets, generatedAt: new Date().toISOString() };
    const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    setDashboardCache(payload, etag);
    res.set('ETag', `"${etag}"`);
    res.status(200).json({ success: true, data: payload, cached: false });
  } catch (error) {
  console.error('[Admin] dashboardStats failed', { message: error.message });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดสถิติ' });
  }
};

const { setCache: setGenericCache, getCache: getGenericCache } = require('../utils/cache');
const { withPrismaRetry } = require('../utils/prismaRetry');
const getUserAnalytics = async (req, res) => {
  try {
    const cacheKey = 'admin:userAnalytics';
    const cached = getGenericCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, cached: true });
    }
    
    // Get current date and calculate date ranges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get monthly data for the last 6 months
    // Last 6 months parallel aggregation
    const monthNames = THAI_MONTH_SHORT;
    const monthTargets = Array.from({ length: 6 }).map((_, idx) => {
      const offset = 5 - idx; // 5..0
      const target = new Date(currentYear, currentMonth - offset, 1);
      return target;
    });
    const monthRanges = monthTargets.map(d => ({
      label: monthNames[d.getMonth()],
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    }));
    const monthCounts = await Promise.all(monthRanges.map(r => prisma.user.count({ where: { createdAt: { gte: r.start, lte: r.end } } })));
    const monthlyData = monthRanges.map((r, i) => ({ month: r.label, value: monthCounts[i] }));
    
    // Get total users
  const totalUsers = await withPrismaRetry(()=>prisma.user.count());
    
    // Get users this month
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const usersThisMonth = await withPrismaRetry(()=>prisma.user.count({
      where: {
        createdAt: {
          gte: startOfCurrentMonth
        }
      }
  }));
    
    // Get users last month for growth calculation
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const startOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
    const endOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59);
    
  const usersLastMonth = await withPrismaRetry(()=>prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
  }));
    
    // Calculate growth percentage with better logic
    let growth = 0;
    if (usersLastMonth === 0 && usersThisMonth > 0) {
      growth = 100; // New users this month
    } else if (usersLastMonth > 0) {
      growth = Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100);
    }
    
    // Get recent user registrations
  const recentUsers = await withPrismaRetry(()=>prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
            select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        role: true,
        picture: true
      }
  }));
    
    // Get user roles distribution
  const roleDistribution = await withPrismaRetry(()=>prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
  }));
    
    // Get daily registrations for the last 30 days
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
  const dailyCount = await withPrismaRetry(()=>prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
  }));
      
      dailyData.push({
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        value: dailyCount
      });
    }
    
    // Prepare response data
    const responseData = {
      total: totalUsers,
      monthly: usersThisMonth,
      growth: growth,
      monthlyData: monthlyData,
      dailyData: dailyData,
      roleDistribution: roleDistribution,
      recentUsers: recentUsers.map(user => ({
        ...user,
        time: formatTimeAgo(user.createdAt)
      }))
    };
    
    // Send response
  setGenericCache(cacheKey, responseData, 30 * 1000);
  res.status(200).json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
  console.error('[Admin] getUserAnalytics failed', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติผู้ใช้'
    });
  }
};

/**
 * Get system health status
 * GET /api/admin/system/health
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const healthChecks = {
      database: 'offline',
      storage: 'offline',
      api: 'offline',
      general: 'offline'
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = 'online';
      healthChecks.general = 'online';
    } catch (error) {
  console.error('[Admin] health db check failed', { message: error.message });
      healthChecks.database = 'offline';
      healthChecks.general = 'offline';
    }

    // Check file storage (uploads directory)
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadsPath = path.join(__dirname, '../uploads');
      
      if (fs.existsSync(uploadsPath)) {
        // Check if directory is writable
        try {
          fs.accessSync(uploadsPath, fs.constants.W_OK);
          healthChecks.storage = 'online';
        } catch (error) {
          healthChecks.storage = 'offline';
        }
      } else {
        healthChecks.storage = 'offline';
      }
    } catch (error) {
  console.error('[Admin] health storage check failed', { message: error.message });
      healthChecks.storage = 'offline';
    }

    // Check API responsiveness
    try {
      // Simple API test - check if we can query basic data
      await prisma.user.count();
      healthChecks.api = 'online';
    } catch (error) {
  console.error('[Admin] health api check failed', { message: error.message });
      healthChecks.api = 'offline';
    }

    // Overall system status
    const allOnline = Object.values(healthChecks).every(status => status === 'online');
    healthChecks.general = allOnline ? 'online' : 'offline';

    res.json({
      success: true,
      data: {
        systemHealth: healthChecks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });

  } catch (error) {
  console.error('[Admin] systemHealth failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบสถานะระบบได้',
      error: error.message
    });
  }
};

/**
 * Get system health status
 * GET /api/admin/system/health
 */
const getSystemHealth = async (req, res) => {
  try {
    const healthChecks = {
      database: 'offline',
      storage: 'offline',
      api: 'offline',
      general: 'offline'
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = 'online';
      healthChecks.general = 'online';
    } catch (error) {
  console.error('[Admin] health db check failed', { message: error.message });
      healthChecks.database = 'offline';
      healthChecks.general = 'offline';
    }

    // Check file storage (uploads directory)
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadsPath = path.join(__dirname, '../uploads');
      
      if (fs.existsSync(uploadsPath)) {
        // Check if directory is writable
        try {
          fs.accessSync(uploadsPath, fs.constants.W_OK);
          healthChecks.storage = 'online';
        } catch (error) {
          healthChecks.storage = 'offline';
        }
      } else {
        healthChecks.storage = 'offline';
      }
    } catch (error) {
  console.error('[Admin] health storage check failed', { message: error.message });
      healthChecks.storage = 'offline';
    }

    // Check API responsiveness
    try {
      // Simple API test - check if we can query basic data
      await prisma.user.count();
      healthChecks.api = 'online';
    } catch (error) {
  console.error('[Admin] health api check failed', { message: error.message });
      healthChecks.api = 'offline';
    }

    // Overall system status
    const allOnline = Object.values(healthChecks).every(status => status === 'online');
    healthChecks.general = allOnline ? 'online' : 'offline';

    res.json({
      success: true,
      data: {
        systemHealth: healthChecks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });

  } catch (error) {
  console.error('[Admin] systemHealth failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบสถานะระบบได้',
      error: error.message
    });
  }
};

/**
 * Get sheet analytics data
 * GET /api/admin/analytics/sheets
 */
const getSheetAnalytics = async (req, res) => {
  try {
    const cacheKey = 'admin:sheetAnalytics';
    const cached = getGenericCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });
    
    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get total sheets count
  const totalSheets = await withPrismaRetry(()=>prisma.sheet.count());
    
    // Get sheets count for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
  const sheetsThisMonth = await withPrismaRetry(()=>prisma.sheet.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
  }));
    
    // Get sheets count for last month
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
  const sheetsLastMonth = await withPrismaRetry(()=>prisma.sheet.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
  }));
    
    // Calculate growth percentage
    let growth = 0;
    if (sheetsLastMonth > 0) {
      growth = ((sheetsThisMonth - sheetsLastMonth) / sheetsLastMonth) * 100;
    } else if (sheetsThisMonth > 0) {
      growth = 100; // 100% growth if there were no sheets last month
    }
    
    // Get monthly data for chart (last 12 months to show more meaningful data)
    const sheetMonthTargets = Array.from({ length: 12 }).map((_, idx) => new Date(currentYear, currentMonth - (11 - idx), 1));
    const sheetMonthRanges = sheetMonthTargets.map(d => ({
      label: d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    }));
  const sheetMonthCounts = await Promise.all(sheetMonthRanges.map(r => withPrismaRetry(()=>prisma.sheet.count({ where: { createdAt: { gte: r.start, lte: r.end } } }))));
    const monthlyData = sheetMonthRanges.map((r,i)=>({ month: r.label, count: sheetMonthCounts[i] }));
    
    // Get daily data for chart (last 30 days to show more meaningful data)
    const sheetDayTargets = Array.from({ length: 30 }).map((_, idx) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - idx)); return d; });
    const sheetDayRanges = sheetDayTargets.map(d => ({
      label: d.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999)
    }));
  const sheetDayCounts = await Promise.all(sheetDayRanges.map(r => withPrismaRetry(()=>prisma.sheet.count({ where: { createdAt: { gte: r.start, lte: r.end } } }))));
    let dailyData = sheetDayRanges.map((r,i)=>({ day: r.label, count: sheetDayCounts[i] }));
    dailyData = dailyData.filter((d,i)=> d.count>0 || i>= dailyData.length-7);
    
    // Ensure we have at least 7 days of data
    if (dailyData.length < 7) {
      // Add missing days with 0 count
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dayStr = targetDate.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!dailyData.find(item => item.day === dayStr)) {
          dailyData.push({
            day: dayStr,
            count: 0
          });
        }
      }
      
      // Sort by date
      dailyData.sort((a, b) => {
        const dateA = new Date(a.day.split(' ').pop()); // Extract date part
        const dateB = new Date(b.day.split(' ').pop());
        return dateA - dateB;
      });
    }
    
    // Get recent sheets
  const recentSheets = await withPrismaRetry(()=>prisma.sheet.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          include: {
            user: {
          select: {
                fullName: true,
                email: true,
                picture: true
              }
            }
          }
        }
      }
  }));
    
    // Get status distribution
  const statusDistribution = await withPrismaRetry(()=>prisma.sheet.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
  }));
    
  const responsePayload = { totalSheets, sheetsThisMonth, growth: Math.round(growth * 100) / 100, monthlyData, dailyData, recentSheets, statusDistribution };
  setGenericCache(cacheKey, responsePayload, 30 * 1000);
  res.json({ success: true, data: responsePayload });
    
  } catch (error) {
  console.error('[Admin] sheetAnalytics failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลชีทได้',
      error: error.message
    });
  }
};

/**
 * Get order analytics data
 * GET /api/admin/analytics/orders
 */
const getOrderAnalytics = async (req, res) => {
  try {
    const cacheKey = 'admin:orderAnalytics';
    const cached = getGenericCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });
    
    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get total orders count
  const totalOrders = await withPrismaRetry(()=>prisma.order.count());
    
    // Get orders count for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
  const ordersThisMonth = await withPrismaRetry(()=>prisma.order.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
  }));
    
    // Get orders count for last month
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
  const ordersLastMonth = await withPrismaRetry(()=>prisma.order.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
  }));
    
    // Calculate growth percentage
    let growth = 0;
    if (ordersLastMonth > 0) {
      growth = ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100;
    } else if (ordersThisMonth > 0) {
      growth = 100; // 100% growth if there were no orders last month
    }
    
    // Get monthly data for chart (last 12 months)
    const orderMonthTargets = Array.from({ length: 12 }).map((_, idx) => new Date(currentYear, currentMonth - (11 - idx), 1));
    const orderMonthRanges = orderMonthTargets.map(d => ({
      label: d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    }));
  const orderMonthCounts = await Promise.all(orderMonthRanges.map(r => withPrismaRetry(()=>prisma.order.count({ where: { createdAt: { gte: r.start, lte: r.end } } }))));
    const monthlyData = orderMonthRanges.map((r,i)=>({ month: r.label, count: orderMonthCounts[i] }));
    
    // Get daily data for chart (last 30 days to show more meaningful data)
    const orderDayTargets = Array.from({ length: 30 }).map((_, idx) => { const d = new Date(); d.setDate(d.getDate() - (29 - idx)); return d; });
    const orderDayRanges = orderDayTargets.map(d => ({
      label: d.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999)
    }));
  const orderDayCounts = await Promise.all(orderDayRanges.map(r => withPrismaRetry(()=>prisma.order.count({ where: { createdAt: { gte: r.start, lte: r.end } } }))));
    let dailyData = orderDayRanges.map((r,i)=>({ day: r.label, count: orderDayCounts[i] }));
    dailyData = dailyData.filter((d,i)=> d.count>0 || i>= dailyData.length-7);
    
    // Ensure we have at least 7 days of data
    if (dailyData.length < 7) {
      // Add missing days with 0 count
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dayStr = targetDate.toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!dailyData.find(item => item.day === dayStr)) {
          dailyData.push({
            day: dayStr,
            count: 0
          });
        }
      }
      
      // Sort by date
      dailyData.sort((a, b) => {
        const dateA = new Date(a.day.split(' ').pop()); // Extract date part
        const dateB = new Date(b.day.split(' ').pop());
        return dateA - dateB;
      });
    }
    
         // Get recent orders
  const recentOrders = await withPrismaRetry(()=>prisma.order.findMany({
       take: 10,
       orderBy: { createdAt: 'desc' },
       include: {
         user: {
           select: {
             fullName: true,
             email: true,
             picture: true
           }
         },
         sheet: {
           select: {
             title: true
           }
         }
       }
  }));
    
    // Get status distribution
  const statusDistribution = await withPrismaRetry(()=>prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
  }));

  const responsePayload = { totalOrders, ordersThisMonth, growth: Math.round(growth * 100) / 100, monthlyData, dailyData, recentOrders, statusDistribution };
  setGenericCache(cacheKey, responsePayload, 30 * 1000);
  res.json({ success: true, data: responsePayload });
    
  } catch (error) {
  console.error('[Admin] orderAnalytics failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้',
      error: error.message
    });
  }
};

// @desc    Get all users with filters and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    
    
    // Test database connection first
    await prisma.$connect();
    
    
    // Extract query parameters
    const { sanitizePagination, validateSort } = require('../utils/validation');
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Build where clause for filtering
    const where = {};
    
    // Search filter (name or email)
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } }
      ];
    }
    
    // Role filter
    if (role) {
      where.role = role;
    }
    
    // Status filter (isBanned)
    if (status === 'banned') {
      where.isBanned = true;
    } else if (status === 'active') {
      where.isBanned = false;
    }
    
    // Calculate pagination
  const { page: pageNum, limit: limitNum, skip } = sanitizePagination(page, limit, { maxLimit: 100 });
  const { field, dir } = validateSort(sortBy, order, ['createdAt','email','fullName','role']);
    
    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });
    
    // Get users with filters and pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        picture: true,
        isBanned: true,
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      },
  orderBy: { [field]: dir },
      skip,
      take: limitNum
    });

    
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;
    
    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
      limit: limitNum
    };
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination
      }
    });
  } catch (error) {
  console.error('[Admin] getUsers failed', { name: error.name, message: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            sheet: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
  console.error('[Admin] getUserById failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้'
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private (Admin only)
const getRevenueAnalytics = async (req, res) => {
  try {
    const cacheKey = 'admin:revenueAnalytics';
    const cached = getGenericCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get commission rate from settings
  const { getCommissionRateFraction } = require('../utils/appSettings');
    const commissionRate = await getCommissionRateFraction();
    
    // Get total revenue
  const totalRevenue = await withPrismaRetry(()=>prisma.order.aggregate({
      where: {
        status: 'VERIFIED',
        paymentMethod: { not: 'FREE' }
      },
      _sum: {
        amount: true
      }
  }));
    
    // Get revenue this month
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  const revenueThisMonth = await withPrismaRetry(()=>prisma.order.aggregate({
      where: {
        status: 'VERIFIED',
        paymentMethod: { not: 'FREE' },
        createdAt: { gte: startOfCurrentMonth }
      },
      _sum: {
        amount: true
      }
  }));
    
    // Get revenue last month
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
  const revenueLastMonth = await withPrismaRetry(()=>prisma.order.aggregate({
      where: {
        status: 'VERIFIED',
        paymentMethod: { not: 'FREE' },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      _sum: {
        amount: true
      }
  }));
    
    // Calculate commission amounts
    const totalCommission = Math.round(((totalRevenue._sum.amount || 0) * commissionRate) * 100) / 100;
    const currentMonthCommission = Math.round(((revenueThisMonth._sum.amount || 0) * commissionRate) * 100) / 100;
    const lastMonthCommission = Math.round(((revenueLastMonth._sum.amount || 0) * commissionRate) * 100) / 100;
    
    // Calculate growth percentage (based on commission)
    let growth = 0;
    if (lastMonthCommission > 0) {
      growth = Math.round(((currentMonthCommission - lastMonthCommission) / lastMonthCommission) * 100);
    } else if (currentMonthCommission > 0) {
      growth = 100; // If no revenue last month but have revenue this month = 100% growth
    }
    
    // Get monthly revenue data (12 months)
    const revenueMonthTargets = Array.from({ length: 12 }).map((_, idx) => new Date(currentYear, currentMonth - (11 - idx), 1));
    const revenueMonthRanges = revenueMonthTargets.map(d => ({
      label: THAI_MONTH_SHORT[d.getMonth()],
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    }));
  const revenueMonthAggs = await Promise.all(revenueMonthRanges.map(r => withPrismaRetry(()=>prisma.order.aggregate({
      where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' }, createdAt: { gte: r.start, lte: r.end } },
      _sum: { amount: true }
  }))));
    const monthlyData = revenueMonthAggs.map((agg,i)=> ({ month: revenueMonthRanges[i].label, revenue: Math.round(((agg._sum.amount || 0) * commissionRate) * 100)/100 }));
    
    // Get daily revenue data (30 days)
    const revenueDayTargets = Array.from({ length: 30 }).map((_, idx) => { const d = new Date(); d.setDate(d.getDate() - (29 - idx)); return d; });
    const revenueDayRanges = revenueDayTargets.map(d => ({
      label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(),0,0,0),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(),23,59,59)
    }));
  const revenueDayAggs = await Promise.all(revenueDayRanges.map(r => withPrismaRetry(()=>prisma.order.aggregate({
      where: { status: 'VERIFIED', paymentMethod: { not: 'FREE' }, createdAt: { gte: r.start, lte: r.end } },
      _sum: { amount: true }
  }))));
    const dailyData = revenueDayAggs.map((agg,i)=> ({ day: revenueDayRanges[i].label, revenue: Math.round(((agg._sum.amount || 0) * commissionRate) * 100)/100 }));
    
    // Get recent revenue transactions
  const recentTransactions = await withPrismaRetry(()=>prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: {
        status: 'VERIFIED',
        paymentMethod: { not: 'FREE' }
      },
        include: {
        user: {
          select: {
            fullName: true,
            email: true,
            picture: true
          }
        },
        sheet: {
          select: {
            title: true
          }
        }
      }
  }));

    const responsePayload = {
      totalRevenue: totalCommission,
      revenueThisMonth: currentMonthCommission,
      growth,
      monthlyData,
      dailyData,
      recentTransactions: recentTransactions.map(transaction => ({
        ...transaction,
        commissionAmount: Math.round((transaction.amount * commissionRate) * 100) / 100,
        sellerAmount: Math.round((transaction.amount - (transaction.amount * commissionRate)) * 100) / 100
      })),
      commissionRate: Math.round(commissionRate * 100)
    };
    setGenericCache(cacheKey, responsePayload, 30 * 1000);
    res.json({ success: true, data: responsePayload });
  } catch (error) {
  console.error('[Admin] revenueAnalytics failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

// @desc    Ban user
// @route   POST /api/admin/users/:id/ban
// @access  Private (Admin only)
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'ไม่สามารถแบนผู้ดูแลระบบได้'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: true }
    });

    

    res.status(200).json({
      success: true,
      message: 'แบนผู้ใช้สำเร็จ',
      data: updatedUser
    });
  } catch (error) {
  console.error('[Admin] banUser failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแบนผู้ใช้',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Unban user
// @route   POST /api/admin/users/:id/unban
// @access  Private (Admin only)
const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: false }
    });

    

    res.status(200).json({
      success: true,
      message: 'ยกเลิกการแบนผู้ใช้สำเร็จ',
      data: updatedUser
    });
  } catch (error) {
  console.error('[Admin] unbanUser failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกการแบนผู้ใช้',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
  const { id } = req.params;
    
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'ไม่สามารถลบผู้ดูแลระบบได้'
      });
    }

    // Check if user has any orders or reviews
    const userOrders = await prisma.order.count({
      where: { userId: parseInt(id) }
    });

    const userReviews = await prisma.review.count({
      where: { userId: parseInt(id) }
    });

    if (userOrders > 0 || userReviews > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบผู้ใช้ได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง (คำสั่งซื้อหรือรีวิว)'
      });
    }

    // Delete user (Prisma will handle cascading deletes for related data)
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    

    res.status(200).json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    });
  } catch (error) {
  console.error('[Admin] deleteUser failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all sheets with filters and pagination
// @route   GET /api/admin/sheets
// @access  Private (Admin only)
const getSheets = async (req, res) => {
  try {
    
    
    await prisma.$connect();
    
    
    const { sanitizePagination: sanitizePagination2, validateSort: validateSort2 } = require('../utils/validation');
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      faculty = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subjectCode: { contains: search } },
        { subjectNameJSON: { contains: search } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (faculty) {
      where.faculty = faculty;
    }
    
  const { page: pageNum, limit: limitNum, skip } = sanitizePagination2(page, limit, { maxLimit: 100 });
  const { field: sheetField, dir: sheetDir } = validateSort2(sortBy, order, ['createdAt','title','subjectCode','price']);
    
    const totalCount = await prisma.sheet.count({ where });
    
    const sheets = await prisma.sheet.findMany({
      where,
        include: {
          seller: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                picture: true
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      },
  orderBy: { [sheetField]: sheetDir },
      skip,
      take: limitNum
    });

    
    
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;
    
    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
      limit: limitNum
    };
    
    res.status(200).json({
      success: true,
      data: {
        sheets,
        pagination
      }
    });
  } catch (error) {
  console.error('[Admin] getSheets failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get sheet by ID
// @route   GET /api/admin/sheets/:id
// @access  Private (Admin only)
const getSheetById = async (req, res) => {
  try {
  const { id } = req.params;
    
    
    const sheet = await prisma.sheet.findUnique({
      where: { id: parseInt(id) },
      include: {
        seller: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                picture: true
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                fullName: true,
                picture: true
              }
            }
          }
        }
      }
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีท'
      });
    }

    res.status(200).json({
      success: true,
      data: sheet
    });
  } catch (error) {
  console.error('[Admin] getSheetById failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Approve sheet
// @route   POST /api/admin/sheets/:id/approve
// @access  Private (Admin only)
const approveSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminMessage } = req.body;
    
    
    const sheet = await prisma.sheet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีท'
      });
    }

    if (sheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'ชีทนี้ได้รับการอนุมัติแล้ว'
      });
    }

    const updatedSheet = await prisma.sheet.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'APPROVED',
        adminMessage: adminMessage || null
      }
    });

    

    res.status(200).json({
      success: true,
      message: 'อนุมัติชีทสำเร็จ',
      data: updatedSheet
    });
  } catch (error) {
  console.error('[Admin] approveSheet failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Reject sheet
// @route   POST /api/admin/sheets/:id/reject
// @access  Private (Admin only)
const rejectSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเหตุผลในการปฏิเสธ'
      });
    }
    
    const sheet = await prisma.sheet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีท'
      });
    }

    if (sheet.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'ชีทนี้ถูกปฏิเสธแล้ว'
      });
    }

    const updatedSheet = await prisma.sheet.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'REJECTED',
        adminMessage: reason
      }
    });

    

    res.status(200).json({
      success: true,
      message: 'ปฏิเสธชีทสำเร็จ',
      data: updatedSheet
    });
  } catch (error) {
  console.error('[Admin] rejectSheet failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete sheet
// @route   DELETE /api/admin/sheets/:id
// @access  Private (Admin only)
const deleteSheet = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const sheet = await prisma.sheet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชีท'
      });
    }

    // Check if sheet has any orders
    const sheetOrders = await prisma.order.count({
      where: { sheetId: parseInt(id) }
    });

    if (sheetOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบชีทได้เนื่องจากมีคำสั่งซื้อที่เกี่ยวข้อง'
      });
    }

    await prisma.sheet.delete({
      where: { id: parseInt(id) }
    });

    

    res.status(200).json({
      success: true,
      message: 'ลบชีทสำเร็จ'
    });
  } catch (error) {
  console.error('[Admin] deleteSheet failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบชีท',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all orders with filters and pagination
// @route   GET /api/admin/orders
// @access  Private (Admin only)
const getOrders = async (req, res) => {
  try {
    
    
    await prisma.$connect();
    
    
    const { sanitizePagination: sanitizePagination3, validateSort: validateSort3 } = require('../utils/validation');
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const where = {};
    
    // Search filter (order ID, user email, sheet title)
    if (search) {
      where.OR = [
        { id: { equals: parseInt(search) || 0 } },
        { user: { email: { contains: search } } },
        { user: { fullName: { contains: search } } },
        { sheet: { title: { contains: search } } },
        { sheet: { subjectCode: { contains: search } } }
      ];
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
  const { page: pageNum, limit: limitNum, skip } = sanitizePagination3(page, limit, { maxLimit: 100 });
  const { field: orderField, dir: orderDir } = validateSort3(sortBy, order, ['createdAt','amount','status']);
    
    const totalCount = await prisma.order.count({ where });
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            picture: true
          }
        },
        sheet: {
          select: {
            id: true,
            title: true,
            subjectCode: true,
            price: true,
            seller: {
              select: {
                id: true,
                penName: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    picture: true
                  }
                }
              }
            }
          }
        }
      },
  orderBy: { [orderField]: orderDir },
      skip,
      take: limitNum
    });

    
    
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;
    
    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
      limit: limitNum
    };
    
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination
      }
    });
  } catch (error) {
  console.error('[Admin] getOrders failed', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private (Admin only)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            picture: true
          }
        },
        sheet: {
          select: {
            id: true,
            title: true,
            subjectCode: true,
            price: true,
            pdfFile: true,
            previewImages: true,
            shortDescription: true,
            seller: {
              select: {
                id: true,
                penName: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    picture: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
  console.error('[Admin] Get order error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    
    if (!['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'สถานะไม่ถูกต้อง'
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อ'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    

    res.status(200).json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      data: updatedOrder
    });
  } catch (error) {
  console.error('[Admin] Update order status error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Export all functions
module.exports = {
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
};