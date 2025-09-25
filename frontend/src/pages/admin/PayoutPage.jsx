import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  BanknotesIcon, 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
// ใช้ฟังก์ชัน utility จากไฟล์กลาง
import { 
  formatCurrency, 
  formatDate, 
  formatShortDate, 
  formatShortDateTime,
  getStatusColor,
  getStatusIcon 
} from '../../utils/adminUtils';
import QRCodeModal from '../../components/common/QRCodeModal';
import SlipUploadModal from '../../components/common/SlipUploadModal';
import { adminAPI } from '../../services/api';

const PayoutPage = () => {
  const { payoutId } = useParams();
  const navigate = useNavigate();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ดึงข้อมูลจริงจาก API
  const fetchWeeklyHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const { data } = await adminAPI.getSellerWeeklyPayoutHistory(payoutId);
      console.log('📊 Weekly history data received:', data);
      if (data.success) {
        setWeeklyHistory(data.data.weeklyHistory || []);
      } else {
        throw new Error(data.message || 'Failed to load weekly history');
      }
    } catch (error) {
      console.error('❌ Error fetching weekly history:', error);
      setWeeklyHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [payoutId]);

  useEffect(() => {
    const fetchPayoutData = async () => {
      try {
        setLoading(true);
        
        // ดึง token จาก localStorage
  const { data } = await adminAPI.getPayoutDetailsBySeller(payoutId);
  console.log('📊 Payout data received:', data);
  console.log('📊 Payout sellerId param:', payoutId);
        
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        // แปลงข้อมูลให้ตรงกับ format ที่ component ต้องการ
        const formattedPayout = {
          id: data.id,
          sellerName: data.sellerName,
          email: data.email,
          bankName: data.bankName || 'ไม่ระบุ',
          bankAccount: data.bankAccount || 'ไม่ระบุ',
          accountName: data.accountName || 'ไม่ระบุ',
          promptPayId: data.promptPayId || 'ไม่ระบุ',
          amount: data.amount || 0,
          netAmount: data.netAmount || 0,
          commission: data.commission || 0,
          orders: data.orders || 0,
          lastPayout: data.lastPayout,
          status: data.status || 'PENDING',
          orderDetails: data.orderDetails || [],
          weeklyPeriod: data.weeklyPeriod,
          slipImagePath: data.slipImagePath || null
        };
        
        setPayout(formattedPayout);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payout data:', error);
        
  // แสดงข้อมูล error แทนข้อมูล mock
        setPayout({
          id: payoutId || '1',
          sellerName: 'ไม่พบข้อมูล',
          email: 'ไม่พบข้อมูล',
          bankName: 'ไม่พบข้อมูล',
          bankAccount: 'ไม่พบข้อมูล',
          accountName: 'ไม่พบข้อมูล',
          promptPayId: 'ไม่พบข้อมูล',
          amount: 0,
          netAmount: 0,
          commission: 0,
          orders: 0,
          lastPayout: null,
          status: 'PENDING',
          orderDetails: [],
          error: error.message
        });
        setLoading(false);
      }
    };

    if (payoutId) {
      fetchPayoutData();
      fetchWeeklyHistory();
    }
  }, [payoutId, fetchWeeklyHistory]);

  const openQRModal = (payoutData) => {
    setSelectedPayout(payoutData);
    setQrModalOpen(true);
  };

  const closeQRModal = () => {
    setQrModalOpen(false);
    setSelectedPayout(null);
  };

  const openSlipUploadModal = () => {
    setSlipModalOpen(true);
  };

  const closeSlipUploadModal = () => {
    setSlipModalOpen(false);
  };

  const handleConfirmTransfer = async (payoutData) => {
    try {
      await adminAPI.confirmSellerPayoutTransfer(payoutData.id, {
        status: 'COMPLETED',
        confirmedAt: new Date().toISOString()
      });

      {
        // อัพเดทสถานะในหน้า
        setPayout(prev => ({
          ...prev,
          status: 'COMPLETED',
          lastPayout: new Date().toISOString()
        }));
        
        toast.success('ยืนยันการโอนเงินสำเร็จ!');
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยันการโอนเงิน');
    }
  };

  const handleBack = () => {
    navigate('/admin/finance');
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลการโอนเงินได้</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            กลับไปหน้าก่อนหน้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 mr-3"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">รายละเอียดการโอนเงิน</h1>
                <p className="text-sm text-gray-500">จัดการการโอนเงินให้เจ้าของชีท</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payout.status || 'PENDING')}`}>
                {getStatusIcon(payout.status || 'PENDING')}
                <span className="ml-2">
                  {payout.status === 'PENDING' ? 'รอโอนเงิน' : 
                   payout.status === 'COMPLETED' ? 'โอนเงินสำเร็จ' : 
                   payout.status === 'FAILED' ? 'โอนเงินล้มเหลว' : 'ไม่ทราบสถานะ'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Actions - แสดงในหน้าจอเล็ก */}
        <div className="lg:hidden mt-8">
          <div className="space-y-6">
            {/* Payment Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <QrCodeIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">ดำเนินการโอนเงิน</h2>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => openQRModal(payout)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                >
                  <QrCodeIcon className="w-5 h-5 mr-2" />
                  สร้าง QR Code สำหรับโอนเงิน
                </button>
                
                <button
                  onClick={() => openSlipUploadModal()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                >
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  อัพโหลดสลิปการโอนเงิน
                </button>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะการโอนเงิน</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">สถานะปัจจุบัน</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status || 'PENDING')}`}>
                    {getStatusIcon(payout.status || 'PENDING')}
                    <span className="ml-1">
                      {payout.status === 'PENDING' ? 'รอโอนเงิน' : 
                       payout.status === 'COMPLETED' ? 'โอนเงินสำเร็จ' : 
                       payout.status === 'FAILED' ? 'โอนเงินล้มเหลว' : 'ไม่ทราบสถานะ'}
                    </span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">การโอนล่าสุด</span>
                  <span className="text-sm font-medium text-gray-900">
                    {payout.lastPayout ? formatDate(payout.lastPayout) : 'ยังไม่มีการโอนเงินล่าสุด'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Left Column - Payout Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payout Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">สรุปการโอนเงิน</h2>
                <BanknotesIcon className="w-6 h-6 text-purple-600" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(payout.amount || 0)}
                  </div>
                  <div className="text-sm text-gray-600">ยอดรวมทั้งหมด</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(payout.netAmount || 0)}
                  </div>
                  <div className="text-sm text-gray-600">จำนวนเงินสุทธิ</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(payout.commission || 0)}
                  </div>
                  <div className="text-sm text-gray-600">ค่าคอมมิชชัน</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">จำนวนคำสั่งซื้อ:</span>
                  <span className="font-semibold text-gray-900">{payout.orders || 0} คำสั่งซื้อ</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">การโอนล่าสุด:</span>
                  <span className="font-semibold text-gray-900">
                    {payout.lastPayout ? formatDate(payout.lastPayout) : 'ยังไม่มีการโอนเงินล่าสุด'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {payout.error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center">
                  <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
                    <p className="text-red-700 mt-1">{payout.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <UserIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">ข้อมูลเจ้าของชีท</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">ชื่อเจ้าของชีท</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.sellerName || 'ไม่ระบุ'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">อีเมล</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.email || 'ไม่ระบุ'}</div>
                </div>
              </div>
            </div>

            {/* Bank Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <BuildingOfficeIcon className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">ข้อมูลธนาคาร</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">ธนาคาร</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.bankName || 'ไม่ระบุ'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">เลขบัญชี</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.bankAccount || 'ไม่ระบุ'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">ชื่อบัญชี</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.accountName || 'ไม่ระบุ'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">PromptPay ID</div>
                  <div className="text-lg font-semibold text-gray-900">{payout.promptPayId || 'ไม่ระบุ'}</div>
                </div>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                               <div className="flex items-center justify-between mb-6">
                   <div>
                     <h2 className="text-lg font-semibold text-gray-900">รายละเอียดคำสั่งซื้อ</h2>
                     <p className="text-sm text-gray-500 mt-1">
                       ตัดยอดรายสัปดาห์: {payout.weeklyPeriod && payout.weeklyPeriod.start && payout.weeklyPeriod.end ? 
                         `${new Date(payout.weeklyPeriod.start).toLocaleDateString('th-TH')} 09:00 - ${new Date(payout.weeklyPeriod.end).toLocaleDateString('th-TH')} 08:59` : 
                         'จันทร์ 09:00 - จันทร์ 08:59'
                       }
                     </p>
                   </div>
                   <CreditCardIcon className="w-6 h-6 text-indigo-600" />
                 </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{payout.orderDetails?.length || 0}</div>
                  <div className="text-xs text-gray-600">จำนวนชีททั้งหมด</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{payout.orderDetails?.filter(order => order.isFree).length || 0}</div>
                  <div className="text-xs text-gray-600">ชีทฟรี</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{payout.orderDetails?.filter(order => !order.isFree).length || 0}</div>
                  <div className="text-xs text-gray-600">ชีทที่ขาย</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(payout.orderDetails?.reduce((sum, order) => sum + order.commission, 0) || 0)}</div>
                  <div className="text-xs text-gray-600">ค่าคอมมิชชันรวม</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(payout.orderDetails?.reduce((sum, order) => sum + order.sellerAmount, 0) || 0)}</div>
                  <div className="text-xs text-gray-600">เจ้าของชีทได้รวม</div>
                </div>
              </div>
              
              {payout.orderDetails && payout.orderDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">ลำดับ</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">ลูกค้า</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs min-w-[200px]">ชีท</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">ราคา</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">ค่าคอมมิชชัน</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">เจ้าของชีทได้</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">วันที่ขาย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payout.orderDetails.map((order, index) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-900 text-center">{index + 1}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-900 truncate max-w-[100px]">{order.customerName}</div>
                          </td>
                                                  <td className="py-2 px-3">
                          <div className="text-xs text-gray-900 max-w-[200px] leading-relaxed">
                            {order.sheetTitle}
                          </div>
                        </td>
                          <td className="py-2 px-3">
                            <div className={`text-xs font-medium text-right ${order.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                              {order.isFree ? 'ฟรี' : formatCurrency(order.amount)}
                            </div>
                          </td>
                          <td className="text-xs text-right px-3">
                            <div className={`text-xs text-right ${order.isFree ? 'text-gray-400' : 'text-blue-600'}`}>
                              {order.isFree ? '-' : formatCurrency(order.commission)}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className={`text-xs font-medium text-right ${order.isFree ? 'text-gray-400' : 'text-green-600'}`}>
                              {order.isFree ? '-' : formatCurrency(order.sellerAmount)}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-500">{formatShortDateTime(order.date)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่มีรายการคำสั่งซื้อ</p>
                  <p className="text-sm text-gray-400 mt-1">ผู้ขายยังไม่มีคำสั่งซื้อที่ชำระเงินแล้ว</p>
                </div>
              )}
              
              {/* Weekly History Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  ประวัติการโอนเงินรายสัปดาห์
                </h3>
                
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">กำลังโหลดประวัติ...</p>
                  </div>
                ) : weeklyHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">สัปดาห์</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">จำนวนคำสั่งซื้อ</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">ยอดรวม</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">ค่าคอมมิชชัน</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">จำนวนเงินสุทธิ</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">วันที่โอน</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">อ้างอิง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyHistory.map((week, index) => (
                          <tr key={week.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{formatShortDate(week.weekStart)} - {formatShortDate(week.weekEnd)}</div>
                                <div className="text-xs text-gray-500">สัปดาห์ที่ {index + 1}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {week.totalOrders} คำสั่ง
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(week.totalAmount)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-blue-600">{formatCurrency(week.commission)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-green-600">{formatCurrency(week.netAmount)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-500">{formatShortDate(week.confirmedAt)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-gray-500 font-mono">{week.reference}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">ไม่มีประวัติการโอนเงินรายสัปดาห์</p>
                    <p className="text-sm text-gray-400 mt-1">ผู้ขายยังไม่เคยมีการโอนเงินรายสัปดาห์</p>
                  </div>
                )}
              </div>

              {/* Weekly Summary Footer */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">หมายเหตุ:</span> ข้อมูลนี้แสดงการขายชีทในช่วงสัปดาห์ที่ผ่านมา
                  </div>
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">อัปเดตล่าสุด:</span> {formatDate(new Date())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6 sticky top-24 self-start z-10 hidden lg:block overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            {/* Payment Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <QrCodeIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">ดำเนินการโอนเงิน</h2>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => openQRModal(payout)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                >
                  <QrCodeIcon className="w-5 h-5 mr-2" />
                  สร้าง QR Code สำหรับโอนเงิน
                </button>
                
                <button
                  onClick={() => openSlipUploadModal()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                >
                  <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                  อัพโหลดสลิปการโอนเงิน
                </button>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะการโอนเงิน</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">สถานะปัจจุบัน</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status || 'PENDING')}`}>
                    {getStatusIcon(payout.status || 'PENDING')}
                    <span className="ml-1">
                      {payout.status === 'PENDING' ? 'รอโอนเงิน' : 
                       payout.status === 'COMPLETED' ? 'โอนเงินสำเร็จ' : 
                       payout.status === 'FAILED' ? 'โอนเงินล้มเหลว' : 'ไม่ทราบสถานะ'}
                    </span>
                  </span>
                </div>
                

                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">การโอนล่าสุด</span>
                  <span className="text-sm font-medium text-gray-900">
                    {payout.lastPayout ? formatDate(payout.lastPayout) : 'ยังไม่มีการโอนเงินล่าสุด'}
                  </span>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={closeQRModal}
        payoutData={selectedPayout}
        onTransferConfirmed={(payoutData) => {
          // ยืนยันการโอนเงิน
          handleConfirmTransfer(payoutData);
        }}
      />

      {/* Slip Upload Modal */}
      <SlipUploadModal
        isOpen={slipModalOpen}
        onClose={closeSlipUploadModal}
        payoutData={payout}
        onSlipUploaded={() => {
          // อัพเดทสถานะการโอนเงิน
          setPayout(prev => ({
            ...prev,
            status: 'COMPLETED',
            lastPayout: new Date().toISOString()
          }));
        }}
      />
    </div>
  );
};

export default PayoutPage;
