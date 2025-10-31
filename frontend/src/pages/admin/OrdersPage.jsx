import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LoadingSpinner, 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  getProfilePictureURL
} from '../../utils/adminUtils';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter
      };

      const response = await adminAPI.getOrders(params);

      if (response?.data?.success) {
        const result = response.data.data;
        setOrders(result.orders || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalOrders(result.pagination?.totalCount || 0);
      } else {
        throw new Error(response?.data?.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');

      // Fallback to empty array if API fails
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleFilterChange = (key, value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await adminAPI.updateOrderStatus(orderId, newStatus);
      if (response?.data?.success) {
        toast.success('อัปเดตสถานะคำสั่งซื้อสำเร็จ');
        // รีเฟรชข้อมูล
        fetchOrders();
      } else {
        throw new Error(response?.data?.message || 'API response error');
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': 'รอตรวจสอบ',
      'VERIFIED': 'ยืนยันแล้ว',
      'REJECTED': 'ถูกปฏิเสธ',
      'CANCELLED': 'ยกเลิกแล้ว'
    };
    
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`inline-flex items-center whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
    );
  };



  return (
    <div className="space-y-6">
      {/* Order Count */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CurrencyDollarIcon className="w-5 h-5" />
          <span>ทั้งหมด {totalOrders} คำสั่งซื้อ</span>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาคำสั่งซื้อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200"
          >
            <FunnelIcon className="w-5 h-5" />
            ตัวกรอง
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="PENDING">รอตรวจสอบ</option>
                  <option value="VERIFIED">ยืนยันแล้ว</option>
                  <option value="REJECTED">ถูกปฏิเสธ</option>
                  <option value="CANCELLED">ยกเลิกแล้ว</option>
                </select>
              </div>
              
              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  ค้นหา
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">ไม่พบคำสั่งซื้อ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-20">คำสั่งซื้อ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-32">ผู้ซื้อ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-32">ชีท</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-24">จำนวนเงิน</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-24">สถานะ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 w-32">วันที่</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-900 w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-6 w-6">
                          {order.user?.picture ? (
                            <img
                              className="h-6 w-6 rounded-full object-cover"
                              src={getProfilePictureURL(order.user.picture)}
                              alt={order.user.fullName}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center ${order.user?.picture ? 'hidden' : 'flex'}`}>
                            <UserIcon className="w-3 h-3 text-gray-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-xs truncate">
                            {order.user?.fullName || 'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {order.user?.email || 'ไม่ระบุ'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-xs truncate">
                          {order.sheet?.title || 'ไม่ระบุ'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {order.sheet?.subjectCode || 'ไม่ระบุ'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(order.amount)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 mr-3">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center justify-center"
                          title="ดูรายละเอียด"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'VERIFIED')}
                              className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors flex items-center justify-center"
                              title="ยืนยัน"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'REJECTED')}
                              className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors flex items-center justify-center"
                              title="ปฏิเสธ"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-700">
              แสดง {((currentPage - 1) * 20) + 1} ถึง{' '}
              {Math.min(currentPage * 20, totalOrders)} จาก{' '}
              {totalOrders} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                หน้า {currentPage} จาก {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
