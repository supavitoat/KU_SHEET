const { prisma } = require('../config/database');
const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const { withPrismaRetry } = require('../utils/prismaRetry');
const { createAndEmitNotification } = require('./notificationController');
const { sanitizePagination } = require('../utils/validation');

function parsePositiveInt(v){ const n = Number(v); return Number.isInteger(n)&&n>0?n:null; }

// Helpers
function generateOrderNumber(prefix = 'ORD') {
  const now = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${now}-${random}`;
}

function buildExternalId(userId) {
  return `KU-${userId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Helper: create PaymentSession with explicit discount fields, fallback if client doesn't support them
async function createPaymentSessionSafe(data) {
  try {
    return await withPrismaRetry(() => prisma.paymentSession.create({ data }));
  } catch (e) {
    const msg = e?.message || '';
    const unknownArg = msg.includes('Unknown arg `discountCode`') || msg.includes('Unknown arg `discountAmount`');
    if (unknownArg) {
      const { discountCode, discountAmount, ...fallback } = data;
      return await withPrismaRetry(() => prisma.paymentSession.create({ data: fallback }));
    }
    throw e;
  }
}

// ========================================
// PROMPTPAY PAYMENT SYSTEM (ระบบหลัก)
// ========================================

/**
 * สร้าง PromptPay QR Code สำหรับการชำระเงิน
 * POST /api/payments/promptpay/create
 */
exports.createPromptPaySession = async (req, res) => {
  try {
    const { items, discountCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    // สร้าง orders สำหรับแต่ละชีท
    const createdOrders = [];
    let totalAmount = 0;

    for (const item of items) {
      const sheet = await withPrismaRetry(() => prisma.sheet.findUnique({
        where: { id: Number(item.id) },
        include: { seller: { select: { id: true, userId: true, bankName: true, bankAccount: true, accountName: true } } }
      }));

      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet ID ${item.id} not found` });
      }
      if (sheet.status !== 'APPROVED') {
        return res.status(400).json({ success: false, message: `Sheet ID ${item.id} is not approved` });
      }

      // ตรวจสอบคำสั่งซื้อต่าง ๆ ที่มีอยู่แล้ว
      const existing = await withPrismaRetry(() => prisma.order.findFirst({
        where: { userId: req.user.id, sheetId: sheet.id, status: { in: ['PENDING', 'VERIFIED'] } }
      }));
      if (existing) {
        if (existing.status === 'VERIFIED') {
          return res.status(400).json({ success: false, message: `You already own sheet ID ${item.id}` });
        }
        createdOrders.push(existing);
        totalAmount += Number(existing.amount || 0);
        continue;
      }

      // ชีทฟรี ยืนยันให้ทันที
      if (sheet.isFree) {
        const freeOrder = await withPrismaRetry(() => prisma.order.create({
          data: {
            userId: req.user.id,
            sheetId: sheet.id,
            sellerId: sheet.sellerId,
            amount: 0,
            status: 'VERIFIED',
            paymentMethod: 'FREE',
            paymentDate: new Date(),
            verifiedDate: new Date(),
            paidAt: new Date(),
            orderNumber: generateOrderNumber('FREE')
          },
        }));
        // Notify buyer and seller (optional)
        try {
          await createAndEmitNotification({
            userId: req.user.id,
            type: 'order',
            title: `ได้รับชีทฟรี: ${sheet.title}`,
            body: 'ระบบได้เพิ่มชีทนี้ในคลังของคุณแล้ว',
            link: '/mysheet',
            data: { orderId: freeOrder.id, sheetId: sheet.id }
          });
          if (sheet?.seller?.userId) {
            await createAndEmitNotification({
              userId: sheet.seller.userId,
              type: 'order',
              title: `มีผู้รับชีทฟรี: ${sheet.title}`,
              body: 'มีผู้ใช้ได้รับชีทฟรีของคุณ',
              link: '/seller/manage',
              data: { orderId: freeOrder.id, sheetId: sheet.id }
            });
          }
        } catch (_) {}
        createdOrders.push(freeOrder);
        continue;
      }

      // ชีทเสียเงิน สร้างคำสั่งซื้อรอดำเนินการ
      const amount = Number(sheet.price) * Number(item.quantity || 1);
      const orderNumber = generateOrderNumber();
      const order = await withPrismaRetry(() => prisma.order.create({
        data: {
          userId: req.user.id,
          sheetId: sheet.id,
          sellerId: sheet.sellerId,
          amount,
          status: 'PENDING',
          orderNumber,
          paymentMethod: 'PROMPTPAY',
          paymentDate: new Date(),
        },
      }));
      createdOrders.push(order);
      totalAmount += amount;
    }

    // ใช้โค้ดส่วนลด ถ้ามี
    let appliedDiscount = null;
    if (discountCode) {
      try {
        const { readCodes, validateCodeUsability, computeDiscountAmount } = require('./discountController');
        const codes = await readCodes();
        const entry = codes.find(c => c.code === String(discountCode).trim().toUpperCase());
        const usable = await validateCodeUsability(entry, req.user?.id);
        if (usable.ok) {
          const discountAmt = computeDiscountAmount(entry, totalAmount);
          if (discountAmt > 0) {
            appliedDiscount = { code: entry.code, type: entry.type, value: entry.value, amount: discountAmt };
            totalAmount = Math.max(0, totalAmount - discountAmt);
          }
        }
      } catch (e) {
        console.warn('[Payment] discount apply failed, ignore', e?.message);
      }
    }

    const sessionId = buildExternalId(req.user.id);
    const orderIds = createdOrders.map(o => o.id);

    // กรณียอดรวมกลายเป็น 0 หลังหักส่วนลด ให้ยืนยันคำสั่งซื้อทันที
    if (totalAmount <= 0) {
      for (const order of createdOrders) {
        if (order.status === 'PENDING') {
          await withPrismaRetry(() => prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'VERIFIED',
              verifiedDate: new Date(),
              paymentMethod: 'DISCOUNT',
              paymentReference: appliedDiscount?.code || 'DISCOUNT',
              paymentStatus: 'VERIFIED',
              paidAt: new Date(),
              adminNotes: `✅ Fully covered by discount code ${appliedDiscount?.code || ''}`.trim()
            }
          }));
          // อัปเดตรายได้ผู้ขาย (หากมีมูลค่าในคำสั่งซื้อเดิม)
          if (order.sellerId && order.amount) {
            await withPrismaRetry(() => prisma.seller.update({
              where: { id: order.sellerId },
              data: { totalRevenue: { increment: parseFloat(order.amount) } }
            }));
          }
          // Notify buyer and seller
          try {
            const sheetInfo = await withPrismaRetry(() => prisma.sheet.findUnique({ where: { id: order.sheetId }, select: { title: true, seller: { select: { userId: true } } } }));
            await createAndEmitNotification({
              userId: order.userId,
              type: 'payment',
              title: `ยืนยันคำสั่งซื้อสำเร็จ` ,
              body: sheetInfo?.title ? `ชีท: ${sheetInfo.title}` : undefined,
              link: '/mysheet',
              data: { orderId: order.id, sheetId: order.sheetId }
            });
            if (sheetInfo?.seller?.userId) {
              await createAndEmitNotification({
                userId: sheetInfo.seller.userId,
                type: 'payment',
                title: `ขายชีทได้แล้ว` ,
                body: sheetInfo?.title ? `ชีท: ${sheetInfo.title}` : undefined,
                link: '/seller/manage',
                data: { orderId: order.id, sheetId: order.sheetId }
              });
            }
          } catch (_) {}
        }
      }
      // บันทึก PaymentSession แบบเสร็จสิ้นเพื่อใช้นับ per-user limit
      try {
        await withPrismaRetry(() => prisma.paymentSession.create({
          data: {
            sessionId,
            userId: req.user.id,
            amount: 0,
            status: 'COMPLETED',
            paymentMethod: 'DISCOUNT',
            orderIds: JSON.stringify(orderIds),
            metadata: JSON.stringify({ provider: 'promptpay', zeroTotal: true, reason: 'discount_fully_applied', discount: appliedDiscount || null }),
            discountCode: appliedDiscount?.code || null,
            discountAmount: appliedDiscount?.amount ?? null,
            expiresAt: new Date(),
            completedAt: new Date(),
          }
        }));
        try {
          const code = appliedDiscount?.code;
          if (code) {
            const { incrementDiscountUsage } = require('./discountController');
            await incrementDiscountUsage(code);
          }
        } catch {}
      } catch {}

      return res.json({
        success: true,
        data: {
          sessionId,
          amount: 0,
          orderIds,
          noPayment: true,
          discount: appliedDiscount || null,
          message: 'ไม่มีรายการที่ต้องชำระ ใช้โค้ดส่วนลดสำเร็จ และได้รับชีทเรียบร้อย'
        }
      });
    }

    // กรณีต้องชำระเงิน: สร้าง PromptPay session (pending)
    const promptPayData = { mobileNumber: '0656144703', amount: totalAmount, merchantName: 'KU SHEET', city: 'BANGKOK' };
    const paymentSession = await createPaymentSessionSafe({
      sessionId,
      userId: req.user.id,
      amount: totalAmount,
      status: 'PENDING',
      paymentMethod: 'PROMPTPAY',
      orderIds: JSON.stringify(orderIds),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: JSON.stringify({ ...promptPayData, discount: appliedDiscount || null }),
      discountCode: appliedDiscount?.code || null,
      discountAmount: appliedDiscount?.amount ?? null
    });

    return res.json({ success: true, data: { sessionId, amount: totalAmount, orderIds, promptPayData, discount: appliedDiscount || null, expiresAt: paymentSession.expiresAt, message: 'PromptPay session created successfully. Scan QR code to pay.' } });
  } catch (error) {
    console.error('[Payment] Create PromptPay session error', { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error during PromptPay session creation', error: error.message });
  }
};

/**
 * ตรวจสอบการชำระเงินแบบ PromptPay
 * POST /api/payments/promptpay/verify
 */
exports.verifyPromptPayPayment = async (req, res) => {
  try {
    const { sessionId, referenceNumber, amount, bankName } = req.body;

    if (!sessionId || !referenceNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, reference number, and amount are required'
      });
    }

    // ตรวจสอบรูปแบบเลขอ้างอิง (ต้องเป็นตัวเลข 10-12 หลัก)
    const referencePattern = /^\d{10,12}$/;
    if (!referencePattern.test(referenceNumber)) {
      return res.status(400).json({
        success: false,
        message: 'เลขอ้างอิงไม่ถูกต้อง ต้องเป็นตัวเลข 10-12 หลัก'
      });
    }

    // ค้นหา payment session
  const paymentSession = await withPrismaRetry(() => prisma.paymentSession.findFirst({
      where: { 
        sessionId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
  }));

    if (!paymentSession) {
      return res.status(404).json({
        success: false,
        message: 'Payment session not found or expired'
      });
    }

    // ตรวจสอบจำนวนเงิน (ต้องตรงกันเป๊ะ)
    if (Math.abs(paymentSession.amount - Number(amount)) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง'
      });
    }


    // ตรวจสอบว่าเลขอ้างอิงนี้อยู่ในช่วงเวลาที่สมเหตุสมผล (ไม่เกิน 24 ชั่วโมง)
    const sessionCreatedAt = new Date(paymentSession.createdAt);
    const now = new Date();
    const hoursDiff = (now - sessionCreatedAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({
        success: false,
        message: 'Session หมดอายุแล้ว กรุณาสร้างใหม่'
      });
    }

    // 🚨 ระบบความปลอดภัยใหม่: ตรวจสอบเลขอ้างอิงกับธนาคารจริง
    // หมายเหตุ: ในระบบจริง ต้องเชื่อมต่อกับ API ของธนาคาร
    // ตอนนี้เป็นเพียงการจำลองเพื่อทดสอบ
    
    // ตรวจสอบว่าเลขอ้างอิงอยู่ในรูปแบบที่ถูกต้อง
    // เลขอ้างอิงจากธนาคารไทยมักจะขึ้นต้นด้วย:
    // - SCB: เริ่มต้นด้วย 1-9
    // - KBank: เริ่มต้นด้วย 0
    // - BBL: เริ่มต้นด้วย 1-9
    // - TMB: เริ่มต้นด้วย 0
    
    const validReferencePatterns = {
      'SCB': /^[1-9]\d{9,11}$/,
      'KBank': /^0\d{9,11}$/,
      'BBL': /^[1-9]\d{9,11}$/,
      'TMB': /^0\d{9,11}$/,
      'Unknown': /^\d{10,12}$/
    };

    let isValidReference = false;
    let detectedBank = 'Unknown';

    // ตรวจสอบรูปแบบเลขอ้างอิงตามธนาคาร
    for (const [bank, pattern] of Object.entries(validReferencePatterns)) {
      if (pattern.test(referenceNumber)) {
        isValidReference = true;
        detectedBank = bank;
        break;
      }
    }

    if (!isValidReference) {
      return res.status(400).json({
        success: false,
        message: 'เลขอ้างอิงไม่ถูกต้องตามรูปแบบของธนาคาร กรุณาตรวจสอบอีกครั้ง'
      });
    }

    // ตรวจสอบเพิ่มเติม: เลขอ้างอิงต้องไม่เป็นเลขที่ง่ายเกินไป
    const simplePatterns = [
      /^(\d)\1{9,11}$/, // ตัวเลขเดียวกันซ้ำ เช่น 1111111111
      /^123456789\d{0,2}$/, // 123456789...
      /^987654321\d{0,2}$/, // 987654321...
      /^(\d{2})\1{4,5}$/, // ตัวเลข 2 หลักซ้ำ เช่น 1212121212
      /^12345678910$/, // 12345678910 โดยเฉพาะ
      /^123456789012$/, // 123456789012 โดยเฉพาะ
      /^(\d)\1{0,1}(\d)\2{0,1}(\d)\3{0,1}(\d)\4{0,1}(\d)\5{0,1}(\d)\6{0,1}(\d)\7{0,1}(\d)\8{0,1}(\d)\9{0,1}(\d)\10{0,1}(\d)\11{0,1}$/, // ตัวเลขเรียงลำดับ
    ];

    for (const pattern of simplePatterns) {
      if (pattern.test(referenceNumber)) {
        return res.status(400).json({
          success: false,
          message: 'เลขอ้างอิงไม่ถูกต้อง กรุณาใช้เลขอ้างอิงจริงจากธนาคาร'
        });
      }
    }

    // ตรวจสอบเพิ่มเติม: เลขอ้างอิงต้องไม่เป็นเลขที่ง่ายเกินไป
    if (referenceNumber === '12345678910' || 
        referenceNumber === '123456789012' ||
        referenceNumber === '1111111111' ||
        referenceNumber === '2222222222' ||
        referenceNumber === '3333333333' ||
        referenceNumber === '4444444444' ||
        referenceNumber === '5555555555' ||
        referenceNumber === '6666666666' ||
        referenceNumber === '7777777777' ||
        referenceNumber === '8888888888' ||
        referenceNumber === '9999999999' ||
        referenceNumber === '0000000000') {
      return res.status(400).json({
        success: false,
        message: 'เลขอ้างอิงไม่ถูกต้อง กรุณาใช้เลขอ้างอิงจริงจากธนาคาร'
      });
    }


    // อัปเดต payment session
  await withPrismaRetry(() => prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
  }));

    // If discount applied, increment its usage
    try {
      const meta = paymentSession.metadata ? JSON.parse(paymentSession.metadata) : null;
      const code = meta?.discount?.code;
      if (code) {
        const { incrementDiscountUsage } = require('./discountController');
        await incrementDiscountUsage(code);
      }
    } catch {}

    // อัปเดต orders ที่เกี่ยวข้อง
  const orderIds = JSON.parse(paymentSession.orderIds);
    
        for (const orderId of orderIds) {
          const order = await withPrismaRetry(() => prisma.order.findUnique({ 
        where: { id: orderId }
          }));
          
          if (order && order.status === 'PENDING') {
      await withPrismaRetry(() => prisma.order.update({
              where: { id: orderId },
              data: {
                status: 'VERIFIED',
                verifiedDate: new Date(),
            paymentMethod: 'PROMPTPAY',
            paymentReference: referenceNumber,
            paymentStatus: 'VERIFIED',
            paidAt: new Date(),
            adminNotes: `✅ PromptPay payment verified automatically. Reference: ${referenceNumber}, Bank: ${detectedBank}, Amount: ${amount}`
          }
    }));
      // Notify buyer and seller
      try {
        const sheetInfo = await withPrismaRetry(() => prisma.sheet.findUnique({ where: { id: order.sheetId }, select: { title: true, seller: { select: { userId: true } } } }));
        await createAndEmitNotification({
          userId: order.userId,
          type: 'payment',
          title: 'ชำระเงินสำเร็จ',
          body: sheetInfo?.title ? `ชีท: ${sheetInfo.title}` : undefined,
          link: '/mysheet',
          data: { orderId: order.id, sheetId: order.sheetId }
        });
        if (sheetInfo?.seller?.userId) {
          await createAndEmitNotification({
            userId: sheetInfo.seller.userId,
            type: 'payment',
            title: 'คุณได้รับยอดขายใหม่',
            body: sheetInfo?.title ? `ชีท: ${sheetInfo.title}` : undefined,
            link: '/seller/manage',
            data: { orderId: order.id, sheetId: order.sheetId }
          });
        }
      } catch (_) {}
      }
    }

    

    res.json({
      success: true,
      data: {
        sessionId,
        referenceNumber,
        amount: Number(amount),
        bankName: detectedBank,
        verifiedAt: new Date(),
        message: 'การชำระเงินได้รับการยืนยันแล้ว'
      }
    });

  } catch (error) {
    console.error('[Payment] Verify PromptPay payment error', { message: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false, 
      message: 'Server error during payment verification', 
      error: error.message 
    });
  }
};

/**
 * ตรวจสอบสถานะการชำระเงิน
 * GET /api/payments/promptpay/status/:sessionId
 */
exports.getPromptPayStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

  const paymentSession = await withPrismaRetry(() => prisma.paymentSession.findFirst({
      where: { sessionId }
  }));

    if (!paymentSession) {
      return res.status(404).json({
        success: false,
        message: 'Payment session not found'
      });
    }

    const isCompleted = paymentSession.status === 'COMPLETED';

    res.json({
      success: true, 
      data: { 
        sessionId,
        status: paymentSession.status,
        amount: paymentSession.amount,
        isCompleted,
        expiresAt: paymentSession.expiresAt,
        orderIds: JSON.parse(paymentSession.orderIds)
      } 
    });
    
  } catch (error) {
    console.error('[Payment] Get PromptPay status error', { message: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false, 
      message: 'Server error during status check',
      error: error.message 
    });
  }
};

// ========================================
// STRIPE PAYMENT (ทางเลือกเพิ่มเติม)
// ========================================

/**
 * Create Stripe Checkout Session
 * POST /api/payments/stripe/create-checkout-session
 */
exports.createStripeCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Stripe is not configured' });
    }

  const { items, successUrl, cancelUrl, discountCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    const createdOrders = [];
  let totalAmount = 0;

    for (const item of items) {
      const sheet = await withPrismaRetry(() => prisma.sheet.findUnique({
        where: { id: Number(item.id) },
        include: {
          seller: {
            select: { id: true, bankName: true, bankAccount: true, accountName: true }
          }
        }
      }));

      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet ID ${item.id} not found` });
      }

      if (sheet.status !== 'APPROVED') {
        return res.status(400).json({ success: false, message: `Sheet ID ${item.id} is not approved` });
      }

      if (sheet.isFree) {
        const freeOrder = await withPrismaRetry(() => prisma.order.create({
          data: {
            userId: req.user.id,
            sheetId: sheet.id,
            sellerId: sheet.sellerId,
            amount: 0,
            status: 'VERIFIED',
            paymentMethod: 'FREE',
            paymentDate: new Date(),
            verifiedDate: new Date(),
            paidAt: new Date(),
            orderNumber: generateOrderNumber('FREE')
          },
        }));
        createdOrders.push(freeOrder);
        continue;
      }

      const existing = await withPrismaRetry(() => prisma.order.findFirst({
        where: {
          userId: req.user.id,
          sheetId: sheet.id,
          status: { in: ['PENDING', 'VERIFIED'] }
        }
      }));

      if (existing) {
        if (existing.status === 'VERIFIED') {
          return res.status(400).json({ success: false, message: `You already own sheet ID ${item.id}` });
        }
        createdOrders.push(existing);
        totalAmount += existing.amount;
        continue;
      }

      const amount = Number(sheet.price) * Number(item.quantity || 1);
      const orderNumber = generateOrderNumber();

  const order = await withPrismaRetry(() => prisma.order.create({
        data: {
          userId: req.user.id,
          sheetId: sheet.id,
          sellerId: sheet.sellerId,
          amount,
          status: 'PENDING',
          orderNumber,
          paymentMethod: 'STRIPE',
          paymentDate: new Date(),
        },
  }));

      createdOrders.push(order);
      totalAmount += amount;
    }

    // Apply discount if provided
    let appliedDiscount = null;
    if (discountCode) {
      try {
        const { readCodes, validateCodeUsability, computeDiscountAmount } = require('./discountController');
        const codes = await readCodes();
        const entry = codes.find(c => c.code === String(discountCode).trim().toUpperCase());
        const usable = await validateCodeUsability(entry, req.user?.id);
        if (usable.ok) {
          const discountAmt = computeDiscountAmount(entry, totalAmount);
          if (discountAmt > 0) {
            appliedDiscount = { code: entry.code, type: entry.type, value: entry.value, amount: discountAmt };
            totalAmount = Math.max(0, totalAmount - discountAmt);
          }
        }
      } catch (e) {
        console.warn('[Payment] discount apply failed, ignore', e?.message);
      }
    }

    const sessionId = buildExternalId(req.user.id);
    const orderIds = createdOrders.map(o => o.id);
  if (totalAmount <= 0) {
      // Discount fully covered; verify pending orders immediately
      for (const order of createdOrders) {
        if (order.status === 'PENDING') {
          await withPrismaRetry(() => prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'VERIFIED',
              verifiedDate: new Date(),
              paymentMethod: 'DISCOUNT',
              paymentReference: appliedDiscount?.code || 'DISCOUNT',
              paymentStatus: 'VERIFIED',
              paidAt: new Date(),
              adminNotes: `✅ Fully covered by discount code ${appliedDiscount?.code || ''}`.trim()
            }
          }));
          if (order.sellerId && order.amount) {
            await withPrismaRetry(() => prisma.seller.update({
              where: { id: order.sellerId },
              data: { totalRevenue: { increment: parseFloat(order.amount) } }
            }));
          }
        }
      }
      // บันทึก PaymentSession แบบ zero-total completed สำหรับ audit และ per-user limit
      try {
        await withPrismaRetry(() => prisma.paymentSession.create({
          data: {
            sessionId,
            userId: req.user.id,
            amount: 0,
            status: 'COMPLETED',
            paymentMethod: 'DISCOUNT',
            orderIds: JSON.stringify(orderIds),
            metadata: JSON.stringify({ provider: 'stripe', zeroTotal: true, reason: 'discount_fully_applied', discount: appliedDiscount || null }),
            discountCode: appliedDiscount?.code || null,
            discountAmount: appliedDiscount?.amount ?? null,
            expiresAt: new Date(),
            completedAt: new Date(),
          }
        }));
        try {
          const code = appliedDiscount?.code;
          if (code) {
            const { incrementDiscountUsage } = require('./discountController');
            await incrementDiscountUsage(code);
          }
        } catch {}
      } catch {}

      return res.json({
        success: true,
        data: {
          sessionId,
          orderIds,
          amount: 0,
          noPayment: true,
          discount: appliedDiscount || null,
          message: 'ไม่มีรายการที่ต้องชำระ ใช้โค้ดส่วนลดสำเร็จ และได้รับชีทเรียบร้อย'
        }
      });
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create payment session in DB
  await createPaymentSessionSafe({
    sessionId,
    userId: req.user.id,
    amount: totalAmount,
    status: 'PENDING',
    paymentMethod: 'STRIPE',
    orderIds: JSON.stringify(orderIds),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    metadata: JSON.stringify({ provider: 'stripe', discount: appliedDiscount || null }),
    discountCode: appliedDiscount?.code || null,
    discountAmount: appliedDiscount?.amount ?? null
  });

    // Build Stripe line items
    const lineItems = [];
    for (const order of createdOrders) {
  const sheet = await withPrismaRetry(() => prisma.sheet.findUnique({ where: { id: order.sheetId } }));
      if (!sheet) continue;
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: { name: `${sheet.title} (${sheet.subjectCode})` },
          unit_amount: Math.round(Number(sheet.price) * 100),
        },
        quantity: 1
      });
    }

    

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['promptpay'],
      line_items: lineItems,
      // ลด friction: เติมอีเมลอัตโนมัติของผู้ใช้ เพื่อไม่ต้องพิมพ์ใหม่
      customer_email: req.user?.email || undefined,
      metadata: {
        kuSessionId: sessionId,
        orderIds: orderIds.join(','),
        userId: String(req.user.id)
      },
      success_url: `${successUrl || `${frontendBase}/mysheet`}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendBase}/cart`,

    });

    

    return res.json({
      success: true,
      data: {
        sessionId,
        orderIds,
        checkoutUrl: session.url
      }
    });

  } catch (error) {
    console.error('[Payment] Create Stripe checkout session error', { message: error.message, stack: error.stack });
    
    // Better error messages for common issues
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลการชำระเงินไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้าง session กรุณาลองใหม่อีกครั้ง', 
      error: error.message 
    });
  }
};

