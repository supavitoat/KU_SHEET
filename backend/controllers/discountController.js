const { prisma } = require('../config/database');
// Ensure prisma client has DiscountCode model
const hasTableClient = () => !!(prisma && prisma.discountCode && typeof prisma.discountCode.findMany === 'function');

// Map DB row to controller entry shape (keep fields aligned with old JSON)
const mapRow = (r) => ({
  id: r.id,
  code: r.code,
  type: r.type,
  value: Number(r.value),
  description: r.description || null,
  active: !!r.active,
  startsAt: r.startsAt ? new Date(r.startsAt).toISOString() : null,
  endsAt: r.endsAt ? new Date(r.endsAt).toISOString() : null,
  usageLimit: r.usageLimit == null ? null : Number(r.usageLimit),
  perUserLimit: r.perUserLimit == null ? null : Number(r.perUserLimit),
  timesUsed: Number(r.timesUsed || 0),
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
});
const readCodes = async () => {
  if (!hasTableClient()) throw new Error('DiscountCode model is not available');
  const rows = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapRow);
};

// Internal: find and validate a code by string
const findCode = (codes, codeRaw) => {
  const code = (codeRaw || '').toString().trim().toUpperCase();
  if (!code) return null;
  return codes.find(c => c.code === code) || null;
};

