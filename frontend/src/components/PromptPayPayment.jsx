import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getPromptPayQr } from '../utils/promptpay';
import { paymentsAPI } from '../services/api';

const PromptPayPayment = ({ items, onSuccess, onCancel }) => {
  const [sessionId, setSessionId] = useState(null);
  const [amount, setAmount] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // คำนวณราคารวม
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    setAmount(total);
  }, [items]);

  // สร้าง PromptPay session
  const createPaymentSession = async () => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.createPromptPaySession({ items });
      
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        
        // สร้าง QR Code
        const qrUrl = getPromptPayQr(
          response.data.data.promptPayData.mobileNumber,
          response.data.data.amount,
          300
        );
        setQrCodeUrl(qrUrl);
        
        // เริ่มการตรวจสอบสถานะ
        startStatusPolling(response.data.data.sessionId);
        
        toast.success('สร้าง QR Code สำเร็จ! กรุณาสแกนเพื่อชำระเงิน');
      } else {
        toast.error(response.data.message || 'เกิดข้อผิดพลาดในการสร้าง QR Code');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  // ตรวจสอบสถานะการชำระเงิน
  const startStatusPolling = (sessionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await paymentsAPI.getPromptPayStatus(sessionId);
        
        if (response.data.success && response.data.data.isCompleted) {
          clearInterval(interval);
          setPaymentStatus('completed');
          toast.success('🎉 การชำระเงินสำเร็จ!');
          onSuccess && onSuccess(response.data.data);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // ตรวจสอบทุก 5 วินาที

    // หยุดการตรวจสอบหลังจาก 30 นาที
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === 'pending') {
        setPaymentStatus('expired');
        toast.error('QR Code หมดอายุ กรุณาสร้างใหม่');
      }
    }, 30 * 60 * 1000);
  };

  // ยืนยันการชำระเงินด้วย reference number
  const verifyPayment = async () => {
    if (!referenceNumber.trim()) {
      toast.error('กรุณากรอกเลขอ้างอิง');
      return;
    }

    try {
      setIsLoading(true);
      const response = await paymentsAPI.verifyPromptPayPayment({
        sessionId,
        referenceNumber: referenceNumber.trim(),
        amount,
        bankName: bankName.trim() || 'Unknown'
      });

      if (response.data.success) {
        setPaymentStatus('completed');
        toast.success('🎉 การชำระเงินได้รับการยืนยันแล้ว!');
        onSuccess && onSuccess(response.data.data);
      } else {
        toast.error(response.data.message || 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
    } finally {
      setIsLoading(false);
    }
  };

  // แสดงฟอร์มยืนยันการชำระเงิน
  const showVerificationFormHandler = () => {
    setShowVerificationForm(true);
  };

  // ยกเลิกการชำระเงิน
  const handleCancel = () => {
    onCancel && onCancel();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <h3 className="text-xl font-semibold text-white text-center">
          💳 ชำระเงินด้วย PromptPay
        </h3>
        <p className="text-purple-100 text-center mt-1">
          จำนวนเงิน: ฿{amount.toLocaleString()}
        </p>
      </div>

      <div className="p-6">
        {!sessionId ? (
          // ขั้นตอนที่ 1: สร้าง QR Code
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                สร้าง QR Code สำหรับชำระเงิน
              </h4>
              <p className="text-gray-600 text-sm">
                กดปุ่มด้านล่างเพื่อสร้าง QR Code ที่สามารถสแกนได้ด้วยแอปธนาคาร
              </p>
            </div>

            <button
              onClick={createPaymentSession}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังสร้าง QR Code...
                </div>
              ) : (
                'สร้าง QR Code'
              )}
            </button>

            <button
              onClick={handleCancel}
              className="w-full mt-3 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          // ขั้นตอนที่ 2: แสดง QR Code และสถานะ
          <div className="text-center">
            {paymentStatus === 'pending' && (
              <>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    📱 สแกน QR Code เพื่อชำระเงิน
                  </h4>
                  
                  {qrCodeUrl && (
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                      <img 
                        src={qrCodeUrl} 
                        alt="PromptPay QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-blue-900 mb-2">📋 วิธีการชำระเงิน:</h5>
                    <ol className="text-sm text-blue-800 text-left space-y-1">
                      <li>1. เปิดแอปธนาคารของคุณ</li>
                      <li>2. เลือก "สแกน QR Code"</li>
                      <li>3. สแกน QR Code ด้านบน</li>
                      <li>4. ตรวจสอบจำนวนเงินและกดยืนยัน</li>
                      <li>5. กรอกเลขอ้างอิงจากธนาคาร</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⏰ QR Code จะหมดอายุใน 30 นาที
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={showVerificationFormHandler}
                    className="w-full bg-green-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    ✅ ยืนยันการชำระเงินแล้ว
                  </button>

                  <button
                    onClick={handleCancel}
                    className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            )}

            {paymentStatus === 'completed' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  🎉 การชำระเงินสำเร็จ!
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  คุณสามารถดาวน์โหลดชีทได้ในหน้า "ชีทของฉัน"
                </p>
                <button
                  onClick={() => onSuccess && onSuccess()}
                  className="w-full bg-green-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  ไปที่ชีทของฉัน
                </button>
              </div>
            )}

            {paymentStatus === 'expired' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  ⏰ QR Code หมดอายุ
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  กรุณาสร้าง QR Code ใหม่เพื่อชำระเงิน
                </p>
                <button
                  onClick={() => {
                    setSessionId(null);
                    setPaymentStatus('pending');
                    setQrCodeUrl('');
                  }}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  สร้าง QR Code ใหม่
                </button>
              </div>
            )}
          </div>
        )}

        {/* ฟอร์มยืนยันการชำระเงิน */}
        {showVerificationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                📝 ยืนยันการชำระเงิน
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขอ้างอิงจากธนาคาร *
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="เช่น: 123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อธนาคาร (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="เช่น: กสิกรไทย, ไทยพาณิชย์"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>เลขอ้างอิง</strong> คือหมายเลขที่ธนาคารให้หลังจากโอนเงินสำเร็จ 
                    มักจะแสดงในหน้าจอหรือ SMS ยืนยันการโอนเงิน
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={verifyPayment}
                  disabled={isLoading || !referenceNumber.trim()}
                  className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                </button>
                
                <button
                  onClick={() => setShowVerificationForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPayPayment;
