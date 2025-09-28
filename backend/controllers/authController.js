const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const { sendMail } = require('../config/mailer');
const { downloadImage, isGoogleProfilePicture, generateProfileFilename } = require('../utils/downloadImage');
// Retry wrapper
const { withPrismaRetry } = require('../utils/prismaRetry');

// Lightweight in-memory throttle (best-effort)
const throttle = (() => {
  const hits = new Map();
  const windowMs = 60 * 1000; // 60s window
  const limits = { login: 10, forgot: 5 };
  function allow(key, type) {
    const now = Date.now();
    const k = `${type}:${key}`;
    const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (arr.length >= (limits[type] || 10)) return false;
    arr.push(now);
    hits.set(k, arr);
    return true;
  }
  return { allow };
})();

// Small sanitizers
const capLen = (v, max) => (typeof v === 'string' ? v.slice(0, max) : v);
const trimStr = (v) => (typeof v === 'string' ? v.trim() : v);

// Generate JWT token (assumes env validated on bootstrap)
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET missing');
  }
  const exp = process.env.JWT_EXPIRE || '7d';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: exp }
  );
};

// Helper: normalize email
const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// Helper: safely parse year
const safeParseYear = (year) => {
  const y = parseInt(year, 10); return Number.isInteger(y) && y > 0 && y < 100 ? y : null;
};

