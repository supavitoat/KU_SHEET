// Utility functions for Admin Panel
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProfilePictureURL as serviceGetProfilePictureURL } from '../services/api';

// Format currency to Thai Baht
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '฿0.00';
  }
  
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date to Thai locale
export const formatDate = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'วันที่ไม่ถูกต้อง';
  }
};

// Format short date (without time) - แสดงเป็น "4 ก.ย. 68"
export const formatShortDate = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    return `${day} ${monthNames[month]} ${year.toString().slice(-2)}`;
  } catch {
    return 'วันที่ไม่ถูกต้อง';
  }
};

// Format short date with time - แสดงเป็น "4 ก.ย. 68 19:24"
export const formatShortDateTime = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    return `${day} ${monthNames[month]} ${year.toString().slice(-2)} ${hours}:${minutes}`;
  } catch {
    return 'วันที่ไม่ถูกต้อง';
  }
};

// Format time only
export const formatTime = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'เวลาไม่ถูกต้อง';
    
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'เวลาไม่ถูกต้อง';
  }
};

// Format number with Thai locale
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return new Intl.NumberFormat('th-TH').format(number);
};

// Get profile picture URL with fallback
export const getProfilePictureURL = (picture) => {
  try {
    return serviceGetProfilePictureURL(picture);
  } catch (e) {
    console.warn('adminUtils.getProfilePictureURL fallback error:', e);
    return null;
  }
};

// Export LoadingSpinner component
export { LoadingSpinner };

// Common status colors for admin panels
export const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'COMPLETED':
    case 'VERIFIED':
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Common status icons for admin panels
export const getStatusIcon = (status) => {
  switch (status) {
    case 'PENDING':
      return '⏳';
    case 'COMPLETED':
    case 'VERIFIED':
    case 'APPROVED':
      return '✅';
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
      return '❌';
    case 'PROCESSING':
      return '🔄';
    default:
      return '❓';
  }
};
