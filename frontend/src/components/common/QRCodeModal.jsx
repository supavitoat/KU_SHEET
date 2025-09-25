import React from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { MemoizedQRCode } from '../optimized/MemoizedComponents';

const QRCodeModal = ({ isOpen, onClose, payoutData, onTransferConfirmed }) => {
  if (!isOpen) return null;

  // CRC16-CCITT (IBM/False) ตามมาตรฐาน EMVCo
  const crc16 = (str) => {
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
  };

  // สร้าง TLV (Tag-Length-Value) ตามมาตรฐาน EMVCo
  const tlv = (tag, value) => {
    if (!value) return '';
    const len = value.toString().length.toString().padStart(2, '0');
    return `${tag}${len}${value}`;
  };

  // แปลงหมายเลขโทรศัพท์ไทยเป็นรูปแบบ PromptPay
  const toPromptPayMobile = (mobile) => {
    const sanitized = mobile.toString().replace(/[^0-9]/g, '');
    if (sanitized.startsWith('0')) {
      return `0066${sanitized.substring(1)}`;
    }
    if (sanitized.startsWith('66')) {
      return `00${sanitized}`;
    }
    if (sanitized.startsWith('0066')) return sanitized;
    return `0066${sanitized}`;
  };

  // สร้าง PromptPay QR Code ตามมาตรฐาน EMVCo ที่ใช้งานได้จริง
  const generatePromptPayQR = (amount, promptPayId) => {
    try {
      // ตรวจสอบข้อมูล
      if (!promptPayId || !amount) {
        console.error('Missing data:', { promptPayId, amount });
        return null;
      }
      
      // ตรวจสอบว่า PromptPay ID เป็นเลขโทรศัพท์ที่ถูกต้อง
      const phoneRegex = /^0[2-9]\d{7,8}$/;
      if (!phoneRegex.test(promptPayId.toString())) {
        console.error('Invalid phone number format:', promptPayId);
        return null;
      }
      
      // แปลง PromptPay ID เป็นรูปแบบที่ถูกต้อง
      const cleanId = toPromptPayMobile(promptPayId);
      // สร้าง payload ตามมาตรฐาน EMVCo สำหรับ PromptPay
      const payloadNoCRC = 
        tlv('00', '01') +                    // Payload Format Indicator
        tlv('01', '12') +                    // Point of Initiation Method (12 = dynamic)
        tlv('29',                            // Merchant Account Information
          tlv('00', 'A000000677010111') +    // Global Unique Identifier
          tlv('01', cleanId)                 // PromptPay ID
        ) +
        tlv('53', '764') +                   // Transaction Currency (THB)
        tlv('54', Number(amount).toFixed(2)) + // Transaction Amount
        tlv('58', 'TH') +                    // Country Code
        tlv('59', 'KU SHEET') +              // Merchant Name
        tlv('60', 'BANGKOK') +               // Merchant City
        '6304';                              // CRC placeholder
      
      // คำนวณ CRC16
      const crc = crc16(payloadNoCRC);
      const finalPayload = payloadNoCRC + crc;
      
      // Debug logging - only in development
      if (process.env.NODE_ENV === 'development') {
        // console.debug('[QRCodeModal] Generated EMV payload');
      }
      
      return finalPayload;
    } catch (error) {
      console.error('Error generating PromptPay QR:', error);
      return null;
    }
  };

  // สร้าง QR Code จาก PromptPay เท่านั้น
  let qrCodeData;
  let qrCodeType;
  
  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    // console.debug('[QRCodeModal] Building QR code data');
  }
  
  // ตรวจสอบ PromptPay ID
  const promptPayId = payoutData?.promptPayId;
  const isValidPromptPay = promptPayId && 
                          promptPayId !== 'ไม่ระบุ' && 
                          promptPayId !== null && 
                          /^0[2-9]\d{7,8}$/.test(promptPayId.toString());
  
  if (process.env.NODE_ENV === 'development') {
    // console.debug('[QRCodeModal] PromptPay validity:', isValidPromptPay);
  }
  
  if (isValidPromptPay) {
    // ใช้จำนวนเงินที่ถูกต้อง (netAmount หรือ amount)
    const amount = payoutData?.netAmount || payoutData?.amount;
    
    if (process.env.NODE_ENV === 'development') {
      // console.debug('[QRCodeModal] Using PromptPay QR');
    }
    
    // สร้าง PromptPay QR Code ตามมาตรฐาน EMVCo
    const emvPayload = generatePromptPayQR(amount, promptPayId);
    
    if (emvPayload) {
      qrCodeData = emvPayload;
      qrCodeType = 'promptpay';
      if (process.env.NODE_ENV === 'development') {
        // console.debug('[QRCodeModal] Generated QR successfully');
      }
    } else {
      qrCodeData = 'ERROR_GENERATING_QR';
      qrCodeType = 'error';
      if (process.env.NODE_ENV === 'development') {
        // console.debug('[QRCodeModal] Failed to generate QR');
      }
    }
  } else {
    // ถ้าไม่มี PromptPay ID ให้แสดงข้อความแจ้งเตือน
    qrCodeData = 'NO_PROMPTPAY_ID';
    qrCodeType = 'error';
    if (process.env.NODE_ENV === 'development') {
      // console.debug('[QRCodeModal] No PromptPay ID');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">QR Code สำหรับโอนเงิน</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Account Information */}
        <div className="mb-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">เลขบัญชี:</span>
            <span className="font-medium">{payoutData?.bankAccount || 'ไม่ระบุ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ชื่อบัญชี:</span>
            <span className="font-medium">{payoutData?.accountName || 'ไม่ระบุ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PromptPay:</span>
            <span className="font-medium">{payoutData?.promptPayId || 'ไม่ระบุ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">จำนวนเงิน:</span>
            <span className="font-medium">฿{payoutData?.netAmount || 0}</span>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCodeType === 'promptpay' && qrCodeData !== 'ERROR_GENERATING_QR' ? (
          <div className="text-center mb-3">
            <div className="bg-white p-3 rounded-lg border inline-block">
              <MemoizedQRCode
                value={qrCodeData}
                size={150}
                className="mx-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              QR Code สำหรับโอนเงิน สแกนเพื่อโอนเงินผ่าน PromptPay
            </p>
          </div>
        ) : qrCodeType === 'error' ? (
          <div className="text-center mb-3">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {qrCodeData === 'NO_PROMPTPAY_ID' 
                ? 'ไม่พบหมายเลข PromptPay ที่ถูกต้อง' 
                : 'เกิดข้อผิดพลาดในการสร้าง QR Code'}
            </div>
          </div>
        ) : null}



        {/* Instructions */}
        {qrCodeType === 'promptpay' && qrCodeData !== 'ERROR_GENERATING_QR' && (
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-700 mb-1">
              วิธีการโอนเงินผ่าน PromptPay:
            </h3>
            <ol className="list-decimal list-inside text-xs text-gray-600 space-y-0.5">
              <li>เปิดแอปธนาคารของคุณ</li>
              <li>เลือก "PromptPay" หรือ "สแกน QR Code"</li>
              <li>สแกน QR Code ด้านบน</li>
              <li>ตรวจสอบจำนวนเงินและกดยืนยัน</li>
              <li>โอนเงินสำเร็จ!</li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            ปิด
          </button>
          
          <button
            onClick={() => {
              if (onTransferConfirmed) {
                onTransferConfirmed(payoutData);
              }
              onClose();
            }}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            ยืนยันการโอนเงิน
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
