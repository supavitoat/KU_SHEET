import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Handle specific status codes
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    } else {
      // Show error message for other errors
      toast.error(message);
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
  logout: () => api.post('/auth/logout'),
};

export const sheetsAPI = {
  getSheets: (params) => api.get('/sheets', { params }),
  getSheetById: (id) => api.get(`/sheets/${id}`),
  getSheetsByFaculty: (facultyId, params) => api.get(`/sheets/faculty/${facultyId}`, { params }),
  downloadSheet: (id) => api.get(`/sheets/${id}/download`, { responseType: 'blob' }),
  getFeaturedSheets: (params) => api.get('/sheets/featured', { params }),
  searchSheets: (params) => api.get('/sheets/search', { params }),
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
};

export const ordersAPI = {
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  uploadPaymentSlip: (id, file) => {
    const formData = new FormData();
    formData.append('payment_slip', file);
    return api.post(`/orders/${id}/payment-slip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  cancelOrder: (id) => api.delete(`/orders/${id}`),
  getOrderStats: () => api.get('/orders/stats'),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getPendingSheets: (params) => api.get('/admin/sheets/pending', { params }),
  getSheetForReview: (id) => api.get(`/admin/sheets/${id}`),
  approveSheet: (id, data) => api.put(`/admin/sheets/${id}/approve`, data),
  rejectSheet: (id, data) => api.put(`/admin/sheets/${id}/reject`, data),
  getPendingOrders: (params) => api.get('/admin/orders/pending', { params }),
  getOrderForReview: (id) => api.get(`/admin/orders/${id}`),
  verifyPayment: (id, data) => api.put(`/admin/orders/${id}/verify`, data),
  rejectPayment: (id, data) => api.put(`/admin/orders/${id}/reject`, data),
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

export default api;