// Helper: build user response shape (flexible seller key naming)
function buildUserResponse(user, { includeSeller = false, sellerKey = 'is_seller', includeSellerObject = false } = {}) {
  if (!user) return null;
  const base = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    faculty: user.faculty,
    major: user.major,
    year: user.year,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
    profileCompleted: user.profileCompleted,
    picture: user.picture
  };
  if (includeSeller) {
    base[sellerKey] = user.isSeller;
  }
  if (includeSellerObject) {
    base.seller = user.seller ? {
      id: user.seller.id,
      penName: user.seller.penName,
      sellerId: user.seller.sellerId
    } : null;
  }
  return base;
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      const emailError = errors.array().find(err => err.path === 'email');
      if (emailError) {
        if (emailError.msg === 'Please provide a valid email') errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        else if (emailError.msg.includes('required')) errorMessage = 'กรุณากรอกอีเมล';
      }
      const passwordError = errors.array().find(err => err.path === 'password');
      if (passwordError) {
        if (passwordError.msg.includes('required')) errorMessage = 'กรุณากรอกรหัสผ่าน';
        else if (passwordError.msg.includes('min')) errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      }
      return res.status(400).json({ success: false, message: errorMessage, errors: errors.array() });
    }

    let { email, password, fullName, faculty, major, year } = req.body;
    email = normalizeEmail(email);
    fullName = capLen(trimStr(fullName), 100);
    faculty = capLen(trimStr(faculty), 100);
    major = capLen(trimStr(major), 100);

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    const existingUser = await withPrismaRetry(() => prisma.user.findUnique({ where: { email } }));
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await withPrismaRetry(() => prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        faculty,
        major,
        year: safeParseYear(year),
        role: 'USER',
        isFirstLogin: false,
        profileCompleted: true
      }
    }));

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      data: { user: buildUserResponse(user, { includeSeller: true, sellerKey: 'is_seller' }), token }
    });
  } catch (error) {
  console.error('[Auth] Register error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // throttle per IP/email best-effort
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || 'unknown';
    const emailKey = normalizeEmail(req.body?.email);
    if (!throttle.allow(ip, 'login') || !throttle.allow(emailKey, 'login')) {
      return res.status(429).json({ success: false, message: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      const emailError = errors.array().find(err => err.path === 'email');
      if (emailError) {
        if (emailError.msg === 'Please provide a valid email') errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        else if (emailError.msg.includes('required')) errorMessage = 'กรุณากรอกอีเมล';
      }
      const passwordError = errors.array().find(err => err.path === 'password');
      if (passwordError) {
        if (passwordError.msg.includes('required')) errorMessage = 'กรุณากรอกรหัสผ่าน';
        else if (passwordError.msg.includes('min')) errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      }
      return res.status(400).json({ success: false, message: errorMessage, errors: errors.array() });
    }

    let { email, password } = req.body;
    email = normalizeEmail(email);

    const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email }, include: { seller: true } }));
    if (!user) {
      return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = generateToken(user);

    // Fire & forget update (no need to block response). Use retry but ignore failure.
    withPrismaRetry(() => prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })).catch(err => {
  console.warn('[Auth] Failed to update last login', { userId: user.id, err: err.message });
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: buildUserResponse(user, { includeSeller: true, includeSellerObject: true, sellerKey: 'is_seller' }), token }
    });
  } catch (error) {
  console.error('[Auth] Login error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { id: req.user.id }, include: { seller: true } }));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const responseData = { success: true, data: { user: buildUserResponse(user, { includeSeller: true, sellerKey: 'is_seller', includeSellerObject: true }) } };
    res.json(responseData);
  } catch (error) {
  console.error('[Auth] Get me error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      const fullNameError = errors.array().find(err => err.path === 'fullName');
      if (fullNameError && fullNameError.msg.includes('required')) errorMessage = 'กรุณากรอกชื่อ-นามสกุล';
      const facultyError = errors.array().find(err => err.path === 'faculty');
      if (facultyError && facultyError.msg.includes('required')) errorMessage = 'กรุณาเลือกคณะ';
      const majorError = errors.array().find(err => err.path === 'major');
      if (majorError && majorError.msg.includes('required')) errorMessage = 'กรุณาเลือกสาขา';
      const yearError = errors.array().find(err => err.path === 'year');
      if (yearError && yearError.msg.includes('required')) errorMessage = 'กรุณาเลือกชั้นปี';
      return res.status(400).json({ success: false, message: errorMessage, errors: errors.array() });
    }

    let { fullName, faculty, major, year } = req.body;
    fullName = capLen(trimStr(fullName), 100);
    faculty = capLen(trimStr(faculty), 100);
    major = capLen(trimStr(major), 100);

    const user = await withPrismaRetry(() => prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        faculty,
        major,
        year: safeParseYear(year),
        profileCompleted: true,
        isFirstLogin: false
      }
    }));

    res.json({ success: true, message: 'Profile updated successfully', data: { user: buildUserResponse(user, { sellerKey: 'is_seller' }) } });
  } catch (error) {
  console.error('[Auth] Update profile error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};

// @desc    Update user profile name only
// @route   PUT /api/auth/profile/name
// @access  Private
const updateProfileName = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      const fullNameError = errors.array().find(err => err.path === 'fullName');
      if (fullNameError && fullNameError.msg.includes('required')) errorMessage = 'กรุณากรอกชื่อ-นามสกุล';
      return res.status(400).json({ success: false, message: errorMessage, errors: errors.array() });
    }

    let { fullName } = req.body;
    fullName = capLen(trimStr(fullName), 100);
    const user = await withPrismaRetry(() => prisma.user.update({ where: { id: req.user.id }, data: { fullName } }));
    res.json({ success: true, message: 'Profile name updated successfully', data: { user: buildUserResponse(user, { sellerKey: 'is_seller' }) } });
  } catch (error) {
  console.error('[Auth] Update profile name error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error during profile name update' });
  }
};

