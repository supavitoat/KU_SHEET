import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const resolvedApiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
const api = axios.create({
  baseURL: resolvedApiBase,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get the correct base URL for static files
export const getBaseURL = () => {
  const apiURL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  // Remove trailing /api if present
  return apiURL.replace(/\/api$/, '').replace(/\/+$/,'');
};

// Helper function to get full URL for profile pictures
export const getProfilePictureURL = (picturePath) => {
  // Default placeholder (could be replaced with a local asset)
  const fallback = '/default-avatar.svg';

  if (!picturePath) {
    return fallback;
  }

  try {
    // If it's a data URL (base64), return as is
    if (picturePath.startsWith('data:')) return picturePath;

    // If already absolute HTTP(S)
    if (/^https?:\/\//i.test(picturePath)) return picturePath;

    // Normalize any duplicate slashes
    const base = getBaseURL();

    // If backend stored with leading /uploads/...
    if (picturePath.startsWith('/uploads/')) {
      return `${base}${picturePath}`.replace(/([^:]\/)(\/)+/g, '$1/');
    }

    // If it accidentally stored without leading slash but starts with uploads/
    if (picturePath.startsWith('uploads/')) {
      return `${base}/${picturePath}`.replace(/([^:]\/)(\/)+/g, '$1/');
    }

    // If just a filename (contains extension but no path separators)
    if (!picturePath.includes('/') && /\.(png|jpe?g|webp|gif|svg)$/i.test(picturePath)) {
      return `${base}/uploads/profiles/${picturePath}`;
    }

    // Fallback attempt: prepend base
    return `${base}/${picturePath.replace(/^\/+/, '')}`;
  } catch (e) {
    console.warn('getProfilePictureURL error:', e);
    return fallback;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    
    // ไม่แสดง toast error สำหรับบาง endpoint ที่มีการจัดการเอง
    if (
      error.config?.url?.includes('/wishlist') ||
      error.config?.url?.includes('/payments/discounts/validate')
    ) {
      // Skip toast for wishlist errors
    } else {
      if (error.response?.status === 401) {
        // Handle unauthorized error
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
      } else if (error.response?.status === 404) {
        toast.error('ไม่พบข้อมูลที่ต้องการ');
      } else if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data.errors;
        if (errors && Array.isArray(errors)) {
          errors.forEach(err => {
            toast.error(err.message);
          });
        } else {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateProfileName: (data) => api.put('/auth/profile/name', data),
  updateProfilePicture: (data) => api.put('/auth/profile-picture', data),
  logout: () => api.post('/auth/logout'),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const sheetsAPI = {
  getSheets: (params) => api.get('/sheets', { params }),
  getSheetById: (id) => api.get(`/sheets/${id}`),
  getSheetsByFaculty: (facultyId, params) => api.get(`/sheets/faculty/${facultyId}`, { params }),
  downloadSheet: (id) => api.get(`/sheets/${id}/download`, { responseType: 'blob' }),
  downloadFreeSheet: (id) => api.get(`/sheets/${id}/download-free`, { responseType: 'blob' }),
  getFeaturedSheets: (params) => api.get('/sheets/featured', { params }),
  searchSheets: (params) => api.get('/sheets/search', { params }),
  getSheetStats: (id) => api.get(`/sheets/${id}/stats`),
  getStats: () => api.get('/metadata/stats'),
};

export const reviewsAPI = {
  getSheetReviews: (sheetId, params = {}) => api.get(`/reviews/${sheetId}`, { params }),
  getMyReview: (sheetId) => api.get(`/reviews/${sheetId}/me`),
  createOrUpdate: (sheetId, data) => api.post(`/reviews/${sheetId}`, data),
  update: (sheetId, data) => api.put(`/reviews/${sheetId}`, data),
  delete: (sheetId) => api.delete(`/reviews/${sheetId}`),
};

export const sellerAPI = {
  registerSeller: (data) => api.post('/seller/register', data),
  getSellerProfile: () => api.get('/seller/profile'),
  updateSellerProfile: (data) => api.put('/seller/profile', data),
  createSheet: (data) => api.post('/seller/sheets', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSellerSheets: (params) => api.get('/seller/sheets', { params }),
  updateSheet: (id, data) => api.put(`/seller/sheets/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteSheet: (id) => api.delete(`/seller/sheets/${id}`),
  getSellerRevenue: (params) => api.get('/seller/revenue', { params }),
  // เพิ่มเมธอดสำหรับเช็คและอัปเดตข้อมูลธนาคาร
  checkBankInfo: () => api.get('/seller/profile'),
  updateBankInfo: (data) => api.put('/seller/profile', data),
  getSheetById: (id) => api.get(`/seller/sheets/${id}`),
};

export const ordersAPI = {
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: (params) => api.get('/orders', { params }),
  getUserPurchasedSheets: (params) => api.get('/orders/purchased-sheets', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  // uploadPaymentSlip removed - use PromptPay system instead
  cancelOrder: (id) => api.delete(`/orders/${id}`),
  getOrderStats: () => api.get('/orders/stats'),
};

export const paymentsAPI = {
  createSession: (data) => api.post('/payments/session', data),
  
  // PromptPay Payment System (ฟรี ปลอดภัย ใช้งานได้จริง)
  createPromptPaySession: (data) => {
    const token = localStorage.getItem('token');
    return api.post('/payments/promptpay/create', data, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  verifyPromptPayPayment: (data) => {
    const token = localStorage.getItem('token');
    return api.post('/payments/promptpay/verify', data, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  getPromptPayStatus: (sessionId) => {
    const token = localStorage.getItem('token');
    return api.get(`/payments/promptpay/status/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  // Stripe
  createStripeCheckoutSession: (data) => {
    const token = localStorage.getItem('token');
    return api.post('/payments/stripe/create-checkout-session', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  // Discounts
  validateDiscount: (payload) => {
    const token = localStorage.getItem('token');
    return api.post('/payments/discounts/validate', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  getSessionStatus: (externalId, orderIds) =>
    api.get(`/payments/session/${externalId}/status`, { params: { orderIds: orderIds.join(',') } }),
  detectPayment: (externalId, orderIds) =>
    api.get(`/payments/detect/${externalId}`, { params: { orderIds: orderIds.join(',') } }),
};



export const metadataAPI = {
  getAllMetadata: () => api.get('/metadata/all'),
  getFaculties: () => api.get('/metadata/faculties'),
  getSubjects: (params) => api.get('/metadata/subjects', { params }),
  searchSubjects: (params) => api.get('/metadata/subjects/search', { params }),
  getSheetTypes: () => api.get('/metadata/sheet-types'),
  getTerms: () => api.get('/metadata/terms'),
  getYears: () => api.get('/metadata/years'),
  getThaiFaculties: () => api.get('/metadata/thai-faculties'),
};

export const wishlistAPI = {
  addToWishlist: (sheetId) => api.post('/wishlist', { sheetId }),
  removeFromWishlist: (sheetId) => api.delete(`/wishlist/${sheetId}`),
  getWishlist: (params) => api.get('/wishlist', { params }),
  checkWishlist: (sheetId) => api.get(`/wishlist/check/${sheetId}`),
  getWishlistIds: () => api.get('/wishlist/ids'),
};

// Admin API
export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  banUser: (id) => api.post(`/admin/users/${id}/ban`),
  unbanUser: (id) => api.post(`/admin/users/${id}/unban`),
  
  // Sheet management
  getSheets: (params) => api.get('/admin/sheets', { params }),
  getSheetById: (id) => api.get(`/admin/sheets/${id}`),
  approveSheet: (id) => api.post(`/admin/sheets/${id}/approve`),
  rejectSheet: (id, reason) => api.post(`/admin/sheets/${id}/reject`, { reason }),
  deleteSheet: (id) => api.delete(`/admin/sheets/${id}`),
  
  // Order management
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  
  // Financial reports
  getFinancialReports: (params) => api.get('/admin/reports/financial', { params }),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
  
  // Finance management
  getFinanceStats: () => api.get('/admin/finance/stats'),
  getPendingPayouts: (params) => api.get('/admin/finance/pending-payouts', { params }),
  getPayoutHistory: (params) => api.get('/admin/finance/payout-history', { params }),
  getRecentTransactions: (params) => api.get('/admin/finance/recent-transactions', { params }),
  processPayout: (payoutId) => api.post(`/admin/finance/payouts/${payoutId}/process`),
  updateCommissionRate: (rate) => api.put('/admin/finance/commission-rate', { rate }),
  updatePayoutSchedule: (schedule) => api.put('/admin/finance/payout-schedule', { schedule }),
  
  // Analytics
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  getSheetAnalytics: () => api.get('/admin/analytics/sheets'),
  getOrderAnalytics: () => api.get('/admin/analytics/orders'),
  
  // System monitoring
  getSystemHealth: () => api.get('/admin/system/health'),
  getSystemLogs: (params) => api.get('/admin/system/logs', { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  
  // Activity logs
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),

  // Study group management
  getGroups: (params) => api.get('/admin/groups', { params }),
  getGroupById: (id) => api.get(`/admin/groups/${id}`),
  updateGroupStatus: (id, status) => api.put(`/admin/groups/${id}/status`, { status }),
  deleteGroup: (id) => api.delete(`/admin/groups/${id}`),

  // Payouts (seller-based)
  getPayoutDetailsBySeller: (sellerId) => api.get(`/admin/payouts/seller/${sellerId}`),
  getSellerWeeklyPayoutHistory: (sellerId) => api.get(`/admin/payouts/seller/${sellerId}/weekly-history`),
  confirmSellerPayoutTransfer: (sellerId, payload) => api.put(`/admin/payouts/seller/${sellerId}/confirm-transfer`, payload),
  uploadPayoutSlip: (formData) => api.post('/admin/payouts/upload-slip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Discount codes
  listDiscounts: () => api.get('/admin/discounts'),
  createDiscount: (data) => api.post('/admin/discounts', data),
  updateDiscount: (id, data) => api.put(`/admin/discounts/${id}`, data),
  toggleDiscount: (id) => api.put(`/admin/discounts/${id}/toggle`),
  deleteDiscount: (id) => api.delete(`/admin/discounts/${id}`),
};

export const groupsAPI = {
  list: (params) => api.get('/groups', { params }),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  join: (id) => api.post(`/groups/${id}/join`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  cancel: (id) => api.post(`/groups/${id}/cancel`),
  approve: (id, memberId) => api.post(`/groups/${id}/approve/${memberId}`),
  start: (id) => api.post(`/groups/${id}/start`),
  finish: (id) => api.post(`/groups/${id}/finish`),
  myGroups: () => api.get('/groups/me/list'),
  // New: Check-in & export & announcement
  checkIn: (id, memberId) => api.post(`/groups/${id}/checkin/${memberId}`),
  exportAttendees: (id) => api.get(`/groups/${id}/attendees/export`, { responseType: 'blob' }),
  setAnnouncement: (id, text) => api.post(`/groups/${id}/announcement`, { text }),
  clearAnnouncement: (id) => api.delete(`/groups/${id}/announcement`),
  markNoShow: (id, memberId) => api.post(`/groups/${id}/noshow/${memberId}`),
};

// Reports API
export const reportsAPI = {
  submit: (data) => api.post('/reports', data),
  getMine: (params) => api.get('/reports/me', { params }),
};

// Admin reports
export const adminReportsAPI = {
  list: (params) => api.get('/admin/reports', { params }),
  update: (id, data) => api.put(`/admin/reports/${id}`, data),
};

// Chat API
export const chatAPI = {
  getOrCreateChat: (groupId) => api.get(`/groups/${groupId}/chat`),
  getMessages: (groupId, params) => api.get(`/groups/${groupId}/chat/messages`, { params }),
  sendMessage: (groupId, data) => api.post(`/groups/${groupId}/chat/messages`, data),
};

// Reputation API
export const reputationAPI = {
  submitFeedback: (targetUserId, data) => api.post(`/users/${targetUserId}/feedback`, data),
  getReputation: (userId) => api.get(`/users/${userId}/reputation`),
  getMyFeedbackForGroup: (groupId) => api.get(`/groups/${groupId}/my-feedback`),
};

export const notificationsAPI = {
  list: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;