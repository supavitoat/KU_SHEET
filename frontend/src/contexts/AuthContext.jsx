import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

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
        isFirstLogin: action.payload.user?.is_first_login || false,
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
        isFirstLogin: action.payload.is_first_login || false,
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

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: actionTypes.AUTH_SUCCESS,
          payload: { user: parsedUser, token },
        });
        
        // Verify token with server
        getCurrentUser();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: actionTypes.AUTH_FAILURE });
      }
    } else {
      dispatch({ type: actionTypes.AUTH_FAILURE });
    }
  }, []);

  // Get current user from server
  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data.data;
      
      dispatch({
        type: actionTypes.UPDATE_USER,
        payload: user,
      });
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.AUTH_START });
      
      const response = await authAPI.login(credentials);
      const { user, token, redirectPath } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('Login successful!');
      
      return { success: true, redirectPath };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: actionTypes.AUTH_START });
      
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('Registration successful!');
      
      return { success: true };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      const message = error.response?.data?.message || 'Registration failed';
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

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success('Google login successful!');
      
      return { success: true, redirectPath };
    } catch (error) {
      dispatch({ type: actionTypes.AUTH_FAILURE });
      const message = error.response?.data?.message || 'Google login failed';
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

      toast.success('Profile updated successfully!');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
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
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      dispatch({ type: actionTypes.LOGOUT });
      
      toast.success('Logged out successfully');
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
    return state.user?.role === 'admin';
  };

  // Check if user is seller
  const isSeller = () => {
    return state.user?.is_seller === true;
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    getCurrentUser,
    setFirstLogin,
    isAdmin,
    isSeller,
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