// @desc    Update user profile picture
// @route   PUT /api/auth/profile-picture
// @access  Private
const updateProfilePicture = async (req, res) => {
  try {
    const { picture } = req.body;
    const userId = req.user.id;

    if (!picture) return res.status(400).json({ success: false, message: 'กรุณาเลือกรูปโปรไฟล์' });

    // Fetch current user first so we know the old picture path (do BEFORE any writes)
    const existingUser = await withPrismaRetry(() => prisma.user.findUnique({ where: { id: userId } }));
    if (!existingUser) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    const oldPicture = existingUser.picture || null;

    // Ensure upload dir exists
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let savedPath = null;

    // Case 1: data URL (base64)
    if (picture.startsWith('data:')) {
      const match = picture.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ success: false, message: 'รูปแบบรูปภาพไม่ถูกต้อง' });
      }
      const mime = match[1];
      const base64 = match[2];
      const buffer = Buffer.from(base64, 'base64');

      // Size check: 5MB max
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)' });
      }

      // Map mime to extension
      const extMap = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
      };
      const ext = extMap[mime] || '.png';
      const filename = `profile_${userId}_${Date.now()}${ext}`;
      const absPath = path.join(uploadDir, filename);
      await fs.promises.writeFile(absPath, buffer);
      savedPath = `/uploads/profiles/${filename}`;
    }
    // Case 2: remote URL - download and save
    else if (picture.startsWith('http://') || picture.startsWith('https://')) {
      try {
        const filename = generateProfileFilename(userId, null);
        savedPath = await downloadImage(picture, filename);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'ไม่สามารถดาวน์โหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง' });
      }
    }
    // Unsupported format
    else {
      return res.status(400).json({ success: false, message: 'รูปแบบรูปภาพไม่ถูกต้อง' });
    }

    const updatedUser = await withPrismaRetry(() => prisma.user.update({
      where: { id: userId },
      data: { picture: savedPath },
      include: { seller: true }
    }));

    // After successful DB update, attempt to delete old local file (best effort)
    (async () => {
      try {
        if (oldPicture && oldPicture !== savedPath && typeof oldPicture === 'string') {
          // Only delete if it points to our profiles directory
            // Normalize old picture path (it may or may not start with a leading slash)
          const normalized = oldPicture.replace(/^\//, '');
          if (normalized.startsWith('uploads/profiles/')) {
            const baseDir = path.join(__dirname, '../uploads/profiles');
            const absOld = path.join(__dirname, '..', normalized); // join to project root
            // Ensure within baseDir to prevent traversal
            if (absOld.startsWith(baseDir)) {
              if (fs.existsSync(absOld)) {
                await fs.promises.unlink(absOld);
              }
            }
          }
        }
      } catch (delErr) {
        console.warn('[Auth] Failed to delete old profile picture', { userId, oldPicture, err: delErr.message });
      }
    })();

    res.json({
      success: true,
      message: 'อัปเดตรูปโปรไฟล์สำเร็จ',
      data: { user: buildUserResponse(updatedUser, { includeSeller: true, sellerKey: 'is_seller', includeSellerObject: true }) }
    });
  } catch (error) {
    console.error('[Auth] Update profile picture error', { message: error.message, stack: error.stack, code: error.code });
    if (error.code === 'ER_DATA_TOO_LONG') return res.status(400).json({ success: false, message: 'รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลง' });
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'ข้อมูลซ้ำ กรุณาลองใหม่อีกครั้ง' });
    if (['ECONNREFUSED','ENOTFOUND'].includes(error.code)) return res.status(503).json({ success: false, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    // Use URL fragment to avoid token in referrer logs
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback#token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
  console.error('[Auth] Google callback error', { message: error.message, stack: error.stack });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

// @desc    Google Identity Services credential login
// @route   POST /api/auth/google/callback
// @access  Public
const googleCredentialLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Missing credential' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const fullName = capLen(trimStr(payload.name), 100);
    const picture = payload.picture;
    const googleId = payload.sub;

    let user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email } }));
    if (!user) {
      return res.json({ success: true, firstLogin: true, user: { email, fullName, picture, googleId } });
    }

    const updateData = {};
    if (!user.googleId && googleId) updateData.googleId = googleId;
    if (Object.keys(updateData).length) {
      user = await withPrismaRetry(() => prisma.user.update({ where: { email }, data: updateData }));
    }

    if (picture && isGoogleProfilePicture(picture) && (!user.picture || isGoogleProfilePicture(user.picture))) {
      try {
        const filename = generateProfileFilename(user.id, googleId);
        const localPicturePath = await downloadImage(picture, filename);
        user = await withPrismaRetry(() => prisma.user.update({ where: { email }, data: { picture: localPicturePath } }));
      } catch (err) {
  console.warn('[Auth] Failed to download Google profile picture', { email, err: err.message });
      }
    }

    const token = generateToken(user);
    res.json({ success: true, token, user: buildUserResponse(user, { sellerKey: 'is_seller' }) });
  } catch (error) {
  console.error('[Auth] Google credential login failed', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Google login failed' });
  }
};

