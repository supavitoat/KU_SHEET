import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminAPI, getProfilePictureURL } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Portal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(filters);
      
      if (response.data.success) {
        // Ensure users array exists and has proper structure
        const usersData = response.data.data.users || [];
        const safeUsers = usersData.map(user => ({
          ...user,
          _count: user._count || { orders: 0, reviews: 0 },
          isBanned: user.isBanned || false
        }));
        
        setUsers(safeUsers);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await adminAPI.getUserById(userId);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดผู้ใช้ได้');
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await adminAPI.unbanUser(userId);
        toast.success('ยกเลิกการแบนผู้ใช้สำเร็จ');
      } else {
        await adminAPI.banUser(userId);
        toast.success('แบนผู้ใช้สำเร็จ');
      }
      fetchUsers();
    } catch (error) {
      console.error('Error banning/unbanning user:', error);
      toast.error('ไม่สามารถดำเนินการได้');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await adminAPI.deleteUser(userToDelete.id);
      toast.success('ลบผู้ใช้สำเร็จ');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const styles = {
      'ADMIN': 'bg-red-100 text-red-800',
      'USER': 'bg-blue-100 text-blue-800',
      'SELLER': 'bg-green-100 text-green-800'
    };
    
    const labels = {
      'ADMIN': 'ผู้ดูแล',
      'USER': 'ผู้ใช้',
      'SELLER': 'ผู้ขาย'
    };

    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (isBanned) => {
    return isBanned ? (
      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
        ถูกแบน
      </span>
    ) : (
      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        ใช้งานได้
      </span>
    );
  };

  // Error boundary for rendering
  if (!Array.isArray(users)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Count */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserGroupIcon className="w-5 h-5" />
          <span>ทั้งหมด {pagination?.totalCount || 0} ผู้ใช้</span>
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
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">ทุกบทบาท</option>
                  <option value="USER">ผู้ใช้</option>
                  <option value="SELLER">ผู้ขาย</option>
                  <option value="ADMIN">ผู้ดูแล</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="active">ใช้งานได้</option>
                  <option value="banned">ถูกแบน</option>
                </select>
              </div>
              
              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
                <select
                  value={`${filters.sortBy}-${filters.order}`}
                  onChange={(e) => {
                    const [sortBy, order] = e.target.value.split('-');
                    setFilters({ ...filters, sortBy, order });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">วันที่สมัครใหม่สุด</option>
                  <option value="createdAt-asc">วันที่สมัครเก่าสุด</option>
                  <option value="fullName-asc">ชื่อ A-Z</option>
                  <option value="fullName-desc">ชื่อ Z-A</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

             {/* Users Table */}
       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full min-w-[800px]">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 w-48">ผู้ใช้</th>
                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 w-20">บทบาท</th>
                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 w-20">สถานะ</th>
                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 w-24">วันที่สมัคร</th>
                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 w-24">กิจกรรม</th>
                 <th className="px-3 py-3 text-right text-xs font-medium text-gray-900 w-24">การดำเนินการ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200">
               {loading ? (
                 <tr>
                   <td colSpan="6" className="px-4 py-8 text-center">
                     <LoadingSpinner />
                   </td>
                 </tr>
               ) : users.length === 0 ? (
                 <tr>
                   <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                     ไม่พบผู้ใช้
                   </td>
                 </tr>
               ) : (
                 users.filter(user => user && user.id).map((user) => (
                   <tr key={user.id} className="hover:bg-gray-50">
                     <td className="px-4 py-3">
                       <div className="flex items-center gap-2">
                         {user.picture ? (
                           <img
                             src={getProfilePictureURL(user.picture)}
                             alt={user.fullName || 'User'}
                             className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                         ) : null}
                         <div 
                           className={`w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 ${
                             user.picture ? 'hidden' : 'flex'
                           }`}
                         >
                           <UserGroupIcon className="w-5 h-5 text-gray-500" />
                         </div>
                         <div className="min-w-0 flex-1">
                           <div className="font-medium text-gray-900 text-sm truncate">{user.fullName || 'ไม่ระบุชื่อ'}</div>
                           <div className="text-xs text-gray-500 truncate">{user.email || 'ไม่ระบุอีเมล'}</div>
                         </div>
                       </div>
                     </td>
                     <td className="px-3 py-3">
                       {getRoleBadge(user.role)}
                     </td>
                     <td className="px-3 py-3">
                       {getStatusBadge(user.isBanned || false)}
                     </td>
                     <td className="px-3 py-3 text-xs text-gray-500">
                       {formatDate(user.createdAt)}
                     </td>
                     <td className="px-3 py-3">
                       <div className="text-xs text-gray-900">{user._count?.orders || 0} คำสั่งซื้อ</div>
                       <div className="text-xs text-gray-500">{user._count?.reviews || 0} รีวิว</div>
                     </td>
                     <td className="px-3 py-3">
                       <div className="flex items-center justify-end gap-1">
                         <button
                           onClick={() => handleViewUser(user.id)}
                           className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                           title="ดูรายละเอียด"
                         >
                           <EyeIcon className="w-4 h-4" />
                         </button>
                         
                         <button
                           onClick={() => handleBanUser(user.id, user.isBanned || false)}
                           className={`p-1.5 rounded transition-colors ${
                             (user.isBanned || false)
                               ? 'text-green-600 hover:bg-green-100' 
                               : 'text-yellow-600 hover:bg-yellow-100'
                           }`}
                           title={(user.isBanned || false) ? 'ยกเลิกการแบน' : 'แบนผู้ใช้'}
                         >
                           {(user.isBanned || false) ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                         </button>
                         
                         <button
                           onClick={() => {
                             setUserToDelete(user);
                             setShowDeleteModal(true);
                           }}
                           className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                           title="ลบผู้ใช้"
                         >
                           <TrashIcon className="w-4 h-4" />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-700">
              แสดง {((pagination.currentPage - 1) * filters.limit) + 1} ถึง{' '}
              {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} จาก{' '}
              {pagination.totalCount} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                หน้า {pagination.currentPage} จาก {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">รายละเอียดผู้ใช้</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  {selectedUser.picture ? (
                    <img
                      src={getProfilePictureURL(selectedUser.picture)}
                      alt={selectedUser.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedUser.fullName || 'ไม่ระบุชื่อ'}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.isBanned)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser._count.orders}</div>
                    <div className="text-sm text-gray-600">คำสั่งซื้อ</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser._count.reviews}</div>
                    <div className="text-sm text-gray-600">รีวิว</div>
                  </div>
                </div>

                {/* Recent Orders */}
                {selectedUser.orders && selectedUser.orders.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">คำสั่งซื้อล่าสุด</h5>
                    <div className="space-y-2">
                      {selectedUser.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{order.sheet?.title}</div>
                            <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">฿{order.amount}</div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              order.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบผู้ใช้</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ <strong>{userToDelete.fullName || userToDelete.email}</strong>? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบผู้ใช้
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
};

export default UserManagement;
