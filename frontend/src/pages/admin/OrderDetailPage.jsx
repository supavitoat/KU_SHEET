import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../services/api';
import { getProfilePictureURL } from '../../utils/adminUtils';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrderById(id);
      
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && typeof isAdmin === 'function' && isAdmin() && id) {
      fetchOrderDetail();
    }
  }, [authLoading, id, isAdmin, fetchOrderDetail]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await adminAPI.updateOrderStatus(id, newStatus);
      
      if (response.data.success) {
        toast.success('อัปเดตสถานะคำสั่งซื้อสำเร็จ');
        fetchOrderDetail(); // รีเฟรชข้อมูล
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'VERIFIED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      'PENDING': 'รอตรวจสอบ',
      'VERIFIED': 'ยืนยันแล้ว',
      'REJECTED': 'ถูกปฏิเสธ',
      'CANCELLED': 'ยกเลิกแล้ว'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'PENDING':
        return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-gray-600" />;
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-gray-600 mb-4">ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปยังรายการคำสั่งซื้อ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบการชำระเงิน #{order.id}</h1>
                <p className="text-gray-600">ข้อมูลและสถานะของการชำระเงิน</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลคำสั่งซื้อ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลขคำสั่งซื้อ</label>
                  <p className="text-lg font-semibold text-gray-900">#{order.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(order.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สร้าง</label>
                  <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                {order.verifiedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ยืนยัน</label>
                    <p className="text-gray-900">{formatDate(order.verifiedDate)}</p>
                  </div>
                )}
                {order.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการชำระเงิน</label>
                    <p className="text-gray-900">{order.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sheet Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลชีท</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อชีท</label>
                  <p className="text-lg font-semibold text-gray-900">{order.sheet?.title || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสวิชา</label>
                  <p className="text-gray-900">{order.sheet?.subjectCode || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(order.sheet?.price || 0)}</p>
                </div>
                {order.sheet?.shortDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                    <p className="text-gray-900">{order.sheet.shortDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sheet Owner Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลเจ้าของชีท</h2>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {order.sheet?.seller?.user?.picture ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={getProfilePictureURL(order.sheet.seller.user.picture)}
                      alt={order.sheet.seller.user.fullName}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{order.sheet?.seller?.penName || 'ไม่ระบุ'}</h3>
                  <p className="text-gray-600">{order.sheet?.seller?.user?.fullName || 'ไม่ระบุ'}</p>
                  <p className="text-sm text-gray-500">{order.sheet?.seller?.user?.email || 'ไม่ระบุ'}</p>
                  <p className="text-sm text-gray-500">ID: {order.sheet?.seller?.id || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>

            {/* User Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลผู้ซื้อ</h2>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {order.user?.picture ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={order.user.picture}
                      alt={order.user.fullName}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{order.user?.fullName || 'ไม่ระบุ'}</h3>
                  <p className="text-gray-600">{order.user?.email || 'ไม่ระบุ'}</p>
                  <p className="text-sm text-gray-500">ID: {order.user?.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">การดำเนินการ</h3>
              
              {order.status === 'PENDING' && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange('VERIFIED')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="w-5 h-5" />
                    ยืนยันคำสั่งซื้อ
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('REJECTED')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    ปฏิเสธคำสั่งซื้อ
                  </button>
                </div>
              )}

              {order.status === 'VERIFIED' && (
                <div className="text-center py-4">
                  <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">คำสั่งซื้อได้รับการยืนยันแล้ว</p>
                </div>
              )}

              {order.status === 'REJECTED' && (
                <div className="text-center py-4">
                  <XCircleIcon className="w-12 h-12 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">คำสั่งซื้อถูกปฏิเสธ</p>
                </div>
              )}

              {order.status === 'CANCELLED' && (
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">คำสั่งซื้อถูกยกเลิก</p>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">ชีท ID: {order.sheetId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">ผู้ซื้อ ID: {order.userId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">อัปเดตล่าสุด: {formatDate(order.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
