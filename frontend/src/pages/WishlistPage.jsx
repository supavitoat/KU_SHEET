import React, { useState, useEffect, useCallback } from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { sheetsAPI, ordersAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
// helpers provided internally by ProductCard now
// Removed unused imports

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [wishlistSheets, setWishlistSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasedSheets, setPurchasedSheets] = useState(new Set());

  const checkPurchasedSheets = useCallback(async () => {
    try {
      // ดึงข้อมูลชีทที่ซื้อแล้ว
      const response = await ordersAPI.getUserPurchasedSheets();
      if (response.data.success) {
        const purchasedIds = new Set(response.data.data.sheets.map(sheet => sheet.id));
        setPurchasedSheets(purchasedIds);
      }
    } catch (error) {
      console.error('Error checking purchased sheets:', error);
    }
  }, []);

  const loadWishlistSheets = useCallback(async () => {
    try {
      setLoading(true);
      
      // ถ้าไม่มีรายการโปรด
      if (wishlist.size === 0) {
        setWishlistSheets([]);
        setPurchasedSheets(new Set());
        return;
      }

      // ใช้ fallback method - ดึงข้อมูลชีททีละตัว
      const wishlistIds = Array.from(wishlist);
      const sheets = [];
      
      for (const sheetId of wishlistIds) {
        try {
          const response = await sheetsAPI.getSheetById(sheetId);
          if (response.data.success) {
            // ใช้ response.data.data.sheet แทน response.data.data
            const sheetData = response.data.data.sheet || response.data.data;
            
            // เพิ่มข้อมูลคะแนนดาวและจำนวนรีวิว
            if (sheetData.id) {
              try {
                const statsResponse = await sheetsAPI.getSheetStats(sheetData.id);
                if (statsResponse.data.success) {
                  sheetData.avgRating = statsResponse.data.data.avgRating || 0;
                  sheetData.reviewCount = statsResponse.data.data.reviewCount || 0;
                  sheetData.downloadCount = statsResponse.data.data.downloadCount || 0;
                }
              } catch (statsError) {
                console.error(`Error fetching stats for sheet ${sheetData.id}:`, statsError);
                // ใช้ค่าเริ่มต้นถ้าไม่สามารถดึงข้อมูลได้
                sheetData.avgRating = 0;
                sheetData.reviewCount = 0;
                sheetData.downloadCount = 0;
              }
            }
            
            sheets.push(sheetData);
          }
        } catch (error) {
          console.error(`Error fetching sheet ${sheetId}:`, error);
        }
      }
      
      setWishlistSheets(sheets);
      
      // เช็คชีทที่ซื้อแล้ว
  await checkPurchasedSheets();
      
    } catch (error) {
      console.error('Error loading wishlist sheets:', error);
      setWishlistSheets([]);
    } finally {
      setLoading(false);
    }
  }, [wishlist, checkPurchasedSheets]);

  useEffect(() => {
    if (isAuthenticated && !wishlistLoading) {
      loadWishlistSheets();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, wishlist, wishlistLoading, loadWishlistSheets]);

  // helpers moved to shared utils

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">เข้าสู่ระบบเพื่อดูรายการโปรด</h1>
          <p className="text-gray-600 mb-8 text-lg">เก็บชีทที่คุณชอบไว้ในรายการโปรด และเข้าถึงได้ทุกเมื่อ</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="w-full bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300"
            >
              สมัครสมาชิกใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">กำลังโหลดรายการโปรด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fadeInUp animation-delay-200">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent animate-fadeInUp animation-delay-300">
                รายการโปรด
              </h1>
              <p className="text-gray-600 text-lg mt-2 animate-fadeInUp animation-delay-400">
                รายการชีทที่คุณชื่นชอบและเก็บไว้
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-fadeInUp animation-delay-500">
          {/* Wishlist Content */}
          {wishlistSheets.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto animate-fadeInUp animation-delay-600">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">ยังไม่มีรายการโปรด</h2>
                <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                  กดปุ่มหัวใจในชีทที่คุณชื่นชอบ<br />
                  เราจะเก็บไว้ให้คุณในรายการโปรดนี้
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => window.location.href = '/shop'}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-smooth shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    ดูชีททั้งหมด
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8 animate-fadeInUp animation-delay-600">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">ชีทในรายการโปรด</h2>
                  <p className="text-gray-600 mt-1">คุณมี {Array.isArray(wishlist) ? wishlist.length : (wishlist?.size ?? 0)} รายการในรายการโปรด</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => window.location.href = '/shop'}
                    className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold border-2 border-purple-600 hover:bg-purple-50 transition-smooth flex items-center gap-2"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    ดูชีทเพิ่มเติม
                  </button>
                </div>
              </div>

              {/* Grid View */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {wishlistSheets.map((sheet, index) => (
                  <ProductCard
                    key={sheet.id || `wishlist-sheet-${index}`}
                    sheet={{...sheet, userHasPurchased: purchasedSheets.has(sheet.id)}}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 100 + 700}ms` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp .6s ease-out both; will-change: transform, opacity; }
        .transition-smooth { transition: all .25s ease; }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default WishlistPage; 