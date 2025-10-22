import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI } from '../../services/api';
import { sheetsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
// getProfilePictureURL not used on this page
import { reviewsAPI } from '../../services/api';

const OrderHistoryPage = () => {
  const { isAuthenticated } = useAuth();
  // Removed unused blobs state
  // เคลียร์ตระกร้าทันทีเมื่อ redirect กลับมาพร้อมพารามิเตอร์ paid=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1' && !hasShownSuccessToast.current) {
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const { id } = JSON.parse(user);
          if (id) {
            // ล้างตระกร้าใน localStorage
            localStorage.removeItem(`cart_${id}`);
            // ล้างตระกร้าใน context
            if (window.clearCartFromContext) {
              window.clearCartFromContext();
            }
            // แจ้งเตือนผู้ใช้ (แค่อันเดียว)
            toast.success('🎉 การชำระเงินสำเร็จ! ดาวน์โหลดชีทเลย');
            hasShownSuccessToast.current = true; // ป้องกันการแจ้งเตือนซ้ำ
            // ลบพารามิเตอร์ทั้งหมดออกจาก URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Refresh ข้อมูลชีทที่ซื้อแล้ว
            fetchData();
          }
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
    
    // ตรวจสอบ session_id จาก Stripe
    const sessionId = params.get('session_id');
    if (sessionId) {
      // ลบ session_id ออกจาก URL
      const newParams = new URLSearchParams(params);
      newParams.delete('session_id');
      const newUrl = newParams.toString() ? `?${newParams.toString()}` : window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  // ลบพื้นหลัง Animated Blobs (no-op here)
  // orders not directly used; using purchasedSheets list
  const [purchasedSheets, setPurchasedSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter] = useState('all'); // using only 'all' for now
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewModal, setReviewModal] = useState({ open: false, sheetId: null, rating: 0, comment: '' });
  
  // ใช้ useRef เพื่อป้องกันการแจ้งเตือนซ้ำ
  const hasShownSuccessToast = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
  const [, purchasedSheetsResponse] = await Promise.all([
        ordersAPI.getUserOrders(),
        ordersAPI.getUserPurchasedSheets()
      ]);
  // const ordersData = ordersResponse?.data?.data?.orders || [];
      const purchasedData = purchasedSheetsResponse?.data?.data?.sheets || [];
  // orders data fetched but not directly used
      setPurchasedSheets(purchasedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (sheetId) => {
    try {
      toast.loading('กำลังดาวน์โหลด...');
      
      // ดาวน์โหลดชีท
      const response = await sheetsAPI.downloadSheet(sheetId);
      
      // สร้าง blob และดาวน์โหลด
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // ดึงชื่อไฟล์จาก header เพื่อตรงกับชื่อชีทที่ผู้ขายตั้ง
      const disposition = response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);
      let fileName = `sheet_${sheetId}.pdf`;
      if (disposition) {
        const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
        }
      }
      // sanitize ชื่อไฟล์สำหรับ Windows/macOS
      fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('ดาวน์โหลดสำเร็จ!');
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading sheet:', error);
      toast.error('ไม่สามารถดาวน์โหลดชีทได้');
    }
  };

  const openReview = async (sheetId) => {
    try {
      const me = await reviewsAPI.getMyReview(sheetId);
      const data = me?.data?.data || {};
      setReviewModal({ open: true, sheetId, rating: data?.rating || 0, comment: data?.comment || '' });
    } catch {
      setReviewModal({ open: true, sheetId, rating: 0, comment: '' });
    }
  };

  const submitReview = async () => {
    try {
      const { sheetId, rating, comment } = reviewModal;
      if (!sheetId || !rating) {
        toast.error('กรุณาให้คะแนนอย่างน้อย 1 ดาว');
        return;
      }
      await reviewsAPI.createOrUpdate(sheetId, { rating: Math.round(rating), comment });
      toast.success('บันทึกรีวิวสำเร็จ');
      setReviewModal({ open: false, sheetId: null, rating: 0, comment: '' });
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'บันทึกรีวิวไม่สำเร็จ');
    }
  };

  // getStatusBadge removed (unused)

  const getFilteredData = () => {
    let filtered = [];
    const allItems = purchasedSheets.map(sheet => ({
      ...sheet,
      type: 'purchased',
      isFree: sheet.paymentMethod === 'FREE' || sheet.isFreeOrder || sheet.price === 0,
      orderId: sheet.orderId,
      createdAt: sheet.purchasedAt,
      status: sheet.status || 'verified',
      sheetId: sheet.id
    }));

    if (filter !== 'all') {
      if (filter === 'free') {
        filtered = allItems.filter(item => item.isFree);
      } else {
        filtered = allItems.filter(item => item.status === filter);
      }
    } else {
      filtered = allItems;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const subjectName = (item.subject?.name || item.subjectName || '').toLowerCase();
        const subjectCode = (item.subjectCode || '').toLowerCase();
        const oid = (item.orderId || item.id || '').toString().toLowerCase();
        return (
          title.includes(q) ||
          subjectName.includes(q) ||
          subjectCode.includes(q) ||
          oid.includes(q)
        );
      });
    }
    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

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

  if (!isAuthenticated) {
    return (
      <div className="container-app py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">เข้าสู่ระบบ</h1>
          <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูชีทที่คุณซื้อ</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  const totalCount = filteredData.length;

  return (
    <>
      

      <div className="relative z-10 max-w-full mx-auto px-6 sm:px-8 lg:px-20 py-8 pb-32" style={{ position: 'relative', zIndex: 10 }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-3xl mb-8 shadow-lg animate-fadeInUp animation-delay-200">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative px-6 py-12 sm:px-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">ชีทของฉัน</h1>
              <p className="text-purple-100 mt-1">ดาวน์โหลดชีทที่คุณเป็นเจ้าของทั้งหมดทีนี่</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex gap-4">
            <div className="inline-flex flex-col bg-white/10 rounded-xl px-4 py-3 text-white backdrop-blur-sm w-[340px] transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]">
              <div className="text-sm text-purple-100">จำนวนชีท</div>
              <div className="text-2xl font-bold">{totalCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-fadeInUp animation-delay-400 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหาชื่อชีท, ชื่อวิชา/รหัสวิชา, หรือรหัสคำสั่งซื้อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 hover:border-purple-500 hover:ring-1 hover:ring-purple-400 hover:scale-[1.01]"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fadeInUp animation-delay-600 transition-all duration-300 hover:shadow-xl">
          <div className="text-gray-300 mb-4">
            <DocumentTextIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีชีท</h3>
          <p className="text-gray-600 mb-6">เริ่มต้นเลือกซื้อชีทในหน้าร้านค้า แล้วกลับมาดาวน์โหลดได้ที่นี่</p>
          <Link
            to="/shop"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 font-semibold shadow"
          >
            ไปที่ร้านค้า
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {filteredData.map((s, index) => {
            // Debug: ดูข้อมูลชีท
            // Debug: ดูชื่อวิชา
            // Debug: ดู property names ทั้งหมด
            // Debug: ดูข้อมูลทั้งหมด
            // Debug: ดูชื่อวิชาภาษาไทย
            // Debug: ดูชื่อวิชาภาษาไทย
            // Debug: ดูข้อมูลเจ้าของชีท
            // Debug: ดูรูปโปรไฟล์
            return (
            <div key={s.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative z-10 animate-fadeInUp" style={{ backgroundColor: 'white', animationDelay: `${600 + index * 100}ms` }}>
              <div className="flex items-stretch">
                {/* Image (left) */}
                <div className={`w-48 self-stretch min-h-[12rem] relative bg-gradient-to-br ${getFacultyColors(s.faculty?.name || s.faculty).gradient} overflow-hidden flex items-center justify-center`}>
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <DocumentTextIcon className={`w-12 h-12 ${getFacultyColors(s.faculty?.name || s.faculty).iconColor} mb-3`} />
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getFacultyColors(s.faculty?.name || s.faculty).iconColor}`}>{s.subjectCode}</div>
                    </div>
                  </div>
                  {/* Price Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full shadow-lg ${s.isFree ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                      {s.isFree ? 'ฟรี' : formatPrice(s.price || 0)}
                    </span>
                  </div>
                </div>

                {/* Content (right) */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                        {s.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="w-4 h-4 text-purple-500" />
                          <span>{(() => {
                            try {
                              const parsed = JSON.parse(s.subjectName);
                              return parsed.th || parsed.thai || parsed.display || s.subjectCode;
                            } catch {
                              return s.subjectCode;
                            }
                          })()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpenIcon className="w-4 h-4 text-blue-500" />
                          <span>{s.faculty?.name || s.faculty}</span>
                        </div>
                                                  <div className="flex items-center gap-1">
                            {s.seller?.user?.picture ? (
                              <img 
                                src={s.seller.user.picture} 
                                alt={s.seller.penName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'inline';
                                }}
                              />
                            ) : null}
                            <UserIcon className={`w-4 h-4 text-green-500 ${s.seller?.user?.picture ? 'hidden' : ''}`} />
                            <span>By {s.seller?.penName || 'ไม่ระบุ'}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(s.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                          onClick={() => openReview(s.id)}
                          className="px-6 py-2 text-sm font-semibold text-yellow-800 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-300 transition-all duration-300"
                        >
                          ให้คะแนน/รีวิว
                        </button>
                        <button
                          onClick={() => handleDownload(s.id)}
                          className="px-6 py-2 min-w-[140px] text-center text-white rounded-lg shadow-md bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-300 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          ดาวน์โหลด
                        </button>
                      </div>
                    </div>
                    {/* Right actions removed per requirements */}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeInUp">
          <div className="absolute inset-0 bg-black/40 transition-all duration-300" onClick={() => setReviewModal({ open: false, sheetId: null, rating: 0, comment: '' })} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transition-all duration-300 hover:shadow-2xl">
            <h3 className="text-lg font-bold mb-4">ให้คะแนน/รีวิว</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setReviewModal(prev => ({ ...prev, rating: n }))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${reviewModal.rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={reviewModal.comment}
              onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="เขียนความเห็นของคุณ"
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:border-purple-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border transition-all duration-300 hover:bg-gray-100 hover:scale-105" onClick={() => setReviewModal({ open: false, sheetId: null, rating: 0, comment: '' })}>ยกเลิก</button>
              <button className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-300 hover:scale-105" onClick={submitReview}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderHistoryPage;