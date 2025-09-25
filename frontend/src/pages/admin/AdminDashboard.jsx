import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminSidebar from '../../components/common/AdminSidebar';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,


  ExclamationTriangleIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon,
  UsersIcon,
  CreditCardIcon,
  ShieldCheckIcon,

  DocumentDuplicateIcon,
  BanknotesIcon,
  CalendarDaysIcon,

  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  AcademicCapIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,


  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import { adminAPI } from '../../services/api';
import UserManagement from '../../components/admin/UserManagement';
import ManageSheetsPage from './ManageSheetsPage';
import toast from 'react-hot-toast';

// Smooth animations helpers
const customStyles = `
  @keyframes fadeInUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .animate-fadeInUp { animation: fadeInUp .6s ease-out both; will-change: transform, opacity; }
  .transition-smooth { transition: all .25s ease; }
`;
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.innerText = customStyles;
  document.head.appendChild(styleEl);
}

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Removed unused getActiveTabFromPath (routing handled by separate pages)
  
  // Removed activeTab - now handled by separate admin pages
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalSheets: 0,
      totalOrders: 0,
      totalRevenue: 0,
      monthlyUsers: 0,
      monthlySheets: 0,
      monthlyOrders: 0,
      monthlyRevenue: 0
    },
    recentActivities: [],
    recentSheets: [],
    systemHealth: {
      general: 'online',
      database: 'online',
      storage: 'online',
      api: 'online'
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const response = await adminAPI.getDashboardStats();
      
      if (response?.data?.success && response.data.data) {
        const data = response.data.data;
        
        // Format recent activities with relative time
        const formattedActivities = (data.recentActivities || []).map(activity => ({
          ...activity,
          time: formatRelativeTime(activity.createdAt || activity.time || new Date())
        }));
        
        setDashboardData({
          stats: {
            totalUsers: data.totalUsers || 0,
            totalSheets: data.totalSheets || 0,
            totalOrders: data.totalOrders || 0,
            totalRevenue: data.totalRevenue || 0,
            monthlyUsers: data.monthlyUsers || 0,
            monthlySheets: data.monthlySheets || 0,
            monthlyOrders: data.monthlyOrders || 0,
            monthlyRevenue: data.monthlyRevenue || 0
          },
          recentActivities: formattedActivities,
          recentSheets: data.recentSheets || [],
          systemHealth: {
            general: 'online',
            database: 'online',
            storage: 'online',
            api: 'online'
          }
        });
      } else {
        throw new Error('Invalid response data structure');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Show error toast only if it's not a network error
      if (error.response?.status !== 401) {
        toast.error('เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้ กำลังใช้ข้อมูลตัวอย่าง');
      }
      
      // Fallback to mock data if API fails
      setDashboardData({
        stats: {
          totalUsers: 125,
          totalSheets: 45,
          totalOrders: 235,
          totalRevenue: 18500,
          monthlyUsers: 23,
          monthlySheets: 8,
          monthlyOrders: 42,
          monthlyRevenue: 3200
        },
        recentActivities: [
          {
            id: 1,
            type: 'user_register',
            message: 'ผู้ใช้ใหม่สมัครสมาชิก',
            user: 'นักศึกษามใหม่',
            createdAt: new Date().toISOString()
          }
        ],
        recentSheets: [],
        systemHealth: {
          general: 'online',
          database: 'online',
          storage: 'online',
          api: 'online'
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle URL redirects
  useEffect(() => {
    // Redirect /admin to /admin/dashboard
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Early returns after hooks to satisfy rules-of-hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Dashboard</p>
          <p className="text-sm text-gray-500 mb-4">User: {user?.email} | Role: {user?.role}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">กลับหน้าแรก</button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    // ป้องกัน NaN
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'เมื่อสักครู่';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} วันที่แล้ว`;
    }
  };

  // Removed getActivityIcon and getActivityMessage (not used in current UI)

  const StatCard = ({ title, value, change, icon, color = "purple", onClick, delay = 0 }) => {
    const IconComponent = icon;
    return (
      <div 
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-smooth hover:-translate-y-1 relative animate-fadeInUp ${
          onClick ? 'cursor-pointer hover:scale-105' : ''
        }`}
        onClick={onClick}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200`}>
                <IconComponent className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {title === 'รายได้รวม' ? formatCurrency(value) : formatNumber(value)}
              </div>
            {change !== undefined && change > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span>{title === 'รายได้รวม' ? formatCurrency(change) : formatNumber(change)} {title === 'รายได้รวม' ? 'ในเดือนนี้' : 'รายการใหม่ ในเดือนนี้'}</span>
              </div>
            )}
            {change !== undefined && change === 0 && (
              <div className="text-sm text-gray-500">
                ไม่มีรายการใหม่ในเดือนนี้
              </div>
            )}
            {change === undefined && (
              <div className="text-sm text-gray-500">
                กำลังโหลดข้อมูล...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white p-8 animate-fadeInUp" style={{animationDelay:'200ms'}}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 animate-fadeInUp" style={{animationDelay:'260ms'}}>ยินดีต้อนรับ {user?.fullName || user?.email}</h1>
            <p className="text-purple-100 text-lg animate-fadeInUp" style={{animationDelay:'320ms'}}>แดชบอร์ดผู้ดูแลระบบ KU Sheet</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold animate-fadeInUp" style={{animationDelay:'380ms'}}>{new Date().toLocaleDateString('th-TH')}</div>
            <div className="text-purple-200 animate-fadeInUp" style={{animationDelay:'440ms'}}>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="ผู้ใช้ทั้งหมด"
          value={dashboardData.stats.totalUsers}
          change={dashboardData.stats.monthlyUsers}
          icon={UsersIcon}
          color="blue"
          onClick={() => navigate('/admin/analytics/users')}
          delay={400}
        />
        <StatCard 
          title="ชีททั้งหมด"
          value={dashboardData.stats.totalSheets}
          change={dashboardData.stats.monthlySheets}
          icon={DocumentDuplicateIcon}
          color="green"
          onClick={() => navigate('/admin/analytics/sheets')}
          delay={520}
        />
        <StatCard 
          title="คำสั่งซื้อ"
          value={dashboardData.stats.totalOrders}
          change={dashboardData.stats.monthlyOrders}
          icon={ShoppingCartIcon}
          color="purple"
          onClick={() => navigate('/admin/analytics/orders')}
          delay={640}
        />
        <StatCard 
          title="รายได้รวม"
          value={dashboardData.stats.totalRevenue}
          change={dashboardData.stats.monthlyRevenue}
          icon={BanknotesIcon}
          color="yellow"
          onClick={() => navigate('/admin/analytics/revenue')}
          delay={760}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeInUp" style={{animationDelay:'900ms'}}>
        {/* Recent Sheet Uploads */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fadeInUp" style={{animationDelay:'980ms'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">การอัพโหลดชีทล่าสุด</h3>
              <button 
                onClick={() => navigate('/admin/sheets')}
                className="text-purple-600 hover:text-purple-700 font-medium transition-smooth"
              >
                ดูทั้งหมด
              </button>
            </div>
            <div className="space-y-4">
              {dashboardData.recentSheets && dashboardData.recentSheets.length > 0 ? (
                dashboardData.recentSheets.map((sheet, idx) => (
                  <div key={sheet.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-smooth animate-fadeInUp" style={{animationDelay: `${1000 + idx*100}ms`}}>
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{sheet.title}</p>
                      <p className="text-gray-500 text-sm">โดย {sheet.seller?.user?.fullName || sheet.seller?.user?.email || 'ไม่ทราบ'}</p>
                      <p className="text-gray-400 text-xs">{formatRelativeTime(sheet.createdAt)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sheet.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800' 
                        : sheet.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sheet.status === 'APPROVED' ? 'เสร็จสิ้น' : 
                       sheet.status === 'PENDING' ? 'รออนุมัติ' : 
                       'ถูกปฏิเสธ'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีชีทที่อัพโหลดในระบบ</p>
                </div>
                )}
            </div>
          </div>
        </div>

        {/* System Health & Quick Actions */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fadeInUp" style={{animationDelay:'1000ms'}}>
            <h3 className="text-xl font-bold text-gray-900 mb-6">สถานะระบบ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ระบบทั่วไป</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">ปกติ</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ฐานข้อมูล</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">เชื่อมต่อ</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ที่เก็บไฟล์</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">พร้อมใช้งาน</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">ทำงานปกติ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fadeInUp" style={{animationDelay:'1100ms'}}>
            <h3 className="text-xl font-bold text-gray-900 mb-6">การดำเนินการด่วน</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-smooth"
              >
                <UserGroupIcon className="w-5 h-5" />
                <span className="font-medium">จัดการผู้ใช้</span>
              </button>
              <button 
                onClick={() => navigate('/admin/sheets')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-smooth"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span className="font-medium">อนุมัติชีท</span>
              </button>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-smooth"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                <span className="font-medium">ตรวจสอบการชำระเงิน</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Removed renderComingSoon (not used)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8">
            {renderOverview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;