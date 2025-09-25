const { prisma } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { withPrismaRetry } = require('../utils/prismaRetry');
const { readCodes, validateCodeUsability, computeDiscountAmount, incrementDiscountUsage } = require('./discountController');
const { sanitizePagination } = require('../utils/validation');

function genOrderNumber(prefix = 'ORD') { return `${prefix}-${Date.now()}-${Math.floor(Math.random()*100000)}-${Math.floor(Math.random()*1000)}`; }
function validId(raw){ const n = Number(raw); return Number.isInteger(n) && n>0 ? n : null; }

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
  const { sheet_id, items } = req.body;
    if (!req.user?.id) return res.status(401).json({ success:false, message:'Authentication required' });

    // Simple rate limit per user/day
    const userOrderCount = await withPrismaRetry(() => prisma.order.count({ where: { userId: req.user.id, createdAt: { gte: new Date(Date.now()-24*60*60*1000) } } }));
    if (userOrderCount > 50) return res.status(429).json({ success:false, message:'Too many orders created. Please try again later.' });

    // Multi-item flow
    if (Array.isArray(items) && items.length) {
      const orders = []; let totalAmount = 0;
      const discountCodeRaw = (req.body?.discountCode || '').toString().trim().toUpperCase();
      let appliedDiscount = null; let subtotalForDiscount = 0;
      for (const item of items) {
        const sheetIdNum = Number(item.sheetId);
        if (!Number.isInteger(sheetIdNum)) return res.status(400).json({ success:false, message:`Invalid sheetId ${item.sheetId}` });
        const sheet = await withPrismaRetry(() => prisma.sheet.findFirst({ where: { id: sheetIdNum, status:'APPROVED' }, include:{ seller:{ select:{ id:true, penName:true, bankName:true, bankAccount:true, accountName:true } } } }));
        if (!sheet) return res.status(404).json({ success:false, message:`Sheet ID ${item.sheetId} not found or not approved` });
        // Check any existing order (PENDING/VERIFIED/PAID)
        const existingAny = await withPrismaRetry(() => prisma.order.findFirst({ where:{ userId: req.user.id, sheetId: sheet.id, status:{ in:['PENDING','VERIFIED','PAID'] } } }));
  const requestedFree = req.body?.isFreeOrder === true || Number(req.body?.total) === 0;
        const isFree = requestedFree || sheet.isFree || sheet.price === 0 || Number(item.price) === 0;
        // accumulate subtotal for discount calculation (only count priced items)
  const qty = Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1;
        if (!sheet.isFree && Number(sheet.price) > 0) {
          subtotalForDiscount += Number(sheet.price) * qty;
        }
        if (isFree) {
          // If there's a pending order already, convert it to a free verified order instead of creating a duplicate
          if (existingAny && existingAny.status === 'PENDING') {
            const updated = await withPrismaRetry(() => prisma.order.update({ where:{ id: existingAny.id }, data:{ quantity: qty, amount:0, totalPrice:0, status:'VERIFIED', paymentStatus:'PAID', paymentMethod:'FREE', isFreeOrder:true, verifiedDate:new Date(), paidAt:new Date(), orderNumber: existingAny.orderNumber || genOrderNumber('FREE') } }));
            orders.push(updated);
            continue;
          }
          // Block if already purchased
          if (existingAny && (existingAny.status === 'VERIFIED' || existingAny.status === 'PAID')) {
            return res.status(409).json({ success:false, message:`Order already exists for sheet ID ${item.sheetId}` });
          }
          const freeOrder = await withPrismaRetry(() => prisma.order.create({ data:{ userId:req.user.id, sheetId:sheet.id, sellerId:sheet.sellerId, quantity:qty, amount:0, totalPrice:0, status:'VERIFIED', paymentStatus:'PAID', paymentMethod:'FREE', isFreeOrder:true, orderNumber: genOrderNumber('FREE'), verifiedDate:new Date(), paidAt:new Date() } }));
          orders.push(freeOrder);
        } else {
          if (existingAny) {
            // If a pending order already exists, reuse it to avoid duplicates
            if (existingAny.status === 'PENDING') {
              orders.push(existingAny);
              totalAmount += Number(existingAny.amount) || 0;
              continue;
            }
            return res.status(409).json({ success:false, message:`Order already exists for sheet ID ${item.sheetId}` });
          }
          const price = Number(item.price ?? sheet.price ?? 0);
          const amount = price * qty;
          if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ success:false, message:`Invalid amount for sheetId ${sheet.id}` });
          }
          const order = await withPrismaRetry(() => prisma.order.create({ data:{ userId:req.user.id, sheetId:sheet.id, sellerId:sheet.sellerId, quantity:qty, amount, totalPrice:amount, status:'PENDING', paymentStatus:'PENDING', paymentMethod:'PENDING', orderNumber: genOrderNumber() } }));
          orders.push(order); totalAmount += amount;
        }
      }
      // If free checkout requested with a discount code, validate and record usage
      if ((req.body?.isFreeOrder === true || Number(req.body?.total) === 0) && discountCodeRaw) {
        const codes = await readCodes();
        const entry = codes.find(c => c.code === discountCodeRaw);
        const usable = await validateCodeUsability(entry, req.user?.id);
        if (!usable.ok) return res.status(400).json({ success:false, message: usable.reason || 'โค้ดไม่สามารถใช้งานได้' });
        const discountAmt = computeDiscountAmount(entry, subtotalForDiscount);
        if (discountAmt <= 0) return res.status(400).json({ success:false, message:'โค้ดส่วนลดไม่ครอบคลุมยอด' });
        appliedDiscount = { code: entry.code, type: entry.type, value: entry.value, amount: discountAmt };
        const remaining = Math.max(0, subtotalForDiscount - discountAmt);
        if (remaining > 0) return res.status(400).json({ success:false, message:'ยอดยังไม่เป็น 0 ไม่สามารถรับฟรีได้' });
        // Create a zero-amount completed PaymentSession for audit and per-user limit
        try {
          await withPrismaRetry(() => prisma.paymentSession.create({ data:{ sessionId: `FREE-${Date.now()}-${Math.floor(Math.random()*10000)}`, userId: req.user.id, amount: 0, status:'COMPLETED', paymentMethod:'DISCOUNT', orderIds: JSON.stringify(orders.map(o=>o.id)), metadata: JSON.stringify({ provider:'internal', zeroTotal:true, reason:'discount_fully_applied', discount: appliedDiscount }), discountCode: appliedDiscount?.code || null, discountAmount: appliedDiscount?.amount ?? null, expiresAt: new Date(), completedAt: new Date() } }));
          await incrementDiscountUsage(entry.code);
        } catch {}
      }
      return res.status(201).json({ success:true, message: orders.every(o=>o.amount===0)?'Free order created successfully':'Order created successfully', data:{ orders, totalAmount: orders.reduce((s,o)=>s+(o.amount||0),0), isFreeOrder: orders.every(o=>o.amount===0) } });
    }

    // Single order flow
    const sheet = await withPrismaRetry(() => prisma.sheet.findFirst({ where:{ id:Number(sheet_id), status:'APPROVED' }, include:{ seller:{ select:{ id:true, penName:true, bankName:true, bankAccount:true, accountName:true } } } }));
    if (!sheet) return res.status(404).json({ success:false, message:'Sheet not found or not approved' });
    const dup = await withPrismaRetry(() => prisma.order.findFirst({ where:{ userId:req.user.id, sheetId:Number(sheet_id), status:{ in:['PENDING','VERIFIED','PAID'] } } }));
    if (dup) return res.status(409).json({ success:false, message:'Order already exists for this sheet' });
    const isFree = sheet.isFree || sheet.price === 0;
    if (isFree) {
      const freeOrder = await withPrismaRetry(() => prisma.order.create({ data:{ userId:req.user.id, sheetId:sheet.id, sellerId:sheet.sellerId, quantity:1, amount:0, totalPrice:0, status:'VERIFIED', paymentStatus:'PAID', paymentMethod:'FREE', isFreeOrder:true, orderNumber: genOrderNumber('FREE'), verifiedDate:new Date(), paidAt:new Date() } }));
      return res.status(201).json({ success:true, message:'Free order created successfully', data: freeOrder });
    }
    const order = await withPrismaRetry(() => prisma.order.create({ data:{ userId:req.user.id, sheetId:sheet.id, sellerId:sheet.sellerId, quantity:1, amount:sheet.price, totalPrice:sheet.price, status:'PENDING', paymentStatus:'PENDING', paymentMethod:'PENDING', orderNumber: genOrderNumber() } }));
    res.status(201).json({ success:true, message:'Order created successfully', data: order });
  } catch (error) {
    console.error('[Order] createOrder error', { message:error.message, stack:error.stack });
    res.status(500).json({ success:false, message:'Failed to create order' });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { maxLimit: 50 });
    const status = req.query.status;
    const whereClause = { userId: req.user.id }; if (status) whereClause.status = status;
    const [count, rows] = await Promise.all([
      withPrismaRetry(() => prisma.order.count({ where: whereClause })),
      withPrismaRetry(() => prisma.order.findMany({ where: whereClause, include:{ sheet:{ select:{ id:true,title:true,subjectCode:true,shortDescription:true,price:true,pdfFile:true,previewImages:true,faculty:true,seller:{ select:{ penName:true } } } }, seller:{ select:{ penName:true, bankName:true, bankAccount:true, accountName:true } } }, skip, take: limit, orderBy:{ createdAt:'desc' } }))
    ]);
    res.json({ success:true, data:{ orders: rows, pagination:{ current_page: page, total_pages: Math.ceil(count/limit), total_items: count, items_per_page: limit } } });
  } catch (error) { console.error('[Order] getUserOrders error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => { try { const id = validId(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' }); const order = await withPrismaRetry(() => prisma.order.findFirst({ where:{ id, userId:req.user.id }, include:{ sheet:{ select:{ title:true, subjectCode:true, price:true } }, seller:{ select:{ penName:true, bankName:true, bankAccount:true, accountName:true } } } })); if(!order) return res.status(404).json({ success:false, message:'Order not found' }); res.json({ success:true, data: order }); } catch (error) { console.error('[Order] getOrderById error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Upload payment slip
// @route   POST /api/orders/:id/payment-slip
// @access  Private
const uploadPaymentSlip = async (req, res) => { try { const id = validId(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' }); const order = await withPrismaRetry(() => prisma.order.findFirst({ where:{ id, userId:req.user.id }, include:{ seller:true } })); if(!order) return res.status(404).json({ success:false, message:'Order not found' }); if(order.status !== 'PENDING') return res.status(400).json({ success:false, message:'Can only upload payment slip for pending orders' }); if(!req.file?.path) return res.status(400).json({ success:false, message:'No file uploaded' }); if(!fs.existsSync(req.file.path)) return res.status(400).json({ success:false, message:'Uploaded file not found' }); let imageBuffer; try { imageBuffer = fs.readFileSync(req.file.path); } catch (readErr) { console.error('[Order] read slip file error',{ message:readErr.message }); return res.status(500).json({ success:false, message:'Failed to read uploaded file' }); } if(!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length===0) return res.status(400).json({ success:false, message:'Invalid or empty file' }); const header = imageBuffer.slice(0,8); const isJPEG = header[0]===0xFF && header[1]===0xD8; const isPNG = header[0]===0x89 && header[1]===0x50; if(!isJPEG && !isPNG) return res.status(400).json({ success:false, message:'Invalid image format. Only JPEG and PNG are allowed' }); const verificationResult = { isValid:true, confidence:0.8, message:'Slip verification temporarily disabled - manual review required', requiresManualReview:true, verified:false };
    let newStatus = 'PENDING'; let adminNotes = 'Payment slip uploaded - pending verification'; let verifiedDate = null;
    if (verificationResult.verified) { newStatus='VERIFIED'; adminNotes=`✅ Auto-verified: Payment confirmed automatically (${Math.round(verificationResult.confidence*100)}% confidence)`; verifiedDate=new Date(); if(order.seller){ await withPrismaRetry(()=> prisma.seller.update({ where:{ id: order.seller.id }, data:{ totalRevenue:{ increment: parseFloat(order.amount) } } })); } }
    const updatedOrder = await withPrismaRetry(() => prisma.order.update({ where:{ id: order.id }, data:{ status:newStatus, verifiedDate, adminNotes } }));
    const message = verificationResult.verified ? '🎉 การชำระเงินได้รับการยืนยันแล้ว!' : '⏳ อัปโหลดสลิปแล้ว กำลังรอตรวจสอบ';
    res.json({ success:true, message, data:{ ...updatedOrder, autoVerified: verificationResult.verified, confidence: verificationResult.confidence, redirectTo: verificationResult.verified?'/my-sheets':null } });
  } catch (error) { console.error('[Order] uploadPaymentSlip error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error during payment slip upload' }); } };

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
const cancelOrder = async (req, res) => { try { const id = validId(req.params.id); if(!id) return res.status(400).json({ success:false, message:'Invalid id' }); const order = await withPrismaRetry(() => prisma.order.findFirst({ where:{ id, userId:req.user.id } })); if(!order) return res.status(404).json({ success:false, message:'Order not found' }); if(order.status !== 'PENDING') return res.status(400).json({ success:false, message:'Can only cancel pending orders' }); await withPrismaRetry(() => prisma.order.delete({ where:{ id: order.id } })); res.json({ success:true, message:'Order cancelled successfully' }); } catch (error) { console.error('[Order] cancelOrder error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error during order cancellation' }); } };

// @desc    Get order statistics for user
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = async (req, res) => { try { const statusCounts = await withPrismaRetry(() => prisma.order.groupBy({ by:['status'], where:{ userId:req.user.id }, _count:{ _all:true } })); const totalSpent = await withPrismaRetry(() => prisma.order.aggregate({ _sum:{ amount:true }, where:{ userId:req.user.id, status:'VERIFIED' } })); const formatted = { total_orders:0, total_spent:0, pending:0, paid:0, verified:0, rejected:0 }; statusCounts.forEach(stat => { formatted[stat.status] = stat._count._all; formatted.total_orders += stat._count._all; }); formatted.total_spent = totalSpent._sum.amount || 0; res.json({ success:true, data: formatted }); } catch (error) { console.error('[Order] getOrderStats error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

// @desc    Get user's purchased sheets
// @route   GET /api/orders/purchased-sheets
// @access  Private
const getUserPurchasedSheets = async (req, res) => { try { const { page, limit, skip } = sanitizePagination(req.query.page, req.query.limit, { maxLimit: 50 }); const allOrders = await withPrismaRetry(() => prisma.order.findMany({ where:{ userId:req.user.id, OR:[ { status:'VERIFIED' }, { paymentMethod:'FREE' } ] }, select:{ id:true,status:true,paymentMethod:true,isFreeOrder:true,verifiedDate:true,paidAt:true,createdAt:true,sheetId:true,sheet:{ select:{ id:true,title:true,subjectCode:true, subjectNameJSON:true, shortDescription:true, price:true, pdfFile:true, previewImages:true, faculty:true, downloadCount:true, seller:{ select:{ penName:true, user:{ select:{ picture:true } } } } } } }, orderBy:[ { verifiedDate:'desc' }, { paidAt:'desc' }, { createdAt:'desc' } ] })); const latestBySheetId = new Map(); for (const o of allOrders) { const ts = new Date(o.verifiedDate || o.paidAt || o.createdAt).getTime(); const prev = latestBySheetId.get(o.sheetId); if(!prev || ts > prev.ts) latestBySheetId.set(o.sheetId, { order:o, ts }); } const deduped = Array.from(latestBySheetId.values()).map(v=>v.order); const count = deduped.length; const paged = deduped.slice(skip, skip+limit); const sheetIds = paged.map(o=>o.sheetId); let reviewStatsBySheetId = new Map(); if(sheetIds.length){ const grouped = await withPrismaRetry(() => prisma.review.groupBy({ by:['sheetId'], where:{ sheetId:{ in: sheetIds } }, _avg:{ rating:true }, _count:{ _all:true } })); reviewStatsBySheetId = new Map(grouped.map(g => [g.sheetId,{ avgRating:g._avg.rating||0, reviewCount:g._count._all||0 }])); } const purchasedSheets = paged.map(order => ({ id:order.sheet.id, title:order.sheet.title, subjectCode:order.sheet.subjectCode, subjectName:order.sheet.subjectNameJSON, shortDescription:order.sheet.shortDescription, price:order.sheet.price, pdfFile:order.sheet.pdfFile, previewImages:order.sheet.previewImages, faculty:order.sheet.faculty, downloadCount:order.sheet.downloadCount, subject:null, seller:order.sheet.seller, purchasedAt: order.verifiedDate || order.paidAt || order.createdAt, paymentDate:null, orderId:order.id, status:order.status, paymentMethod:order.paymentMethod, isFreeOrder:order.isFreeOrder, avgRating: reviewStatsBySheetId.get(order.sheetId)?.avgRating || 0, reviewCount: reviewStatsBySheetId.get(order.sheetId)?.reviewCount || 0 })); res.json({ success:true, data:{ sheets:purchasedSheets, pagination:{ current_page:page, total_pages:Math.ceil(count/limit), total_items:count, items_per_page:limit } } }); } catch (error) { console.error('[Order] getUserPurchasedSheets error', { message:error.message, stack:error.stack }); res.status(500).json({ success:false, message:'Server error' }); } };

module.exports = { createOrder, getUserOrders, getOrderById, uploadPaymentSlip, cancelOrder, getOrderStats, getUserPurchasedSheets };