// Check active window and limits (but not increment)
const validateCodeUsability = async (codeEntry, userId) => {
  if (!codeEntry) return { ok: false, reason: 'ไม่พบโค้ดนี้' };
  if (codeEntry.active === false) return { ok: false, reason: 'โค้ดนี้ถูกปิดใช้งาน' };
  const now = new Date();
  if (codeEntry.startsAt && new Date(codeEntry.startsAt) > now) return { ok: false, reason: 'โค้ดยังไม่เริ่มใช้งาน' };
  if (codeEntry.endsAt && new Date(codeEntry.endsAt) < now) return { ok: false, reason: 'โค้ดหมดอายุแล้ว' };

  // Global usage limit
  if (typeof codeEntry.usageLimit === 'number' && codeEntry.usageLimit >= 0) {
    const used = Number(codeEntry.timesUsed || 0);
    if (used >= codeEntry.usageLimit) return { ok: false, reason: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' };
  }

  // Per user limit via PaymentSession scan (COMPLETED)
  // Prefer explicit discountCode column; fallback to metadata contains for legacy records
  if (typeof codeEntry.perUserLimit === 'number' && codeEntry.perUserLimit >= 0 && userId) {
    const count = await prisma.paymentSession.count({
      where: {
        userId: Number(userId),
        status: 'COMPLETED',
        OR: [
          { discountCode: codeEntry.code },
          { metadata: { contains: `"code":"${codeEntry.code}"` } }
        ]
      }
    });
    if (count >= codeEntry.perUserLimit) return { ok: false, reason: 'คุณใช้โค้ดนี้ครบจำนวนที่กำหนดแล้ว' };
  }

  return { ok: true };
};

// Compute discount amount based on subtotal
const computeDiscountAmount = (codeEntry, subtotal) => {
  const sub = Math.max(0, Number(subtotal) || 0);
  if (sub <= 0) return 0;
  if (!codeEntry) return 0;
  if (codeEntry.type === 'fixed') return Math.min(sub, Math.max(0, Number(codeEntry.value) || 0));
  // percentage
  const pct = Math.min(100, Math.max(0, Number(codeEntry.value) || 0));
  return Math.floor((sub * pct) / 100);
};

// Public: preview validation for user
// POST /api/payments/discounts/validate
const validateDiscountPreview = async (req, res) => {
  try {
    const { code, items } = req.body || {};
  const codes = await readCodes();
    const entry = findCode(codes, code);
    const usable = await validateCodeUsability(entry, req.user?.id);
    if (!usable.ok) return res.status(400).json({ success: false, message: usable.reason || 'โค้ดไม่สามารถใช้งานได้' });

    // Compute subtotal from items (non-free, approved)
    let subtotal = 0;
    if (Array.isArray(items) && items.length) {
      for (const it of items) {
        const sheetId = Number(it.id || it.sheetId);
        if (!sheetId) continue;
        const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
        if (!sheet) continue;
        if (sheet.isFree || sheet.status !== 'APPROVED') continue;
        const qty = Math.max(1, Number(it.quantity) || 1);
        subtotal += Number(sheet.price) * qty;
      }
    }

    if (subtotal <= 0) return res.status(400).json({ success: false, message: 'ไม่มีรายการที่ต้องชำระ' });

    const discountAmount = computeDiscountAmount(entry, subtotal);
    const totalAfter = Math.max(0, subtotal - discountAmount);

    return res.json({ success: true, data: {
      code: entry.code,
      type: entry.type,
      value: entry.value,
      amount: discountAmount,
      subtotal,
      total: totalAfter,
      description: entry.description || null,
    }});
  } catch (e) {
    console.error('[Discounts] validate preview error:', e);
    res.status(500).json({ success: false, message: 'Failed to validate discount' });
  }
};

// Increment timesUsed when payment completed
const incrementDiscountUsage = async (code) => {
  const c = (code || '').toString().trim().toUpperCase();
  if (!c) return null;
  const updated = await prisma.discountCode.update({
    where: { code: c },
    data: { timesUsed: { increment: 1 }, updatedAt: new Date() },
  });
  return mapRow(updated);
};

// Validate discount payload
const normalizeAndValidate = (payload, { isUpdate = false } = {}) => {
  const errors = [];
  const nowIso = new Date().toISOString();
  const code = (payload.code || '').toString().trim().toUpperCase();

  // Normalize type (accept Thai/English inputs)
  const rawType = (payload.type || 'percentage').toString().trim().toLowerCase();
  const type = (() => {
    const percentAliases = new Set(['percentage','percent','เปอร์เซ็นต์','เปอร์เซนต์','เปอร์เซน','เปอร์เซ็น','percentual']);
    const fixedAliases = new Set(['fixed','amount','บาท','คงที่','มูลค่า','fixed_amount']);
    if (percentAliases.has(rawType)) return 'percentage';
    if (fixedAliases.has(rawType)) return 'fixed';
    return rawType; // leave as-is; will validate below
  })();
  const value = Number(payload.value);
  const description = (payload.description || '').toString();
  const active = payload.active === undefined ? true : !!payload.active;
  // Safe date parsing: avoid toISOString() on invalid date
  const parseDateSafe = (input) => {
    if (!input) return null;
    const d = new Date(input);
    if (isNaN(d)) return 'invalid';
    return d.toISOString();
  };
  const startsAtParsed = parseDateSafe(payload.startsAt);
  const endsAtParsed = parseDateSafe(payload.endsAt);
  const usageLimit = payload.usageLimit != null ? Math.max(0, parseInt(payload.usageLimit, 10)) : null;
  const perUserLimit = payload.perUserLimit != null ? Math.max(0, parseInt(payload.perUserLimit, 10)) : null;

  if (!isUpdate && !code) errors.push('code is required');
  if (!['percentage', 'fixed'].includes(type)) errors.push("type must be 'percentage' or 'fixed'");
  if (!Number.isFinite(value) || value < 0) errors.push('value must be a non-negative number');
  if (type === 'percentage' && (value <= 0 || value > 100)) errors.push('percentage value must be in 1-100');

  if (startsAtParsed === 'invalid') errors.push('startsAt must be a valid date');
  if (endsAtParsed === 'invalid') errors.push('endsAt must be a valid date');
  if (startsAtParsed && endsAtParsed && startsAtParsed !== 'invalid' && endsAtParsed !== 'invalid') {
    if (new Date(startsAtParsed) > new Date(endsAtParsed)) errors.push('startsAt must be before endsAt');
  }

  return {
    errors,
    data: {
      code,
      type,
      value,
      description,
      active,
      startsAt: startsAtParsed && startsAtParsed !== 'invalid' ? startsAtParsed : null,
      endsAt: endsAtParsed && endsAtParsed !== 'invalid' ? endsAtParsed : null,
      usageLimit,
      perUserLimit,
      // defaults managed elsewhere
      timesUsed: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  };
};

// GET /api/admin/discounts
const listDiscounts = async (req, res) => {
  try {
  const codes = await readCodes();
    res.json({ success: true, data: codes });
  } catch (e) {
    console.error('[Discounts] list error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch discount codes' });
  }
};

// POST /api/admin/discounts
const createDiscount = async (req, res) => {
  try {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { errors, data } = normalizeAndValidate(body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const exists = await prisma.discountCode.findUnique({ where: { code: data.code } });
    if (exists) return res.status(409).json({ success: false, message: 'โค้ดนี้มีอยู่แล้ว' });
    const created = await prisma.discountCode.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        description: data.description || null,
        active: data.active,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        timesUsed: 0,
      },
    });
    return res.status(201).json({ success: true, data: mapRow(created) });
  } catch (e) {
    console.error('[Discounts] create error:', e);
    res.status(500).json({ success: false, message: 'Failed to create discount code' });
  }
};

