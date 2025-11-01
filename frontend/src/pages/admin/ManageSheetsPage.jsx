import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  TrashIcon,
  DocumentIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { adminAPI, getProfilePictureURL, getBaseURL } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const ManageSheetsPage = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const Portal = ({ children }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        ...filters
      };
      
      const response = await adminAPI.getSheets(params);
      if (response.data.success) {
        setSheets(response.data.data.sheets);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
      toast.error('ไม่สามารถโหลดข้อมูลชีทได้');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  const handleFilterChange = (key, value) => {
    if (key === 'sortBy') {
      // แยก sortBy และ order จาก value
      const [sortBy, order] = value.split('-');
      setFilters(prev => ({ ...prev, sortBy, order }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSheets();
  };

  // view handled via new tab open; in-app modal code path removed

  const handleAction = (sheet, type) => {
    setSelectedSheet(sheet);
    setActionType(type);
    setActionMessage('');
    setShowActionModal(true);
  };

  const executeAction = async () => {
    if (!selectedSheet) {
      toast.error('ไม่พบข้อมูลชีท');
      return;
    }

    // ตรวจสอบข้อความเฉพาะเมื่อปฏิเสธ
    if (actionType === 'reject' && !actionMessage.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      let response;
      if (actionType === 'approve') {
        response = await adminAPI.approveSheet(selectedSheet.id);
      } else if (actionType === 'reject') {
        response = await adminAPI.rejectSheet(selectedSheet.id, actionMessage);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowActionModal(false);
        fetchSheets();
      }
    } catch (error) {
      console.error('❌ Error executing action:', error);
      console.error('❌ Error details:', error.response?.data);
      toast.error('ไม่สามารถดำเนินการได้');
    }
  };

  const handleDeleteSheet = async () => {
    if (!selectedSheet) return;

    try {
      await adminAPI.deleteSheet(selectedSheet.id);
      toast.success('ลบชีทสำเร็จ');
      setShowActionModal(false);
      fetchSheets();
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast.error('ไม่สามารถลบชีทได้');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'PENDING': 'รออนุมัติ',
      'APPROVED': 'อนุมัติแล้ว',
      'REJECTED': 'ถูกปฏิเสธ'
    };
    
    return (
      <span className={`px-1 py-0.5 rounded-full text-xs font-medium leading-tight whitespace-nowrap overflow-hidden ${styles[status] || 'bg-gray-100 text-gray-800'}`} style={{ fontSize: '10px' }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && sheets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sheet Count */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <DocumentIcon className="w-5 h-5" />
          <span>ทั้งหมด {pagination?.totalCount || 0} ชีท</span>
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
                placeholder="ค้นหาชื่อชีท, รหัสวิชา..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="PENDING">รออนุมัติ</option>
                  <option value="APPROVED">อนุมัติแล้ว</option>
                  <option value="REJECTED">ถูกปฏิเสธ</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">วันที่อัพโหลดใหม่สุด</option>
                  <option value="createdAt-asc">วันที่อัพโหลดเก่าสุด</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheets Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">ชีท</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900">ผู้ขาย</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900">สถานะ</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900">วันที่อัพโหลด</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sheets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">ไม่พบชีท</p>
                    <p className="text-sm">ไม่มีชีทที่ตรงกับเงื่อนไขการค้นหา</p>
                  </td>
                </tr>
              ) : (
                sheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DocumentIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate max-w-[250px]" title={sheet.title}>
                            {sheet.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[250px]" title={`${sheet.subjectCode} - ${JSON.parse(sheet.subjectNameJSON).th || 'N/A'}`}>
                            {sheet.subjectCode} - {JSON.parse(sheet.subjectNameJSON).th || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{sheet.term}/{sheet.year} - ฿{sheet.price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {sheet.seller?.user?.picture ? (
                          <img
                            src={getProfilePictureURL(sheet.seller.user.picture)}
                            alt={sheet.seller.user.fullName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 ${
                            sheet.seller?.user?.picture ? 'hidden' : 'flex'
                          }`}
                        >
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={sheet.seller?.user?.fullName || 'N/A'}>
                            {sheet.seller?.user?.fullName || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]" title={sheet.seller?.user?.email || 'N/A'}>
                            {sheet.seller?.user?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {getStatusBadge(sheet.status)}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {new Date(sheet.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`/admin/infoSheet/${sheet.id}`, '_blank')}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        {sheet.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(sheet, 'approve')}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="อนุมัติ"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(sheet, 'reject')}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="ปฏิเสธ"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        

                        
                        <button
                          onClick={() => handleAction(sheet, 'delete')}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="ลบ"
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  แสดง <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> ถึง{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  จาก <span className="font-medium">{pagination.totalCount}</span> รายการ
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Detail Modal */}
      {showDetailModal && selectedSheet && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">รายละเอียดชีท</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedSheet.title}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedSheet.subjectCode} - {JSON.parse(selectedSheet.subjectNameJSON).th || 'N/A'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <p className="mt-1">{getStatusBadge(selectedSheet.status)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ภาคการศึกษา</label>
                    <p className="mt-1">{selectedSheet.term}/{selectedSheet.year}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ราคา</label>
                    <p className="mt-1">฿{selectedSheet.price}</p>
                  </div>
                </div>
                
                {selectedSheet.adminMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ข้อความจากผู้ดูแล</label>
                    <p className="mt-1 text-sm text-gray-600">{selectedSheet.adminMessage}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">คำอธิบาย</label>
                  <p className="mt-1 text-sm text-gray-600">{selectedSheet.shortDescription}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Action Modal */}
      {showActionModal && selectedSheet && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === 'approve' && 'อนุมัติชีท'}
                  {actionType === 'reject' && 'ปฏิเสธชีท'}
                  {actionType === 'delete' && 'ลบชีท'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {actionType === 'approve' && `คุณแน่ใจหรือไม่ว่าต้องการอนุมัติชีท "${selectedSheet.title}"?`}
                  {actionType === 'reject' && `คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธชีท "${selectedSheet.title}"?`}
                  {actionType === 'delete' && `คุณแน่ใจหรือไม่ว่าต้องการลบชีท "${selectedSheet.title}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
                </p>
                
                {actionType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลในการปฏิเสธ *
                    </label>
                    <textarea
                      value={actionMessage}
                      onChange={(e) => setActionMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="ระบุเหตุผล..."
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={actionType === 'delete' ? handleDeleteSheet : executeAction}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    actionType === 'delete'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' && 'อนุมัติ'}
                  {actionType === 'reject' && 'ปฏิเสธ'}
                  {actionType === 'delete' && 'ลบชีท'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
};

export default ManageSheetsPage;
