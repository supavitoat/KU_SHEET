import React, { useState, useEffect } from 'react';
import api, { sellerAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SlipViewModal from '../../components/common/SlipViewModal';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RevenueHistoryPage = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchRevenueData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getSellerRevenue({
        page: currentPage,
        limit: itemsPerPage
      });
      
      if (response.data.success) {
        setRevenueData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรายได้ได้');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const response = await api.get('/seller/notifications');
      if (response.data?.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Run effects after callbacks declared
  useEffect(() => {
    fetchRevenueData();
    fetchNotifications();
  }, [fetchRevenueData, fetchNotifications]);

  // ตรวจสอบการแจ้งเตือนใหม่ทุก 30 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
    setIsSlipModalOpen(true);
  };

  const handleCloseSlipModal = () => {
    setIsSlipModalOpen(false);
    setSelectedSlip(null);
  };

  const handleConfirmSlip = async (slip) => {
    try {
      const response = await api.put(`/seller/payout-slips/${slip.id}/confirm`);

      if (response.status === 200) {
        // อัพเดทสถานะในหน้า UI
        setRevenueData(prevData => ({
          ...prevData,
          payoutSlips: prevData.payoutSlips.map(s => 
            s.id === slip.id 
              ? { ...s, status: 'CONFIRMED' }
              : s
          )
        }));

        toast.success('ยืนยันสลิปเรียบร้อยแล้ว');
      } else {
        throw new Error('Failed to confirm slip');
      }
    } catch (error) {
      console.error('Error confirming slip:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยันสลิป');
    }
  };

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        @keyframes gradientFlow {
          0% {
            background: linear-gradient(90deg, #a78bfa, #60a5fa, #818cf8, #a78bfa);
            background-size: 200% 200%;
          }
          50% {
            background: linear-gradient(90deg, #60a5fa, #818cf8, #a78bfa, #60a5fa);
            background-size: 200% 200%;
          }
          100% {
            background: linear-gradient(90deg, #a78bfa, #60a5fa, #818cf8, #a78bfa);
            background-size: 200% 200%;
          }
        }
        
        .animate-gradient-flow {
          background: linear-gradient(90deg, #a78bfa, #60a5fa, #818cf8, #a78bfa);
          background-size: 200% 200%;
          animation: gradientFlow 2.5s linear infinite;
        }
      `}</style>
      
      
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
              ประวัติรายได้
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed animate-fadeInUp mb-2" style={{ animationDelay: '0.1s' }}>
              ดูประวัติการขายชีทและรายได้ของคุณ
            </p>
            <p className="text-orange-600 text-sm max-w-2xl mx-auto leading-relaxed animate-fadeInUp mb-4 font-medium" style={{ animationDelay: '0.12s' }}>
              *รายได้ของคุณจะมีการหักค่าคอมมิชชั่น 15%*
            </p>
            <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:w-32 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 transform hover:-translate-y-1 animate-fadeInUp" style={{ animationDelay: '0.15s' }}></div>
          </div>

                    {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mr-4">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">รายได้สุทธิ</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(revenueData?.total_revenue || 0)}</p>
                  <p className="text-xs text-green-600">รายได้ที่ได้รับ</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center mr-4">
                  <CurrencyDollarIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">รายได้รวม</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(revenueData?.gross_revenue || 0)}</p>
                  <p className="text-xs text-gray-600">ยอดขายรวม</p>
                </div>
              </div>
            </div>



            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">จำนวนการขาย</p>
                  <p className="text-2xl font-bold text-blue-800">{revenueData?.pagination?.total_items || 0}</p>
                  <p className="text-xs text-blue-600">ชีทที่ขายได้</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ประวัติการขาย</h2>
          </div>

          {/* Payout Slips Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">สลิปการโอนเงิน</h3>
                <p className="text-sm text-blue-700 mt-1">ประวัติการโอนเงินจาก admin</p>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <BellIcon className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && notifications.length > 0 && (
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        มีสลิปการโอนเงินใหม่!
                      </p>
                      <p className="text-xs text-gray-600">
                        จำนวนเงิน: {formatCurrency(notification.netAmount)} - วันที่: {formatDate(notification.slipUploadDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSlip(notification);
                        setIsSlipModalOpen(true);
                        setShowNotifications(false);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      ดูสลิป
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {revenueData?.payouts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่โอนเงิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สลิป
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(payout.slipUploadDate || payout.confirmedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(payout.netAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payout.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payout.status === 'COMPLETED' ? 'โอนเงินแล้ว' : 'รอการโอน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payout.slipImagePath ? (
                          <button
                            onClick={() => handleViewSlip(payout)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-all"
                          >
                            <EyeIcon className="w-4 h-4" />
                            ดูสลิป
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">ยังไม่มีสลิป</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ยังไม่มีสลิปการโอนเงิน</p>
              <p className="text-gray-400 text-sm">เมื่อ admin อัพโหลดสลิปการโอนเงิน จะปรากฏที่นี่</p>
            </div>
          )}

          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">รายการขายชีท</h3>
          </div>

          {revenueData?.transactions?.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ยังไม่มีประวัติการขาย</p>
              <p className="text-gray-400">เมื่อมีการขายชีท รายการจะปรากฏที่นี่</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชีท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ซื้อ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ยอดขาย
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รายได้สุทธิ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData?.transactions?.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.sheet?.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.sheet?.subjectCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.user?.fullName || transaction.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {formatDate(transaction.verifiedDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.grossAmount || transaction.amount)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(transaction.netAmount || transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {revenueData?.pagination?.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง{' '}
                      {Math.min(currentPage * itemsPerPage, revenueData.pagination.total_items)} จาก{' '}
                      {revenueData.pagination.total_items} รายการ
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                      
                      <span className="px-3 py-2 text-sm font-medium text-gray-700">
                        หน้า {currentPage} จาก {revenueData.pagination.total_pages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === revenueData.pagination.total_pages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Slip View Modal */}
      <SlipViewModal
        isOpen={isSlipModalOpen}
        onClose={handleCloseSlipModal}
        slipData={selectedSlip}
        onConfirm={handleConfirmSlip}
      />
    </div>
  );
};

export default RevenueHistoryPage;