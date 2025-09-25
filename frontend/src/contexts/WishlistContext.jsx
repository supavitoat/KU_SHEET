/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlistIds();
      if (response.data.success) {
        const wishlistIds = response.data.data.wishlistIds || [];
        setWishlist(new Set(wishlistIds));
      } else {
        setWishlist(new Set());
      }
    } catch (error) {
      console.error('❌ WishlistContext: Error loading wishlist:', error);
      setWishlist(new Set());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load wishlist on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setWishlist(new Set());
    }
  }, [isAuthenticated, loadWishlist]);

  const addToWishlist = async (sheetId) => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด');
      return false;
    }

    try {
      setLoading(true);
      const response = await wishlistAPI.addToWishlist(sheetId);
      if (response.data.success) {
        setWishlist(prev => new Set([...prev, sheetId]));
        toast.success('เพิ่มลงรายการโปรดสำเร็จ');
        return true;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการเพิ่มรายการโปรด');
      }
    } finally {
      setLoading(false);
    }
    return false;
  };

  const removeFromWishlist = async (sheetId) => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนลบรายการโปรด');
      return false;
    }

    try {
      setLoading(true);
      const response = await wishlistAPI.removeFromWishlist(sheetId);
      if (response.data.success) {
        setWishlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(sheetId);
          return newSet;
        });
        toast.success('ลบออกจากรายการโปรดสำเร็จ');
        return true;
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการลบรายการโปรด');
      }
    } finally {
      setLoading(false);
    }
    return false;
  };

  const toggleWishlist = async (sheetId) => {
    if (wishlist.has(sheetId)) {
      return await removeFromWishlist(sheetId);
    } else {
      return await addToWishlist(sheetId);
    }
  };

  const isInWishlist = (sheetId) => {
    return wishlist.has(sheetId);
  };

  const getWishlistCount = () => {
    return wishlist.size;
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    loadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}; 