import React, { useState } from 'react';
import { getBaseURL } from '../../services/api';
import { XMarkIcon, DocumentArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const SlipUploadModal = ({ isOpen, onClose, payoutData, onSlipUploaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // เมื่อเปิดโมดัล ถ้ามีสลิปที่อัพโหลดไว้แล้ว ให้แสดงรูปทันที
  React.useEffect(() => {
    if (!isOpen) return;
    if (payoutData?.slipImagePath) {
      setPreviewUrl(`${getBaseURL()}/uploads/slips/${payoutData.slipImagePath}`);
      setSelectedFile(null);
    } else {
      setPreviewUrl(null);
    }
  }, [isOpen, payoutData?.slipImagePath]);

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      setSelectedFile(file);
      
      // สร้าง preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์สลิปก่อน');
      return;
    }

    try {
      setUploading(true);
      
      // สร้าง FormData
      const formData = new FormData();
      formData.append('slipImage', selectedFile);
      formData.append('payoutId', payoutData.id);
      formData.append('sellerId', payoutData.id);
      formData.append('amount', payoutData.netAmount);
      formData.append('uploadDate', new Date().toISOString());



  // ส่งข้อมูลไปยัง backend ผ่าน adminAPI (axios จัดการ header ให้)
  const { data: result } = await adminAPI.uploadPayoutSlip(formData);
      
      if (result.success) {
        toast.success('อัพโหลดสลิปสำเร็จ!');
        
        // เรียก callback เพื่ออัพเดทข้อมูล
        if (onSlipUploaded) {
          onSlipUploaded(result.data);
        }
        
        // รีเซ็ตฟอร์ม
        setSelectedFile(null);
        setPreviewUrl(null);
        onClose();

        // รีเฟรชหน้าอัตโนมัติ 1 ครั้ง เพื่อให้ข้อมูลล่าสุดแสดงผลครบถ้วน
        setTimeout(() => {
          try { window.location.reload(); } catch { /* ignore */ }
        }, 300);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
      }
    } catch (error) {
      console.error('Error uploading slip:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัพโหลดสลิป');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">อัพโหลดสลิปการโอนเงิน</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Payout Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลการโอนเงิน</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">เจ้าของชีท:</span>
              <span className="font-medium">{payoutData?.sellerName || 'ไม่ระบุ'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">จำนวนเงิน:</span>
              <span className="font-medium">฿{payoutData?.netAmount || 0}</span>
            </div>
          </div>

        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกไฟล์สลิปการโอนเงิน
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="slip-upload"
              disabled={uploading}
            />
            <label
              htmlFor="slip-upload"
              className="cursor-pointer block"
              style={{ pointerEvents: uploading ? 'none' : 'auto' }}
            >
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Slip Preview"
                    className="mx-auto max-h-48 rounded-lg border"
                  />
                  <p className="text-sm text-gray-600">
                    คลิกเพื่อเปลี่ยนไฟล์
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        คลิกเพื่อเลือกไฟล์
                      </span>{' '}
                      หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG ขนาดไม่เกิน 5MB
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังอัพโหลด...
              </>
            ) : (
              <>
                <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                อัพโหลดสลิป
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlipUploadModal;
