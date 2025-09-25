import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sellerAPI, getProfilePictureURL } from '../../services/api';
import SellerProductCard from '../../components/common/SellerProductCard';
import { 
  UserIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  PencilIcon,
  PlusIcon,
  ChartBarIcon,
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// Formatting and faculty color helpers are handled within child components

const SellerProfilePage = () => {
  const navigate = useNavigate();
  const { user, getCurrentUser, updateProfilePicture } = useAuth();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSheets: 0,
    totalRevenue: 0,
    totalDownloads: 0
  });
  const [sellerSheets, setSellerSheets] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // รูปโปรไฟล์น่ารักๆ ให้เลือก
  const cuteAvatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Rocky',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Cleo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucy'
  ];

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  // helpers moved to shared utils





  // No-op effect removed; keep hook list minimal

  const handleAvatarSelect = async (avatarUrl) => {
    try {
      setSelectedAvatarUrl(avatarUrl);
      
      // Convert URL to base64
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        setSelectedAvatar(base64Data);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading avatar:', error);
      toast.error('😔 ไม่สามารถโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('📸 รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Resize image to reduce size
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 500x500)
          const maxSize = 500;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to data URL with reduced quality
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setSelectedAvatar(resizedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedAvatar) {
      toast.error('📸 กรุณาเลือกรูปโปรไฟล์');
      return;
    }

    try {
      const result = await updateProfilePicture({ picture: selectedAvatar });
      
      if (result.success) {
        toast.success('🎉 อัปเดตรูปโปรไฟล์สำเร็จ');
        setShowProfileModal(false);
        setSelectedAvatar(null);
        setSelectedAvatarUrl(null);
        
        // Force refresh user data from server
        await getCurrentUser();
        
        // Debug: Check if user state is updated
        }
    } catch {
      toast.error('😔 ไม่สามารถอัปเดตรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fetchSellerProfile = async () => {
    try {
      setIsLoading(true);
      const response = await sellerAPI.getSellerProfile();
      setSellerProfile(response.data.data);
      
      // Fetch seller sheets for stats and display
      const sheetsResponse = await sellerAPI.getSellerSheets();
      const sheets = sheetsResponse.data.data || [];
      
      // Ensure sheets is an array before using reduce
      const sheetsArray = Array.isArray(sheets) ? sheets : [];
      setSellerSheets(sheetsArray);
      
      // Calculate total downloads from sheet orders (same method as ManageSheetsPage)
      const totalDownloads = sheetsArray
        .filter(sheet => sheet.status === 'APPROVED')
        .reduce((total, sheet) => total + (sheet.orders?.length || 0), 0);
      
      // Total downloads calculated
      
      // Calculate total revenue from orders
      let totalRevenue = 0;
      try {
        const revenueResponse = await sellerAPI.getSellerRevenue();
        if (revenueResponse.data?.success) {
          totalRevenue = revenueResponse.data.data?.total_revenue || 0;
        }
      } catch (revenueError) {
        console.error('❌ Error fetching revenue:', revenueError);
        // Fallback: calculate revenue from sheets if API fails
        totalRevenue = sheetsArray.reduce((sum, sheet) => {
          if (sheet.price && sheet.price > 0) {
            return sum + (sheet.price * (sheet.downloadCount || 0));
          }
          return sum;
        }, 0);
        }
      
      setStats({
        totalSheets: sheetsArray.length,
        totalRevenue: totalRevenue,
        totalDownloads: totalDownloads
      });
      
      } catch (error) {
      console.error('Error fetching seller profile:', error);
      toast.error('😔 ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลผู้ขาย</h1>
          <p className="text-gray-600 mb-6">กรุณาสมัครเป็นนักทำชีทสรุปก่อน</p>
          <button
            onClick={() => navigate('/seller')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            สมัครเป็นนักทำชีทสรุป
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
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
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            อัพโหลดชีท
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            จัดการชีทสรุปและดูสถิติการอัพโหลดชีทของคุณ
          </p>
        </div>



        {/* Profile Information */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="relative group">
              {/* Glowing Ring Effect */}
              <div className="absolute inset-0 w-[220px] h-[220px] bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
              
              <button 
                className="w-[196px] h-[196px] bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl animate-float overflow-hidden cursor-pointer relative z-10 border-4 border-white/20 backdrop-blur-sm"
                onClick={() => setShowProfileModal(true)}
                type="button"
              >
                {user?.picture ? (
                  <img 
                    src={getProfilePictureURL(user.picture)} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                    onLoad={() => {}}
                  />
                ) : (
                  <UserIcon className="w-24 h-24 text-white drop-shadow-lg" />
                )}
              </button>
              
              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
              
              {/* Online Status Indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg pointer-events-none border-2 border-white">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              {sellerProfile.penName}
            </h2>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-full text-purple-700 font-medium shadow-lg border border-purple-200/50 backdrop-blur-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 shadow-sm"></div>
              <span className="font-semibold">นักทำชีทสรุป</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/50 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">สถิติชีทสรุป</h3>
            {/* Gradient Divider */}
            <div className="w-16 h-1 mx-auto rounded-full hover:w-24 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group relative bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 p-6 rounded-2xl text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">ชีทสรุปทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalSheets}</p>
                  <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                    <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.totalSheets / 10) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-200 via-green-100 to-green-300 p-6 rounded-2xl text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">รายได้รวม</p>
                  <p className="text-3xl font-bold text-green-900">฿{stats.totalRevenue.toLocaleString()}</p>
                  <div className="w-full bg-green-200 rounded-full h-1 mt-2">
                    <div className="bg-green-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.totalRevenue / 10000) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-200 via-purple-100 to-purple-300 p-6 rounded-2xl text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200/50 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">ดาวน์โหลดรวม</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalDownloads}</p>

                  <div className="w-full bg-purple-200 rounded-full h-1 mt-2">
                    <div className="bg-purple-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats.totalDownloads / 100) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">จัดการชีทสรุป</h3>
            <div className="w-16 h-1 mx-auto rounded-full hover:w-24 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate('/seller/selledit')}
              className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-purple-400/30"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <PencilIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold">แก้ไขโปรไฟล์</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/seller/editSheet')}
              className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-blue-400/30"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <PlusIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold">สร้างชีทใหม่</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/seller/manage')}
              className="group relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-green-400/30"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold">จัดการชีท</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/seller/sellrev')}
              className="group relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-orange-400/30"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold">ประวัติรายได้</span>
              </div>
            </button>
          </div>
        </div>

        {/* Published Sheets */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ชีทสรุปที่เผยแพร่แล้ว</h3>
            <div className="w-16 h-1 mx-auto rounded-full hover:w-24 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>
          
          {sellerSheets.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                {/* Glowing Ring Effect */}
                <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
                
                <div className="relative w-24 h-24 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 rounded-full flex items-center justify-center mx-auto shadow-lg border border-gray-200/50">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                </div>
                
                {/* Animated Counter */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-white text-xs font-bold">0</span>
                </div>
              </div>
              
              <h4 className="text-xl font-semibold text-gray-700 mb-3">ยังไม่มีชีทสรุปที่เผยแพร่</h4>
              <p className="text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                เริ่มต้นสร้างชีทสรุปแรกของคุณและแบ่งปันความรู้กับชุมชนนักศึกษา
              </p>
              
              <button
                onClick={() => navigate('/seller/editSheet')}
                className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-blue-400/30"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <div className="relative flex items-center">
                  <PlusIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  สร้างชีทใหม่
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with count */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{sellerSheets.length}</span>
                  </div>
                  <span className="text-gray-600 font-medium">ชีทสรุปทั้งหมด</span>
                </div>
                <button
                  onClick={() => navigate('/seller/editSheet')}
                  className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-blue-400/30"
                >
                  <div className="relative flex items-center">
                    <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    สร้างชีทใหม่
                  </div>
                </button>
              </div>

              {/* Sheets Grid using SellerProductCard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {sellerSheets.map((sheet) => (
                  <SellerProductCard
                    key={sheet.id}
                    sheet={sheet}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Picture Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">เปลี่ยนรูปโปรไฟล์</h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedAvatar(null);
                    setSelectedAvatarUrl(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Upload Section */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">อัพโหลดรูปของคุณ</h4>
                <div className="flex justify-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors w-full max-w-md">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <CameraIcon className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปภาพ</p>
                      <p className="text-sm text-gray-500">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cute Avatars Section */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">เลือกรูปน่ารักๆ</h4>
                <div className="flex justify-center">
                  <div className="grid grid-cols-4 gap-4 max-w-md">
                    {cuteAvatars.map((avatar, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 rounded-full border-4 cursor-pointer transition-all duration-200 hover:scale-110 ${
                          selectedAvatarUrl === avatar ? 'border-purple-500 shadow-lg' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => handleAvatarSelect(avatar)}
                      >
                        <img
                          src={avatar}
                          alt={`Avatar ${index + 1}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {selectedAvatar && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">ตัวอย่างรูปที่เลือก</h4>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-purple-500 shadow-lg">
                      <img
                        src={selectedAvatar}
                        alt="Selected Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedAvatar(null);
                    setSelectedAvatarUrl(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={!selectedAvatar}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfilePage;