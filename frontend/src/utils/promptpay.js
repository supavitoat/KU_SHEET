// PromptPay QR payload generator (EMVCo Standard)
// Supports Thai mobile number PromptPay ID and prefilled amount
// This implementation follows the official EMVCo specification for PromptPay

function pad2(n) {
  return n.toString().padStart(2, '0');
}

function tlv(id, value) {
  if (!value) return '';
  const len = pad2(value.toString().length);
  return `${id}${len}${value}`;
}

// CRC16-CCITT (IBM/False) used by EMVCo standard
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Convert Thai mobile number to PromptPay format
// 0XXXXXXXXX -> 0066XXXXXXXXX
function toPromptPayMobile(mobile) {
  const sanitized = mobile.toString().replace(/[^0-9]/g, '');
  if (sanitized.startsWith('0')) {
    return `0066${sanitized.substring(1)}`;
  }
  if (sanitized.startsWith('66')) {
    return `00${sanitized}`;
  }
  if (sanitized.startsWith('0066')) return sanitized;
  // Fallback: assume it's a Thai number
  return `0066${sanitized}`;
}

/**
 * สร้าง PromptPay payload ตามมาตรฐาน EMVCo ที่ใช้งานได้จริง
 * @param {Object} options - ตัวเลือกสำหรับสร้าง QR Code
 * @param {string} options.mobileNumber - หมายเลขโทรศัพท์ PromptPay
 * @param {number} options.amount - จำนวนเงิน (บาท)
 * @param {string} options.merchantName - ชื่อร้านค้า (สูงสุด 25 ตัวอักษร)
 * @param {string} options.city - เมือง (สูงสุด 15 ตัวอักษร)
 * @returns {string} EMVCo payload ที่พร้อมใช้งาน
 */
export function buildPromptPayPayload({ 
  mobileNumber, 
  amount, 
  merchantName = 'KU SHEET', 
  city = 'BANGKOK' 
}) {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!mobileNumber || !amount) {
      throw new Error('Mobile number and amount are required');
    }

    // แปลงหมายเลขโทรศัพท์เป็นรูปแบบ PromptPay
    const promptPayId = toPromptPayMobile(mobileNumber);
    
    // ตรวจสอบรูปแบบหมายเลขโทรศัพท์
    const phoneRegex = /^0[2-9]\d{7,8}$/;
    if (!phoneRegex.test(mobileNumber.toString())) {
      throw new Error('Invalid Thai mobile number format');
    }

    // สร้าง payload ตามมาตรฐาน EMVCo สำหรับ PromptPay
    const payloadNoCRC = 
      tlv('00', '01') +                    // Payload Format Indicator (01 = EMV QR)
      tlv('01', '12') +                    // Point of Initiation Method (12 = dynamic QR)
      tlv('29',                            // Merchant Account Information
        tlv('00', 'A000000677010111') +    // Global Unique Identifier (PromptPay)
        tlv('01', promptPayId)             // PromptPay ID (0066XXXXXXXXX)
      ) +
      tlv('53', '764') +                   // Transaction Currency (THB)
      tlv('54', Number(amount).toFixed(2)) + // Transaction Amount
      tlv('58', 'TH') +                    // Country Code (Thailand)
      tlv('59', merchantName.substring(0, 25)) + // Merchant Name
      tlv('60', city.substring(0, 15)) +   // Merchant City
      '6304';                              // CRC placeholder

    // คำนวณ CRC16 checksum
    const crc = crc16(payloadNoCRC);
    const finalPayload = payloadNoCRC + crc;

    return finalPayload;
  } catch (error) {
    console.error('❌ Error generating PromptPay payload:', error.message);
    throw error;
  }
}

/**
 * สร้าง QR Code URL จาก external API ที่เสถียร
 * @param {string} payload - EMVCo payload
 * @param {number} size - ขนาด QR Code (pixels)
 * @returns {string} URL ของ QR Code image
 */
export function getQrImageUrlFromPayload(payload, size = 300) {
  // ใช้ api.qrserver.com ที่เสถียรและรองรับ EMVCo payload
  const encodedPayload = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedPayload}&format=png&margin=2&ecc=M`;
}

/**
 * สร้าง PromptPay QR Code ที่ใช้งานได้จริง
 * @param {string} mobileNumber - หมายเลขโทรศัพท์ PromptPay (0XXXXXXXXX)
 * @param {number} amount - จำนวนเงิน (บาท)
 * @param {number} size - ขนาด QR Code (pixels)
 * @returns {string} URL ของ QR Code image
 */
export function getPromptPayQr(mobileNumber, amount, size = 300) {
  try {
    const payload = buildPromptPayPayload({ mobileNumber, amount });
    const qrUrl = getQrImageUrlFromPayload(payload, size);
    
    return qrUrl;
  } catch (error) {
    console.error('❌ Failed to generate PromptPay QR Code:', error.message);
    throw error;
  }
}

/**
 * ตรวจสอบว่า QR Code ที่สร้างขึ้นใช้งานได้จริงหรือไม่
 * @param {string} payload - EMVCo payload
 * @returns {boolean} true ถ้า payload ถูกต้อง
 */
export function validatePromptPayPayload(payload) {
  try {
    // ตรวจสอบความยาวขั้นต่ำ
    if (payload.length < 50) return false;
    
    // ตรวจสอบว่าเริ่มต้นด้วย 000201
    if (!payload.startsWith('000201')) return false;
    
    // ตรวจสอบว่ามี CRC16 ที่ถูกต้อง
    const payloadWithoutCRC = payload.slice(0, -4);
    const expectedCRC = crc16(payloadWithoutCRC);
    const actualCRC = payload.slice(-4);
    
    return expectedCRC === actualCRC;
  } catch (error) {
    console.error('❌ Error validating payload:', error.message);
    return false;
  }
}

/**
 * แสดงข้อมูล QR Code สำหรับการ debug
 * @param {string} payload - EMVCo payload
 */
export function debugPromptPayPayload(payload) {
  // แยก TLV fields
  let pos = 0;
  while (pos < payload.length - 4) { // -4 เพื่อไม่รวม CRC
    const tag = payload.substr(pos, 2);
    const len = parseInt(payload.substr(pos + 2, 2));
    const value = payload.substr(pos + 4, len);
    
    // Log parsed TLV in dev only to avoid unused vars
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      console.debug('[PromptPay][TLV]', { tag, len, value: value.slice(0, 24) + (value.length > 24 ? '…' : '') });
    }
    pos += 4 + len;
  }
  
  // ตรวจสอบ CRC
  const payloadWithoutCRC = payload.slice(0, -4);
  const expectedCRC = crc16(payloadWithoutCRC);
  const actualCRC = payload.slice(-4);
  const isValid = expectedCRC === actualCRC;

  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    console.debug('[PromptPay][CRC]', { expectedCRC, actualCRC, isValid });
  }

  return { expectedCRC, actualCRC, isValid };
}