// PUT /api/admin/discounts/:id
const updateDiscount = async (req, res) => {
  try {
    const idParam = req.params.id;
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const id = Number(idParam);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'invalid id' });
    const current = await prisma.discountCode.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'ไม่พบโค้ดส่วนลด' });
    const merged = { ...mapRow(current), ...payload };
    const { errors } = normalizeAndValidate(merged, { isUpdate: true });
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    if (payload.code) {
      const newCode = payload.code.toString().trim().toUpperCase();
      if (newCode !== current.code) {
        const exists = await prisma.discountCode.findUnique({ where: { code: newCode } });
        if (exists) return res.status(409).json({ success: false, message: 'โค้ดนี้มีอยู่แล้ว' });
      }
    }
    const updated = await prisma.discountCode.update({
      where: { id },
      data: {
        code: payload.code ? payload.code.toString().trim().toUpperCase() : undefined,
        type: payload.type || undefined,
        value: payload.value != null ? Number(payload.value) : undefined,
        description: payload.description === undefined ? undefined : (payload.description || null),
        active: payload.active === undefined ? undefined : !!payload.active,
        startsAt: payload.startsAt === undefined ? undefined : (payload.startsAt ? new Date(payload.startsAt) : null),
        endsAt: payload.endsAt === undefined ? undefined : (payload.endsAt ? new Date(payload.endsAt) : null),
        usageLimit: payload.usageLimit === undefined ? undefined : (payload.usageLimit != null ? Math.max(0, parseInt(payload.usageLimit, 10)) : null),
        perUserLimit: payload.perUserLimit === undefined ? undefined : (payload.perUserLimit != null ? Math.max(0, parseInt(payload.perUserLimit, 10)) : null),
      },
    });
    return res.json({ success: true, data: mapRow(updated) });
  } catch (e) {
    console.error('[Discounts] update error:', e);
    res.status(500).json({ success: false, message: 'Failed to update discount code' });
  }
};

// PUT /api/admin/discounts/:id/toggle
const toggleDiscount = async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'invalid id' });
    const current = await prisma.discountCode.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'ไม่พบโค้ดส่วนลด' });
    const updated = await prisma.discountCode.update({ where: { id }, data: { active: !current.active } });
    return res.json({ success: true, data: mapRow(updated) });
  } catch (e) {
    console.error('[Discounts] toggle error:', e);
    res.status(500).json({ success: false, message: 'Failed to toggle discount code' });
  }
};

// DELETE /api/admin/discounts/:id
const deleteDiscount = async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'invalid id' });
    const current = await prisma.discountCode.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'ไม่พบโค้ดส่วนลด' });
    await prisma.discountCode.delete({ where: { id } });
    return res.json({ success: true, data: mapRow(current) });
  } catch (e) {
    console.error('[Discounts] delete error:', e);
    res.status(500).json({ success: false, message: 'Failed to delete discount code' });
  }
};

module.exports = {
  listDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount,
  // helpers for other controllers
  readCodes,
  validateCodeUsability,
  computeDiscountAmount,
  incrementDiscountUsage,
  validateDiscountPreview,
};
