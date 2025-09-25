/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { clearTempRegistration, clearExpiredTempRegistration } from '../utils/localStorage';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isFirstLogin: false,
};

// Action types
const actionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_FIRST_LOGIN: 'SET_FIRST_LOGIN',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.AUTH_START:
      return {
        ...state,
        isLoading: true,
      };
    case actionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        isFirstLogin: action.payload.user?.isFirstLogin ?? action.payload.user?.is_first_login ?? false,
      };
    case actionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isFirstLogin: false,
      };
    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isFirstLogin: action.payload.isFirstLogin ?? action.payload.is_first_login ?? false,
      };
    case actionTypes.SET_FIRST_LOGIN:
      return {
        ...state,
        isFirstLogin: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Get current user from server
  const getCurrentUser = React.useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      // รองรับทั้งกรณี response.data.data.user (object ซ้อน) และ response.data.data (object ตรง)
      const user = response.data.data?.user || response.data.data;
      
      if (user) {
        // Only update if there are actual changes to prevent unnecessary re-renders
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const hasChanges = JSON.stringify(currentUser) !== JSON.stringify(user);
        
        if (hasChanges) {
          dispatch({
            type: actionTypes.UPDATE_USER,
            payload: user,
          });
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Don't automatically logout on 401, let the API interceptor handle it
      // This prevents double logout and infinite loops
    }
  }, []);

  // Check for existing token on app load
  useEffect(() => {
    // Clear expired tempRegistration
    clearExpiredTempRegistration();
    
    // ถ้ามี tempRegistration แปลว่ายังไม่กรอก infoEnter ห้ามถือว่า login สำเร็จ
    if (localStorage.getItem('tempRegistration')) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      return;
    }
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        
        
        
        // Check if token is expired (if token has expiration time)
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        if (tokenExpiration && new Date() > new Date(tokenExpiration)) {
          // localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiration');
          dispatch({ type: actionTypes.AUTH_FAILURE });
          return;
        }
        
        dispatch({
          type: actionTypes.AUTH_SUCCESS,
          payload: { user: parsedUser, token },
        });
        // Verify token with server, but don't override local data immediately
        // Only update if server has newer data
    getCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiration');
        dispatch({ type: actionTypes.AUTH_FAILURE });
      }
    } else {
      dispatch({ type: actionTypes.AUTH_FAILURE });
    }
  }, [getCurrentUser]);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.AUTH_START });
      
      const response = await authAPI.login(credentials);
      const { user, token, redirectPath } = response.data.data;

      // // Clear any existing tempRegistration to prevent conflicts
      clearTempRegistration();

      // Clear old cart data when logging in as new user
  // Cart will react to user change via localStorage listener in CartContext

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Set token expiration (24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
      localStorage.setItem('tokenExpiration', expirationTime.toISOString());

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('🎉 ยินดีต้อนรับ! เข้าสู่ระบบสำเร็จแล้ว');
      
      return { success: true, redirectPath };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      let message = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      
      // แปลงข้อความ error ให้เหมาะสม
      if (message === 'Validation failed' || message === 'กรุณากรอกข้อมูลให้ครบถ้วน') {
        message = 'อีเมลไม่ถูกต้อง';
      } else if (message.includes('รูปแบบอีเมลไม่ถูกต้อง') || message.includes('Please provide a valid email')) {
        message = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (message.includes('กรุณากรอกอีเมล') || message.includes('email is required')) {
        message = 'กรุณากรอกอีเมล';
      } else if (message.includes('ไม่พบผู้ใช้') || message.includes('user not found') || message.includes('ยังไม่ได้สมัครสมาชิก')) {
        message = 'อีเมลไม่ถูกต้อง';
      } else if (message.includes('รหัสผ่านไม่ถูกต้อง') || message.includes('password')) {
        message = 'รหัสผ่านไม่ถูกต้อง';
      } else if (message.includes('กรุณากรอกรหัสผ่าน') || message.includes('password is required')) {
        message = 'กรุณากรอกรหัสผ่าน';
      } else if (message.includes('รหัสผ่านต้องมีอย่างน้อย')) {
        message = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      } else if (message.includes('กรุณาเลือกรูปโปรไฟล์')) {
        message = 'กรุณาเลือกรูปโปรไฟล์';
      } else if (message.includes('รูปภาพมีขนาดใหญ่เกินไป')) {
        message = 'รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)';
      } else if (message.includes('รูปแบบรูปภาพไม่ถูกต้อง')) {
        message = 'รูปแบบรูปภาพไม่ถูกต้อง';
      }
      
      // toast.error(message); // ลบ toast
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: actionTypes.AUTH_START });
      
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      // // Clear any existing tempRegistration to prevent conflicts
      clearTempRegistration();

      // Clear old cart data when registering as new user
  // Cart will react to user change via localStorage listener in CartContext
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Set token expiration (24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
      localStorage.setItem('tokenExpiration', expirationTime.toISOString());

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('🎉 ยินดีด้วย! สมัครสมาชิกสำเร็จแล้ว');
      
      return { success: true };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      const message = error.response?.data?.message || '😔 สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Google authentication
  const googleLogin = async (googleData) => {
    try {
      dispatch({ type: actionTypes.AUTH_START });
      
      const response = await authAPI.googleAuth(googleData);
      const { user, token, redirectPath } = response.data.data;

      // // Clear any existing tempRegistration to prevent conflicts
      clearTempRegistration();

      // Clear old cart data when logging in with Google as new user
  // Cart will react to user change via localStorage listener in CartContext
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set token expiration (24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);
      localStorage.setItem('tokenExpiration', expirationTime.toISOString());


      
      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('🎉 ยินดีต้อนรับ! เข้าสู่ระบบด้วย Google สำเร็จแล้ว');
      
      return { success: true, redirectPath };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      const message = error.response?.data?.message || '😔 เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data;

      dispatch({
        type: actionTypes.UPDATE_USER,
        payload: updatedUser,
      });

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // toast.success('อัปเดตโปรไฟล์สำเร็จ');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '😔 อัปเดตโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update profile picture function
  const updateProfilePicture = async (pictureData) => {
    try {
      const response = await authAPI.updateProfilePicture(pictureData);
      const updatedUser = response.data.data.user;

      dispatch({
        type: actionTypes.UPDATE_USER,
        payload: updatedUser,
      });

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '😔 อัปเดตรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear cart for current user before clearing localStorage
      if (state.user?.id) {
        // Cart will react to user change via localStorage listener in CartContext
      }
      
      // Also clear any guest cart data when logging out
      try {
        localStorage.removeItem('cart_guest');
      } catch {
        /* ignore */
      }
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiration');
      clearTempRegistration();

      dispatch({ type: actionTypes.LOGOUT });
      
      toast.success('👋 ขอบคุณที่ใช้งาน! ออกจากระบบสำเร็จแล้ว');
    }
  };

  // Set first login status
  const setFirstLogin = (status) => {
    dispatch({
      type: actionTypes.SET_FIRST_LOGIN,
      payload: status,
    });
  };

  // Check if user is admin
  const isAdmin = () => {
    if (!state.user) return false;
    
    // Check if user role is ADMIN
    if (state.user.role === 'ADMIN' || state.user.role === 'admin') {
      return true;
    }
    
    // Check if user email is in admin emails list
    const adminEmails = ['thoz01@gmail.com']; // เพิ่ม email admin ที่นี่
    return adminEmails.includes(state.user.email);
  };

  // Check if user is seller
  const isSeller = () => {
    return state.user?.isSeller || state.user?.is_seller || false;
  };

  // เพิ่มฟังก์ชันสำหรับ sync ข้อมูล seller profile
  const syncSellerProfile = async () => {
    try {
      if (!state.isAuthenticated || !isSeller()) {
        return null;
      }
      
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        const userData = response.data.data;
        dispatch({ type: actionTypes.UPDATE_USER, payload: userData });
        return userData;
      }
    } catch (error) {
      console.error('Error syncing seller profile:', error);
    }
    return null;
  };

  // เพิ่มฟังก์ชันสำหรับอัพเดทข้อมูลธนาคาร
  const updateBankInfo = async (bankData) => {
    try {
      if (!state.isAuthenticated || !isSeller()) {
        throw new Error('User is not authenticated or not a seller');
      }
      
      // อัพเดทข้อมูลใน AuthContext
      dispatch({ 
        type: actionTypes.UPDATE_USER, 
        payload: { 
          ...state.user,
          bankInfo: bankData 
        } 
      });
      
      return true;
    } catch (error) {
      console.error('Error updating bank info:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    updateProfilePicture,
    getCurrentUser,
    setFirstLogin,
    isAdmin,
    isSeller,
    syncSellerProfile,
    updateBankInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