/**
 * Stripe Webhook receiver
 * POST /api/payments/webhook/stripe
 */
exports.stripeWebhook = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).send('Stripe not configured');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Payment] Stripe webhook signature verification failed', { message: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Only process important events to reduce log noise
    const importantEvents = ['checkout.session.completed', 'payment_intent.succeeded'];
    if (!importantEvents.includes(event.type)) {
      // Silently ignore unimportant events
      return res.json({ received: true, ignored: true });
    }

    if (event.type === 'checkout.session.completed') {
      console.info('[Payment] Stripe Payment Completed');
      const session = event.data.object;
      const kuSessionId = session.metadata?.kuSessionId;
      const orderIdsStr = session.metadata?.orderIds || '';
      const orderIds = orderIdsStr.split(',').map(id => Number(id)).filter(Boolean);

      if (kuSessionId && orderIds.length > 0) {
  const paymentSession = await withPrismaRetry(() => prisma.paymentSession.findFirst({ where: { sessionId: kuSessionId } }));
        if (paymentSession && paymentSession.status !== 'COMPLETED') {
          await withPrismaRetry(() => prisma.paymentSession.update({
            where: { id: paymentSession.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
          }));

          // If discount applied, increment its usage
          try {
            const meta = paymentSession.metadata ? JSON.parse(paymentSession.metadata) : null;
            const code = meta?.discount?.code;
            if (code) {
              const { incrementDiscountUsage } = require('./discountController');
              await incrementDiscountUsage(code);
            }
          } catch {}

          let verifiedCount = 0;
          for (const orderId of orderIds) {
            const order = await withPrismaRetry(() => prisma.order.findUnique({ where: { id: orderId } }));
            if (order && order.status === 'PENDING') {
              await withPrismaRetry(() => prisma.order.update({
                where: { id: orderId },
                data: {
                  status: 'VERIFIED',
                  verifiedDate: new Date(),
                  paymentMethod: 'STRIPE',
                  paymentReference: session.payment_intent || session.id,
                  paymentStatus: 'VERIFIED',
                  paidAt: new Date(),
                  adminNotes: `✅ Stripe payment verified automatically. Session: ${session.id}`
                }
              }));

              // Increment seller revenue
              if (order.sellerId && order.amount) {
                await withPrismaRetry(() => prisma.seller.update({
                  where: { id: order.sellerId },
                  data: { totalRevenue: { increment: parseFloat(order.amount) } }
                }));
              }
              verifiedCount++;
            }
          }
      console.info('[Payment] Stripe orders verified', { verifiedCount });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Payment] Stripe webhook handler error', { message: error.message, stack: error.stack });
    res.status(500).send('Internal Server Error');
  }
};

// ========================================
// LEGACY SUPPORT (สำหรับการใช้งานเก่า)
// ========================================

/**
 * Create payment session (legacy support)
 * POST /api/payments/session
 */
exports.createPaymentSession = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    // Redirect to PromptPay system
    return res.status(200).json({
      success: true,
      data: {
        provider: 'promptpay',
        message: 'Legacy payment system deprecated. Please use PromptPay system.',
        redirectTo: '/api/payments/promptpay/create'
      }
    });

  } catch (error) {
    console.error('[Payment] createPaymentSession error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to create payment session', error: error.message });
  }
};

