import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminAPI, getProfilePictureURL } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReasonModal from '../../components/common/ReasonModal';
import toast from 'react-hot-toast';

const SheetInfoPage = () => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  // We only need the setter for loading side-effects; omit state to satisfy lint
  const [, setRejectLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSheetDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSheetById(id);
      
      if (response.data.success) {
        const sheetData = response.data.data;
        setSheet(sheetData);
      }
    } catch (error) {
      console.error('Error fetching sheet details:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดชีทได้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSheetDetails();
  }, [fetchSheetDetails]);

  const handleApprove = async () => {
    try {
      const response = await adminAPI.approveSheet(id);
      if (response.data.success) {
        toast.success('อนุมัติชีทสำเร็จ');
        fetchSheetDetails(); // รีเฟรชข้อมูล
      }
    } catch (error) {
      console.error('Error approving sheet:', error);
      toast.error('ไม่สามารถอนุมัติชีทได้');
    }
  };

  const handleReject = () => {
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (reason) => {
    if (!reason || reason.trim() === '') {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    setRejectLoading(true);
    try {
      const response = await adminAPI.rejectSheet(id, reason);
      if (response.data.success) {
        toast.success('ปฏิเสธชีทสำเร็จ');
        fetchSheetDetails(); // รีเฟรชข้อมูล
        setRejectModalOpen(false);
      }
    } catch (error) {
      console.error('Error rejecting sheet:', error);
      toast.error('ไม่สามารถปฏิเสธชีทได้');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบชีทนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    try {
      await adminAPI.deleteSheet(id);
      toast.success('ลบชีทสำเร็จ');
      navigate('/admin/manage-sheets');
    } catch (error) {
      console.error('Error deleting sheet:', error);
      toast.error('ไม่สามารถลบชีทได้');
    }
  };

  const handleDownloadPDF = async () => {
    if (!sheet?.pdfFile) {
      toast.error('ไม่พบไฟล์ PDF');
      return;
    }

    try {
      // สร้าง URL สำหรับดาวน์โหลด
      const downloadUrl = `http://localhost:5000/uploads/sheets/${encodeURIComponent(sheet.pdfFile)}`;
      
      // สร้าง link element และคลิกเพื่อดาวน์โหลด
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = sheet.pdfFile;
      link.target = '_blank';
      
      // เพิ่ม link ลงใน DOM และคลิก
      document.body.appendChild(link);
      link.click();
      
      // ลบ link ออกจาก DOM
      document.body.removeChild(link);
      
      toast.success('เริ่มดาวน์โหลด PDF แล้ว');
      } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      toast.error('ไม่สามารถดาวน์โหลด PDF ได้');
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบชีท</h2>
          <p className="text-gray-600 mb-4">ชีทที่คุณค้นหาอาจถูกลบไปแล้ว</p>
          <button
            onClick={() => navigate('/admin/manage-sheets')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปหน้าจัดการชีท
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
              <button
                onClick={() => window.close()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="ปิดแท็บ"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">รายละเอียดชีท</h1>
                <p className="text-gray-600">ตรวจสอบและจัดการชีท</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {sheet.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" />
                    อนุมัติ
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    ปฏิเสธ
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                ลบชีท
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReasonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={handleRejectSubmit}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sheet Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="w-12 h-12 text-purple-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{sheet.title || 'ไม่มีชื่อ'}</h2>
                    <p className="text-gray-600">{sheet.subjectCode || 'ไม่มีรหัสวิชา'}</p>
                  </div>
                </div>
                {getStatusBadge(sheet.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">คณะ/สาขา</p>
                      <p className="font-medium">{sheet.faculty || 'ไม่ระบุ'} - {sheet.major || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">ภาคการศึกษา</p>
                      <p className="font-medium">{sheet.term || 'ไม่ระบุ'} / {sheet.year || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">หมู่เรียน</p>
                      <p className="font-medium">{sheet.section || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">ราคา</p>
                      <p className="font-medium">
                        {sheet.price === 0 ? 'ฟรี' : `฿${sheet.price}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">รหัสวิชา</p>
                      <p className="font-medium">{sheet.subjectCode || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ArrowDownTrayIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">จำนวนดาวน์โหลด</p>
                      <p className="font-medium">{sheet.downloadCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">วันที่อัพโหลด</p>
                      <p className="font-medium">{formatDate(sheet.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ชื่อวิชา</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ชื่อวิชาภาษาไทย</p>
                      <p className="font-medium text-gray-700">
                        {(() => {
                          try {
                            if (sheet.subjectNameJSON) {
                              const subjectNames = JSON.parse(sheet.subjectNameJSON);
                              return subjectNames.th || sheet.subjectNameJSON || 'ไม่ระบุ';
                            }
                            return 'ไม่ระบุ';
                          } catch {
                            return sheet.subjectNameJSON || 'ไม่ระบุ';
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ชื่อวิชาภาษาอังกฤษ</p>
                      <p className="font-medium text-gray-700">
                        {(() => {
                          try {
                            if (sheet.subjectNameJSON) {
                              const subjectNames = JSON.parse(sheet.subjectNameJSON);
                              return subjectNames.en || sheet.subjectNameJSON || 'ไม่ระบุ';
                            }
                            return 'ไม่ระบุ';
                          } catch {
                            return sheet.subjectNameJSON || 'ไม่ระบุ';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">คำอธิบาย</h3>
                  <p className="text-gray-700">{sheet.shortDescription || 'ไม่มีคำอธิบาย'}</p>
                </div>

                {sheet.adminMessage && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ข้อความจากผู้ดูแล</h3>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{sheet.adminMessage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Download */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ไฟล์ PDF</h3>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  ดู PDF
                </button>
              </div>
              {sheet?.pdfFile && (
                <p className="text-sm text-gray-600">ชื่อไฟล์: {sheet.pdfFile}</p>
              )}
            </div>

            {/* Preview Images */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">รูปตัวอย่าง</h3>
              
              {sheet.previewImages && (() => {
                try {
                  const previewImages = JSON.parse(sheet.previewImages);
                  
                  if (Array.isArray(previewImages) && previewImages.length > 0) {
                    return (
                      <div className="space-y-6">
                        {previewImages.map((image, index) => {
                          const imageUrl = `http://localhost:5000/uploads/previews/${encodeURIComponent(image)}`;
                          
                          return (
                            <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-auto object-contain max-h-[400px]"
                                onError={(e) => {
                                  console.error(`❌ Failed to load image: ${image}`);
                                  e.target.style.display = 'none';
                                }}
                                onLoad={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return <p className="text-gray-500">ไม่มีรูปตัวอย่าง</p>;
                } catch (error) {
                  console.error('❌ Error parsing preview images:', error);
                  return <p className="text-gray-500">ไม่สามารถโหลดรูปตัวอย่างได้</p>;
                }
              })()}
            </div>

            {/* Reviews */}
            {sheet.reviews && sheet.reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">รีวิวล่าสุด</h3>
                <div className="space-y-4">
                  {sheet.reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {review.user?.picture ? (
                          <img
                            src={getProfilePictureURL(review.user.picture)}
                            alt={review.user.fullName || 'ผู้ใช้'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{review.user?.fullName || 'ไม่ระบุ'}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 ml-auto">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลผู้ขาย</h3>
              <div className="flex items-center gap-3 mb-4">
                {sheet.seller?.user?.picture ? (
                  <img
                    src={getProfilePictureURL(sheet.seller.user.picture)}
                    alt={sheet.seller.user.fullName || 'ผู้ขาย'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{sheet.seller?.user?.fullName || 'ไม่ระบุ'}</p>
                  <p className="text-sm text-gray-500">{sheet.seller?.user?.email || 'ไม่ระบุ'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">นามปากกา</span>
                  <span className="font-medium">{sheet.seller?.penName || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">เบอร์โทร</span>
                  <span className="font-medium">{sheet.seller?.phone || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ธนาคาร</span>
                  <span className="font-medium">{sheet.seller?.bankName || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">เลขบัญชี</span>
                  <span className="font-medium">{sheet.seller?.bankAccount || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ชื่อบัญชี</span>
                  <span className="font-medium">{sheet.seller?.accountName || 'ไม่ระบุ'}</span>
                </div>
              </div>
            </div>

            {/* Sheet Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดเพิ่มเติม</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">วันที่สร้าง</span>
                  <span className="font-medium">{formatDate(sheet.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">วันที่อัปเดต</span>
                  <span className="font-medium">{formatDate(sheet.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ไฟล์ PDF</span>
                  <span className="font-medium">{sheet.pdfFile || 'ไม่ระบุ'}</span>
                </div>
                {sheet.previewImages && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">รูปตัวอย่าง</span>
                    <span className="font-medium">
                      {(() => {
                        try {
                          const previewImages = JSON.parse(sheet.previewImages);
                          return Array.isArray(previewImages) ? `${previewImages.length} รูป` : '1 รูป';
                        } catch {
                          return '1 รูป';
                        }
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">สถานะ</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sheet.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    sheet.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sheet.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                     sheet.status === 'REJECTED' ? 'ถูกปฏิเสธ' :
                     'รออนุมัติ'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ประเภท</span>
                  <span className="font-medium">{sheet.isFree ? 'ฟรี' : 'มีค่าใช้จ่าย'}</span>
                </div>
                {sheet.adminMessage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">ข้อความจากผู้ดูแล</span>
                    <span className="font-medium text-yellow-600">{sheet.adminMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติ</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">คำสั่งซื้อ</span>
                  <span className="font-medium">{sheet._count?.orders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">รีวิว</span>
                  <span className="font-medium">{sheet._count?.reviews || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ดาวน์โหลด</span>
                  <span className="font-medium">{sheet.downloadCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            {sheet._count?.orders > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">คำสั่งซื้อล่าสุด</h3>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      มีคำสั่งซื้อทั้งหมด {sheet._count.orders} รายการ
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      ดูรายละเอียดได้ในหน้าจัดการคำสั่งซื้อ
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetInfoPage;