// @desc    Google register after infoEnter
// @route   POST /api/auth/google/register
// @access  Public
const googleRegister = async (req, res) => {
  try {
    const { credential, full_name, faculty, major, year } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Missing credential' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const fullName = capLen(trimStr(full_name || payload.name), 100);
    const picture = payload.picture;
    const googleId = payload.sub;

    let user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email } }));
    if (user) return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });

    let localPicturePath = picture;
    if (picture && isGoogleProfilePicture(picture)) {
      try {
        const filename = generateProfileFilename(null, googleId);
        localPicturePath = await downloadImage(picture, filename);
      } catch (err) {
  console.warn('[Auth] Failed to download Google profile picture for new user', { email, err: err.message });
        localPicturePath = null;
      }
    }

    user = await withPrismaRetry(() => prisma.user.create({
      data: {
        email,
        fullName,
        password: '',
        role: 'USER',
        isFirstLogin: false,
        profileCompleted: true,
        faculty: capLen(trimStr(faculty), 100),
        major: capLen(trimStr(major), 100),
        year: safeParseYear(year),
        picture: localPicturePath,
        googleId
      }
    }));

    const token = generateToken(user);
    res.json({ success: true, token, user: buildUserResponse(user, { sellerKey: 'is_seller' }) });
  } catch (error) {
  console.error('[Auth] Google register error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Google register failed' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (_req, res) => {
  try {
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
  console.error('[Auth] Logout error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// @desc    Check if email is already registered
// @route   POST /api/auth/check-email
// @access  Public
const checkEmail = async (req, res) => {
  try {
    let { email } = req.body; email = normalizeEmail(email);
    if (!email) return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมล' });
    const existingUser = await withPrismaRetry(() => prisma.user.findUnique({ where: { email } }));
    if (existingUser) {
      return res.status(200).json({ success: true, data: { isAvailable: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' } });
    }
    return res.status(200).json({ success: true, data: { isAvailable: true, message: 'อีเมลนี้สามารถใช้งานได้' } });
  } catch (error) {
  console.error('[Auth] Check email error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' });
  }
};

// @desc    Forgot password (send reset link)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    // throttle per IP/email best-effort
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || 'unknown';
    const emailKeyRaw = req.body?.email;
    const emailKey = normalizeEmail(emailKeyRaw);
    if (!throttle.allow(ip, 'forgot') || !throttle.allow(emailKey, 'forgot')) {
      return res.status(429).json({ success: false, message: 'คุณขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่' });
    }

    let { email } = req.body; email = normalizeEmail(email);
    if (!email) return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล' });
    const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { email } }));
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });

    const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `\n      <div style="max-width:420px;margin:0 auto;padding:32px 24px 24px 24px;background:#fff;border-radius:16px;font-family:sans-serif;text-align:center;">\n        <div style="font-size:64px;margin-bottom:16px;">🔒</div>\n        <h2 style="color:#853EF4;font-size:1.5rem;margin-bottom:8px;">รีเซ็ตรหัสผ่าน <span style='color:#6300FF'>KU SHEET</span></h2>\n        <p style="margin-bottom:8px;">คุณได้รับอีเมลนี้เนื่องจากมีการขอรีเซ็ตรหัสผ่านบัญชี KU SHEET ของคุณ<br>กรุณากดปุ่มด้านล่างเพื่อเปลี่ยนรหัสผ่านใหม่</p>\n        <div style="color:#853EF4;margin-bottom:16px;">ลิงก์นี้จะหมดอายุใน 30 นาที</div>\n        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(90deg,#853EF4 0%,#6300FF 100%);color:#fff;border-radius:32px;font-weight:bold;text-decoration:none;font-size:1rem;margin-bottom:16px;">รีเซ็ตรหัสผ่าน</a>\n        <p style="color:#888;font-size:0.95rem;margin-top:16px;">หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาไม่ต้องดำเนินการใดๆ กับอีเมลนี้<br>KU SHEET Team</p>\n        <div style="color:#bbb;font-size:0.85rem;margin-top:24px;">© KU SHEET 2025</div>\n      </div>\n    `;
    await sendMail({ from: process.env.SMTP_FROM || 'no-reply@kusheet.com', to: email, subject: 'รีเซ็ตรหัสผ่าน KU SHEET', html });
    res.json({ success: true, message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว' });
  } catch (error) {
  console.error('[Auth] Forgot password error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'ลิงก์หมดอายุหรือไม่ถูกต้อง' });
    }

    const user = await withPrismaRetry(() => prisma.user.findUnique({ where: { id: payload.id } }));
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    await withPrismaRetry(() => prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }));
    res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
  console.error('[Auth] Reset password error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateProfileName,
  updateProfilePicture,
  googleCallback,
  googleCredentialLogin,
  googleRegister,
  logout,
  checkEmail,
  forgotPassword,
  resetPassword
};