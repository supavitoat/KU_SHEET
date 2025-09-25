import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sellerAPI } from '../../services/api';
import SellerProductCard from '../../components/common/SellerProductCard';
import {
  DocumentTextIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// removed unused random gradient/icon helpers

const ManageSheetsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [filteredSheets, setFilteredSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load once on mount; don't put fetchSheets in deps to avoid TDZ
  useEffect(() => {
    fetchSheets(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSheets(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Define filterAndSortSheets before using in effect to satisfy linter without TDZ
  const filterAndSortSheets = useCallback(() => {
    let filtered = [...sheets];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sheet => {
        const code = (sheet.subjectCode || sheet.subject?.code || '').toLowerCase();
        const title = (sheet.title || '').toLowerCase();
        const subjectThai = (sheet.subjectName?.thai || '').toLowerCase();
        const subjectEng = (sheet.subjectName?.english || '').toLowerCase();
        return (
          code.includes(searchTerm.toLowerCase()) ||
          title.includes(searchTerm.toLowerCase()) ||
          subjectThai.includes(searchTerm.toLowerCase()) ||
          subjectEng.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sheet => sheet.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return (b.orders?.length || 0) - (a.orders?.length || 0);
        case 'revenue':
          return ((b.price || 0) * (b.orders?.length || 0)) - ((a.price || 0) * (a.orders?.length || 0));
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredSheets(filtered);
  }, [sheets, searchTerm, statusFilter, sortBy]);

  // Recompute when inputs change; include callback in deps
  useEffect(() => {
    filterAndSortSheets();
  }, [filterAndSortSheets]);

  const fetchSheets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const response = await sellerAPI.getSellerSheets();
      setSheets(response.data.data || []);
      if (isRefresh) {
        toast.success('🔄 อัปเดตข้อมูลสำเร็จ');
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
      toast.error('😔 ไม่สามารถโหลดรายการชีทได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // (moved filterAndSortSheets above)

  const handleDeleteSheet = async (sheetId) => {
    const result = await Swal.fire({
      title: 'ลบชีทนี้?',
      text: 'คุณแน่ใจหรือไม่ว่าต้องการลบชีทนี้ (ไม่สามารถกู้คืนได้)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#a0aec0',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        actions: 'swal2-actions-stretch',
      },
    });

    if (result.isConfirmed) {
      try {
        await sellerAPI.deleteSheet(sheetId);
        Swal.fire('ลบสำเร็จ!', 'ชีทถูกลบเรียบร้อยแล้ว', 'success');
        fetchSheets(false);
  } catch {
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบชีทได้', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            รออนุมัติ
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            ผ่าน
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            ถูกปฏิเสธ
          </span>
        );
      default:
        return null;
    }
  };

  const getTotalRevenue = () => {
    return sheets
      .filter(sheet => sheet.status === 'APPROVED')
      .reduce((total, sheet) => total + ((sheet.price || 0) * (sheet.orders?.length || 0)), 0);
  };

  const getTotalDownloads = () => {
    return sheets
      .filter(sheet => sheet.status === 'APPROVED')
      .reduce((total, sheet) => total + (sheet.orders?.length || 0), 0);
  };

  // Helper functions for SellerProductCard
  // removed unused formatCurrency

  const getFacultyColors = (facultyName) => {
    if (!facultyName) {
      return {
        gradient: 'from-purple-100 to-blue-100',
        iconColor: 'text-purple-600'
      };
    }

    // ใช้ includes เพื่อจับคำสำคัญในชื่อคณะ
    const name = facultyName.toLowerCase();
    
    if (name.includes('เกษตร')) {
      return {
        gradient: 'from-[#FEE800] via-[#FFE066] to-[#FED700]',
        iconColor: 'text-yellow-800'
      };
    }
    
    if (name.includes('วิศวกรรม')) {
      return {
        gradient: 'from-[#71242A] via-[#8B2F36] to-[#A53B43]',
        iconColor: 'text-red-100'
      };
    }
    
    if (name.includes('กีฬา') || name.includes('วิทยาศาสตร์การกีฬา')) {
      return {
        gradient: 'from-[#FEB81B] via-[#FFC64D] to-[#FFD080]',
        iconColor: 'text-orange-800'
      };
    }
    
    if (name.includes('ศิลปะศาสตร์') || name.includes('ศิลปศาสตร์')) {
      return {
        gradient: 'from-[#D6D5D0] via-[#E0DFD9] to-[#EAE9E2]',
        iconColor: 'text-gray-700'
      };
    }
    
    if (name.includes('ศึกษาศาสตร์') || name.includes('พัฒนศาสตร์')) {
      return {
        gradient: 'from-[#991D97] via-[#B833B5] to-[#D74AD3]',
        iconColor: 'text-purple-100'
      };
    }
    
    if (name.includes('อุตสาหกรรม') || name.includes('บริการ')) {
      return {
        gradient: 'from-[#008081] via-[#00A3A4] to-[#33B5B6]',
        iconColor: 'text-teal-100'
      };
    }
    
    if (name.includes('สัตวแพทย')) {
      return {
        gradient: 'from-[#0EA5E9] via-[#38BDF8] to-[#7DD3FC]',
        iconColor: 'text-blue-800'
      };
    }
    
    // Default fallback
    return {
      gradient: 'from-purple-100 to-blue-100',
      iconColor: 'text-purple-600'
    };
  };

  // removed unused formatDate

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // เพิ่ม CSS global ให้ปุ่ม SweetAlert2 เท่ากัน
  if (typeof window !== 'undefined' && !window.__swal2_btn_css) {
    const style = document.createElement('style');
    style.innerHTML = `
      .swal2-actions button {
        min-width: 120px !important;
        width: 120px !important;
        margin: 0 8px !important;
        border-radius: 0.75rem !important; /* เพิ่มความมน */
      }
    `;
    document.head.appendChild(style);
    window.__swal2_btn_css = true;
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
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
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient-flow {
          background: linear-gradient(90deg, #a78bfa, #60a5fa, #818cf8, #a78bfa);
          background-size: 200% 200%;
          animation: gradientFlow 2.5s linear infinite;
        }
      `}</style>
      
      
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
            จัดการชีท
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed animate-fadeInUp mb-4" style={{ animationDelay: '0.1s' }}>
            จัดการชีทสรุปของคุณ ดูสถิติ และแก้ไขข้อมูล
          </p>
          <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:w-32 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 transform hover:-translate-y-1 animate-fadeInUp" style={{ animationDelay: '0.15s' }}></div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">ชีททั้งหมด</p>
                <p className="text-2xl font-bold text-blue-800">{sheets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mr-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">เผยแพร่แล้ว</p>
                <p className="text-2xl font-bold text-green-800">
                  {sheets.filter(s => s.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">ดาวน์โหลดรวม</p>
                <p className="text-2xl font-bold text-purple-800">{getTotalDownloads()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mr-4">
                <DocumentTextIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">รายได้รวม</p>
                <p className="text-2xl font-bold text-orange-800">฿{getTotalRevenue().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-8 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชีท..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-md hover:border-purple-400 hover:bg-[rgba(168,85,247,0.03)]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-md hover:border-purple-400 hover:bg-[rgba(168,85,247,0.03)]"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="PENDING">รออนุมัติ</option>
                  <option value="APPROVED">ผ่าน</option>
                  <option value="REJECTED">ถูกปฏิเสธ</option>
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-md hover:border-purple-400 hover:bg-[rgba(168,85,247,0.03)]"
                >
                  <option value="createdAt">วันที่ล่าสุด</option>
                  <option value="downloads">ดาวน์โหลดสูงสุด</option>
                  <option value="revenue">รายได้สูงสุด</option>
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>

                         {/* Refresh Button */}
             <button
               onClick={() => fetchSheets(true)}
               disabled={isRefreshing}
               className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
               {isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}
             </button>

             {/* Create New Sheet Button */}
             <button
               onClick={() => navigate('/seller/editSheet')}
               className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold flex items-center gap-2"
             >
               <PlusIcon className="w-5 h-5" />
               สร้างชีทใหม่
             </button>
          </div>
        </div>

        {/* Sheets List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">รายการชีททั้งหมด</h3>
            <div className="w-16 h-1 mx-auto rounded-full hover:w-24 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>

          {filteredSheets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-3">
                {searchTerm || statusFilter !== 'all' ? 'ไม่พบชีทที่ค้นหา' : 'ยังไม่มีชีท'}
              </h4>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' 
                  : 'เริ่มต้นสร้างชีทแรกของคุณและแบ่งปันความรู้กับชุมชนนักศึกษา'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => navigate('/seller/editSheet')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  สร้างชีทใหม่
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSheets.map((sheet, idx) => (
                <div
                  key={sheet.id}
                  className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300 animate-fadeInUp`}
                  style={{ animationDelay: `${0.8 + idx * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Sheet Icon (Left) - Make it clickable */}
                    <Link to={`/infoSheet/${sheet.id}`} className="block">
                      <div className={`w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br ${getFacultyColors(sheet.faculty?.name || sheet.faculty).gradient} relative cursor-pointer hover:shadow-lg transition-all duration-300`}>
                        <DocumentTextIcon className={`w-16 h-16 ${getFacultyColors(sheet.faculty?.name || sheet.faculty).iconColor} mb-3`} />
                        {(sheet.subjectCode || sheet.subject?.code) && (
                          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-base font-bold tracking-wide text-white drop-shadow-lg">
                            {sheet.subjectCode || sheet.subject?.code}
                          </span>
                        )}
                      </div>
                    </Link>
                    {/* Sheet Info (Right) */}
                    <div className="flex-1 flex flex-col gap-1">
                      {/* Line 1: Title / Status */}
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-800 line-clamp-1">{sheet.title}</span>
                        {getStatusBadge(sheet.status)}
                      </div>
                      {/* Line 2: Subject Name (Thai) Subject Code */}
                      <div className="text-gray-600 text-sm line-clamp-1">
                        {(sheet.subjectName?.thai || sheet.subjectName?.display || '-')}
                        {sheet.subjectCode ? ` ${sheet.subjectCode}` : sheet.subject?.code ? ` ${sheet.subject.code}` : ''}
                      </div>
                      {/* Line 3: Description */}
                      <div className="text-gray-500 text-sm line-clamp-2">
                        {sheet.shortDescription || '-'}
                      </div>
                      {/* Line 4: Downloads / Date */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>ดาวน์โหลด: {sheet.orders?.length || 0}</span>
                        <span>วันที่: {new Date(sheet.createdAt).toLocaleDateString('th-TH')}</span>
                      </div>
                      {/* Admin message if rejected */}
                      {sheet.adminMessage && sheet.status === 'REJECTED' && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">ข้อความจากแอดมิน:</p>
                              <p className="text-sm text-red-700">{sheet.adminMessage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                      {(sheet.status === 'PENDING' || sheet.status === 'REJECTED') && (
                        <button
                          onClick={() => navigate(`/seller/editSheet/${sheet.id}`)}
                          className="w-20 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                          แก้ไข
                        </button>
                      )}
                      <Link
                        to={`/infoSheet/${sheet.id}`}
                        className="w-20 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        ดู
                      </Link>
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="w-20 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSheetsPage; 