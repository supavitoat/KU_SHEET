import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { paymentsAPI } from '../../services/api';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, clearCart, getFinalTotal, discountInfo } = useCart();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const finalTotal = getFinalTotal();

  // ตรวจสอบการล็อกอิน
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // ตรวจสอบว่ามีสินค้าในตระกร้าหรือไม่
  if (!items || items.length === 0) {
    navigate('/cart');
    return null;
  }

  // จัดการการชำระเงินสำเร็จ
  // Handlers for external redirects are managed elsewhere

  // จัดการการยกเลิกการชำระเงิน
  

  // กลับไปแก้ไขรายการ
  const handleBackToCart = () => {
    navigate('/cart');
  };

  // เลือกซื้อสินค้าเพิ่ม
  

  const startPromptPayCheckout = async () => {
    try {
      setProcessing(true);
      setError(null);
      // ส่งเฉพาะรายการที่ต้องจ่ายเงินจริงไปสร้าง session
      const paidItems = items.filter(i => !(i.isFree || i.price === 0 || i.price === '0'));
      const payload = {
        items: paidItems.map(i => ({ id: i.id, quantity: i.quantity || 1 })),
        successUrl: `${window.location.origin}/mysheet?paid=1&clearCart=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cart`
      };
      if (payload.items.length === 0) {
        // กรณีไม่มีรายการที่ต้องจ่าย ฝั่ง backend จะจัดการให้แล้ว แต่กันไว้ที่นี่ด้วย
        toast.success('🎉 ได้รับชีทฟรีเรียบร้อยแล้ว');
        clearCart();
        navigate('/mysheet');
        return;
      }
  const { data } = await paymentsAPI.createStripeCheckoutSession({ ...payload, discountCode: discountInfo?.code || undefined });
      if (data?.success && data?.data?.noPayment) {
        // กรณีเป็นชีทฟรีทั้งหมด ไม่ต้องชำระเงิน
        toast.success('🎉 ได้รับชีทฟรีเรียบร้อยแล้ว');
        clearCart();
        navigate('/mysheet');
        return;
      }
      if (data?.success && data?.data?.checkoutUrl) {
        // เปลี่ยนหน้าใน tab เดิมไปยัง Stripe Checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        setError('ไม่สามารถเริ่มการชำระเงินด้วย PromptPay ได้');
      }
  } catch {
      setError('เกิดข้อผิดพลาดในการเริ่มการชำระเงินด้วย PromptPay');
    } finally {
      setProcessing(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      {/* Header */}
      <div className="bg-transparent relative z-10">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-20">
          <div className="flex justify-between items-start py-8">
            <div className="flex items-center space-x-4 animate-fadeInUp animation-delay-200">
              <button
                onClick={handleBackToCart}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>กลับ</span>
              </button>
            </div>

            <div className="text-center flex-1 animate-fadeInUp animation-delay-400">
              <div className="mb-4 mt-8">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight py-1">
                  ชำระเงิน
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-6">ทำการชำระเงินตามขั้นตอนด้านล่าง</p>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-1 rounded-full animate-gradient-flow"></div>
              </div>
            </div>

            <div className="flex items-center space-x-4"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-20 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 animate-fadeInUp animation-delay-600">
            <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2 text-purple-600" />
                สรุปการสั่งซื้อ
              </h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100 hover:scale-[1.02]">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.subjectCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ฿{(item.price * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>ยอดรวมทั้งหมด:</span>
                  <span className="text-2xl text-purple-600">฿{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Method */}
          <div className="lg:col-span-1 animate-fadeInUp animation-delay-800">
            <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CreditCardIcon className="w-6 h-6 mr-2 text-green-600" />
                วิธีการชำระเงิน
              </h2>

              {/* PromptPay via Stripe Checkout */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-300 hover:bg-green-100 hover:border-green-300">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">พร้อมเพย์ (QR Code)</h3>
                      <p className="text-sm text-green-700">ไปที่หน้า Checkout เพื่อสร้าง QR และชำระเงินได้ทันที</p>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  onClick={startPromptPayCheckout}
                  disabled={processing}
                  className="w-full bg-green-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  {processing ? 'กำลังไปหน้า Checkout...' : 'ชำระเงินด้วยพร้อมเพย์ (QR)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 animate-fadeInUp animation-delay-1000 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-yellow-600" />
            ข้อมูลสำคัญ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300 hover:bg-blue-100 hover:border-blue-300 hover:scale-[1.02]">
              <h4 className="font-medium text-blue-900 mb-2">📱 วิธีการชำระเงิน:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. กด "สร้าง QR Code" ในระบบ PromptPay</li>
                <li>2. สแกน QR Code ด้วยแอปธนาคาร</li>
                <li>3. โอนเงินตามจำนวนที่แสดง</li>
                <li>4. กรอกเลขอ้างอิงจากธนาคาร</li>
                <li>5. กดยืนยันเพื่อเสร็จสิ้น</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 transition-all duration-300 hover:bg-yellow-100 hover:border-yellow-300 hover:scale-[1.02]">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ ข้อควรระวัง:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• QR Code หมดอายุใน 30 นาที</li>
                <li>• ตรวจสอบจำนวนเงินให้ถูกต้อง</li>
                <li>• เก็บเลขอ้างอิงจากธนาคารไว้</li>
                <li>• หากมีปัญหา ติดต่อผู้ดูแลระบบ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