/**
 * Get session status (legacy support)
 * GET /api/payments/session/:externalId/status
 */
exports.getSessionStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Legacy endpoint deprecated. Please use PromptPay system.',
      redirectTo: '/api/payments/promptpay/status'
    });
  } catch (error) {
    console.error('[Payment] getSessionStatus error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to get session status', error: error.message });
  }
};

/**
 * Real-time payment detection (legacy support)
 * GET /api/payments/detect/:externalId
 */
exports.detectPaymentRealtime = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Legacy endpoint deprecated. Please use PromptPay system.',
      redirectTo: '/api/payments/promptpay/status'
    });
  } catch (error) {
    console.error('[Payment] detectPaymentRealtime error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to detect payment', error: error.message });
  }
};

// ========================================
// WEBHOOK HANDLERS (legacy support)
// ========================================

/**
 * Xendit Webhook (legacy support)
 * POST /api/payments/webhook/xendit
 */
exports.xenditWebhook = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Xendit webhook deprecated. Please use PromptPay system.'
    });
  } catch (error) {
    console.error('[Payment] xenditWebhook error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Webhook processing failed', error: error.message });
  }
};

/**
 * Omise Webhook (legacy support)
 * POST /api/payments/webhook/omise
 */
exports.omiseWebhook = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Omise webhook deprecated. Please use PromptPay system.'
    });
  } catch (error) {
    console.error('[Payment] omiseWebhook error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Webhook processing failed', error: error.message });
  }
};



