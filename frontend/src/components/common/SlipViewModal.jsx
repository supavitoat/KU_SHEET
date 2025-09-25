import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const SlipViewModal = ({ isOpen, onClose, slipData, onConfirm }) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">สลิปการโอนเงิน</h2>
            <p className="text-sm text-gray-600 mt-1">รายละเอียดการโอนเงิน</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Transaction Details */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">จำนวนเงิน</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(slipData?.netAmount || slipData?.amount || 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">วันที่โอนเงิน</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(slipData?.slipUploadDate || slipData?.uploadDate)}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">สถานะ</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                slipData?.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {slipData?.status === 'COMPLETED' ? '✅ โอนเงินแล้ว' : '⏳ รอการโอน'}
              </span>
            </div>
          </div>

          {/* Slip Image */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">รูปสลิป</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {slipData?.slipImagePath ? (
                <img
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '')}/uploads/slips/${slipData.slipImagePath}`}
                  alt="สลิปการโอนเงิน"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    console.error('Failed to load slip image:', e.target.src);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                    e.target.className = 'w-full h-32 object-contain opacity-50';
                  }}
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">ไม่พบรูปสลิป</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ปิด
            </button>
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm(slipData);
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ยืนยัน
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlipViewModal;
