
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

import { sheetsAPI, getProfilePictureURL, reviewsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductCard from '../../components/common/ProductCard';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon, 
  EyeIcon, 
  PlusIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClockIcon,
  XCircleIcon,
  BookOpenIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatCurrency, formatDate } from '../../utils/format';
import { getFacultyColors } from '../../utils/facultyColors';

// Animated background removed
const AnimatedBackground = () => null;

const SheetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, isInCart } = useCart();
  
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
 
  
  const [sheet, setSheet] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [otherSheets, setOtherSheets] = useState([]);
  const [loadingOtherSheets, setLoadingOtherSheets] = useState(false);

  // Helper functions moved to shared utils

  const fetchOtherSheetsBySeller = React.useCallback(async (sellerId) => {
    try {
      setLoadingOtherSheets(true);
      const response = await sheetsAPI.getSheets({ seller: sellerId, limit: 6 });
      if (response.data && response.data.data && response.data.data.sheets) {
        // กรองชีทที่ไม่ได้เป็นชีทปัจจุบัน
        const filteredSheets = response.data.data.sheets.filter(s => s.id !== parseInt(id));
        setOtherSheets(filteredSheets);
      }
    } catch (error) {
      console.error('Error fetching other sheets:', error);
    } finally {
      setLoadingOtherSheets(false);
    }
  }, [id]);

  const fetchSheetDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sheetsAPI.getSheetById(id);
      // ตรวจสอบว่า response.data.data.sheet มีข้อมูลหรือไม่
      if (response.data && response.data.data && response.data.data.sheet && response.data.data.sheet.id) {
        setSheet(response.data.data.sheet);
        setHasPurchased(response.data.data.hasPurchased || false);
        setError(null); // ล้าง error ถ้ามี
        
        // ดึงชีทอื่นๆ ของผู้สร้างคนเดียวกัน
        if (response.data.data.sheet.sellerId) {
          fetchOtherSheetsBySeller(response.data.data.sheet.sellerId);
        }
      } else {
        setSheet(null);
        setError('ไม่พบข้อมูลชีท');
      }
    } catch (error) {
      console.error('❌ Error fetching sheet details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setSheet(null);
      setError('ไม่สามารถโหลดข้อมูลชีทได้');
    } finally {
      setLoading(false);
    }
  }, [id, fetchOtherSheetsBySeller]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const response = await reviewsAPI.getSheetReviews(id);
      if (response.data?.success) {
        const reviewsData = response.data.data?.reviews || response.data.data || [];
        setReviews(reviewsData);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  // Run effects after callbacks are declared
  useEffect(() => {
    fetchSheetDetails();
    fetchReviews();
  }, [fetchSheetDetails, fetchReviews]);

  const handleDownload = async () => {
    // สำหรับชีทฟรี ไม่ต้อง login
    if (sheet.isFree || sheet.price === 0) {
      try {
        setDownloading(true);
        const response = await sheetsAPI.downloadFreeSheet(id);
        
        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sheet.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Refresh sheet data to update download count
        fetchSheetDetails();
      } catch (error) {
        console.error('Download error:', error);
        alert('เกิดข้อผิดพลาดในการดาวน์โหลด');
      } finally {
        setDownloading(false);
      }
      return;
    }

    // สำหรับชีทที่ต้องซื้อ ต้อง login ก่อน
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/sheets/${id}` } });
      return;
    }

    if (!hasPurchased) {
      navigate(`/cart/${id}`);
      return;
    }

    try {
      setDownloading(true);
      const response = await sheetsAPI.downloadSheet(id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sheet.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh sheet data to update download count
      fetchSheetDetails();
    } catch (error) {
      console.error('Download error:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด');
    } finally {
      setDownloading(false);
    }
  };

  // removed unused handlePurchase

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/infoSheet/${id}` } });
      return;
    }
    
    if (sheet.isFree) {
      // ถ้าเป็นชีทฟรี ให้ดาวน์โหลดทันที
      handleDownload();
      return;
    }
    
    // ตรวจสอบว่าสินค้าอยู่ในตะกร้าแล้วหรือไม่
    if (isInCart(sheet.id)) {
      return; // ไม่ทำอะไรถ้าอยู่ในตะกร้าแล้ว
    }
    
    // เพิ่มลงตระกร้า
    addToCart({
      id: sheet.id,
      title: sheet.title,
      price: sheet.price,
      subjectName: sheet.subjectName,
      subject: sheet.subject,
      subjectCode: sheet.subjectCode,
      seller: sheet.seller,
      sellerId: sheet.sellerId,
      isFree: sheet.isFree,
      previewImages: sheet.previewImages,
      faculty: sheet.faculty,
      createdAt: sheet.createdAt,
      downloadCount: sheet.downloadCount
    });
  };



  // moved earlier

  if (loading) {
    return (
      <div className="min-h-screen relative bg-white">
        
        <div className="relative z-10 min-h-screen bg-white flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลชีท..." />
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="min-h-screen relative bg-white">
        
        <div className="relative z-10 min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบชีท</h1>
            <p className="text-gray-600 mb-6">{error || 'ชีทที่คุณค้นหาอาจถูกลบหรือไม่ได้รับการอนุมัติ'}</p>
                      <button
            onClick={() => navigate('/')}
            className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <ArrowLeftIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
            <span className="relative z-10">กลับหน้าหลัก</span>
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-white">
      
      <div className="relative z-10 min-h-screen bg-white">
        <div className="container-app py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          กลับ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {sheet.subjectCode}
                  </span>
                  {sheet.isFree && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ฟรี
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-800 bg-clip-text text-transparent">{sheet.title}</h1>
                <p className="text-gray-600 text-lg">
                  {sheet.subjectName?.thai || sheet.subjectName?.display || sheet.subject?.name}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">รายละเอียด</h3>
                <p className="text-gray-700 leading-relaxed">{sheet.shortDescription}</p>
              </div>

              {/* Sheet Info Grid - Row 1 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">คณะ</p>
                    <p className="font-medium">{sheet.faculty || 'ไม่ระบุคณะ'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">สาขา</p>
                    <p className="font-medium">{sheet.major || sheet.subjectName?.display || sheet.subjectName?.thai || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Sheet Info Grid - Row 2 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">หมู่</p>
                    <p className="font-medium">{sheet.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500">ปีการศึกษา</p>
                    <p className="font-medium">{sheet.year}</p>
                  </div>
                </div>
              </div>



              {/* Seller Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">ผู้จัดทำ</h3>
                <div className="flex items-center gap-3">
                  {sheet.seller?.user?.picture || sheet.seller?.picture ? (
                    <img 
                      src={getProfilePictureURL(sheet.seller?.user?.picture || sheet.seller?.picture)}
                      alt={sheet.seller?.penName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center ${sheet.seller?.user?.picture || sheet.seller?.picture ? 'hidden' : ''}`}>
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sheet.seller?.penName}</p>
                    <p className="text-sm text-gray-600">โดย {sheet.seller?.user?.fullName}</p>
                  </div>
                </div>
              </div>


            </div>

            {/* Preview Images */}
            {sheet.previewImages && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวอย่างเนื้อหา</h3>
                <div className="space-y-6">
                  {(() => {
                    try {
                      const images = JSON.parse(sheet.previewImages);
                      return Array.isArray(images) ? images.map((image, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                          <img
                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/previews/${image}`}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-auto object-contain max-h-[400px]"
                          />
                        </div>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              {/* Price */}
              <div className="text-center mb-6">
                {sheet.isFree || sheet.price === 0 ? (
                  <div className="text-4xl font-bold text-green-600 mb-2 animate-pulse">ฟรี!!</div>
                ) : (
                  <div className="text-3xl font-bold text-blue-600 mb-2">฿{sheet.price}</div>
                )}
                <p className="text-gray-600">ดาวน์โหลดได้ทันที</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {sheet.status === 'PENDING' ? (
                  <div className="text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-center gap-2 text-yellow-800">
                        <ClockIcon className="w-5 h-5" />
                        <span className="font-medium">รอการอนุมัติ</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        ชีทนี้กำลังรอการอนุมัติจากแอดมิน
                      </p>
                    </div>
                  </div>
                ) : sheet.status === 'REJECTED' ? (
                  <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-center gap-2 text-red-800">
                        <XCircleIcon className="w-5 h-5" />
                        <span className="font-medium">ไม่ได้รับการอนุมัติ</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        ชีทนี้ไม่ได้รับการอนุมัติจากแอดมิน
                      </p>
                    </div>
                  </div>
                ) : (sheet.isFree || sheet.price === 0) ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <ArrowDownTrayIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative z-10">{downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด'}</span>
                  </button>
                ) : hasPurchased ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <ArrowDownTrayIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative z-10">{downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด'}</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {!isInCart(sheet.id) ? (
                      <button
                        onClick={handleAddToCart}
                        className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <PlusIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                        <span className="relative z-10">เพิ่มลงตระกร้า</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 px-4 rounded-xl font-medium shadow-md border border-gray-200">
                        <span>อยู่ในตระกร้าแล้ว</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate('/shop')}
                  className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group border border-gray-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <EyeIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10">ดูชีทอื่นๆ</span>
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">ข้อมูลเพิ่มเติม</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>ขนาดไฟล์:</span>
                    <span>{sheet.fileSizeBytes ? `${(sheet.fileSizeBytes/1024/1024).toFixed(2)} MB` : 'กำลังคำนวณ...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่อัปโหลด:</span>
                    <span>{new Date(sheet.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>สถานะ:</span>
                    <span className={`font-medium ${
                      sheet.status === 'APPROVED' ? 'text-green-600' :
                      sheet.status === 'PENDING' ? 'text-yellow-600' :
                      sheet.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {sheet.status === 'APPROVED' ? 'ได้รับการอนุมัติ' :
                       sheet.status === 'PENDING' ? 'รอการอนุมัติ' :
                       sheet.status === 'REJECTED' ? 'ไม่ได้รับการอนุมัติ' : sheet.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">ความคิดเห็นจากผู้ใช้</h4>
                  <div className="flex items-center gap-2">
                    <StarIconSolid className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {sheet.avgRating ? `${sheet.avgRating.toFixed(1)} (${sheet.reviewCount || 0} รีวิว)` : 'ยังไม่มีรีวิว'}
                    </span>
                  </div>
                </div>
                
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 mt-2">กำลังโหลดรีวิว...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {}
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {review.user?.fullName || 'ผู้ใช้'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment ? (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-700 text-sm leading-relaxed italic">"{review.comment}"</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic mt-2">ไม่มีข้อความเพิ่มเติม</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {}
                    <StarIconSolid className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>ยังไม่มีรีวิว</p>
                    <p className="text-sm">เป็นคนแรกที่ให้รีวิวชีทนี้!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Sheets by Same Seller */}
        <div className="mt-12">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border border-blue-100">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ชีทอื่นๆ จาก {sheet.seller?.penName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ค้นพบชีทคุณภาพอื่นๆ จากผู้สร้างคนเดียวกัน
                  </p>
                </div>
              </div>
              {otherSheets.length > 0 && (
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{otherSheets.length} ชีท</span>
                </div>
              )}
            </div>
            
            {loadingOtherSheets ? (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-600 mt-4 font-medium">กำลังค้นหาชีทอื่นๆ...</p>
                <p className="text-gray-500 text-sm mt-1">โปรดรอสักครู่</p>
              </div>
            ) : otherSheets.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 pt-8">
                {otherSheets.map((otherSheet) => (
                  <div key={otherSheet.id} className="flex-shrink-0 w-60">
                    <ProductCard
                      sheet={otherSheet}
                      getFacultyColors={getFacultyColors}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">ยังไม่มีชีทอื่นๆ</h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  ผู้สร้างยังไม่ได้อัปโหลดชีทอื่นๆ ติดตามเพื่อรับการแจ้งเตือนเมื่อมีชีทใหม่
                </p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <EyeIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10">ดูชีทอื่นๆ</span>
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SheetDetailPage;