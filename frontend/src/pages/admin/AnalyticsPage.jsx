import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const { type } = useParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDetailedChart, setShowDetailedChart] = useState(false);

  useEffect(() => {
    if (type === 'users') {
      fetchUserAnalytics();
    } else if (type === 'sheets') {
      fetchSheetAnalytics();
    } else if (type === 'orders') {
      fetchOrderAnalytics();
    } else if (type === 'revenue') {
      fetchRevenueAnalytics();
    }
  }, [type]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');

      
      const response = await fetch('http://localhost:5000/api/admin/analytics/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's HTML (common when getting 404 or redirect)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint was not found or there was a redirect.`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Ensure response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response preview: ${textResponse.substring(0, 100)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('❌ API returned error:', result);
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('❌ Error fetching user analytics:', err);
      setError(err.message);
        } finally {
      setLoading(false);
    }
  };

  const fetchSheetAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');

      
      const response = await fetch('http://localhost:5000/api/admin/analytics/sheets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's HTML (common when getting 404 or redirect)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint was not found or there was a redirect.`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Ensure response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response preview: ${textResponse.substring(0, 100)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sheet analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');

      
      const response = await fetch('http://localhost:5000/api/admin/analytics/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's HTML (common when getting 404 or redirect)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint was not found or there was a redirect.`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Ensure response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response preview: ${textResponse.substring(0, 100)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching order analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');

      
      const response = await fetch('http://localhost:5000/api/admin/analytics/revenue', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's HTML (common when getting 404 or redirect)
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint was not found or there was a redirect.`);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Ensure response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response preview: ${textResponse.substring(0, 100)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching revenue analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (metricType) => {
    setSelectedMetric(metricType);
    setShowDetailedChart(true);
  };

  const getPageInfo = () => {
    switch (type) {
      case 'users':
        return {
          title: 'สถิติผู้ใช้',
          icon: UsersIcon,
          color: 'blue',
          description: 'วิเคราะห์ข้อมูลผู้ใช้และการลงทะเบียน'
        };
      case 'sheets':
        return {
          title: 'สถิติชีท',
          icon: DocumentDuplicateIcon,
          color: 'green',
          description: 'วิเคราะห์ข้อมูลชีทและการอัพโหลด'
        };
      case 'orders':
        return {
          title: 'สถิติคำสั่งซื้อ',
          icon: ShoppingCartIcon,
          color: 'purple',
          description: 'วิเคราะห์ข้อมูลคำสั่งซื้อและการชำระเงิน'
        };
      case 'revenue':
        return {
          title: 'สถิติรายได้',
          icon: BanknotesIcon,
          color: 'yellow',
          description: 'วิเคราะห์ข้อมูลรายได้และการเติบโต'
        };
      default:
        return {
          title: 'สถิติ',
          icon: ChartBarIcon,
          color: 'gray',
          description: 'วิเคราะห์ข้อมูลระบบ'
        };
    }
  };

  const pageInfo = getPageInfo();
  const Icon = pageInfo.icon;

  // Chart configurations
  const getChartData = () => {
    if (type === 'users') {
      return {
        monthly: {
          labels: data?.monthlyData?.map(item => item.month) || [],
          datasets: [
            {
              label: 'จำนวนผู้ใช้ใหม่',
              data: data?.monthlyData?.map(item => item.value) || [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        daily: {
          labels: data?.dailyData?.map(item => item.date) || [],
          datasets: [
            {
              label: 'ผู้ใช้ใหม่ต่อวัน',
              data: data?.dailyData?.map(item => item.value) || [],
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }
          ]
        }
      };
         } else if (type === 'sheets') {
       return {
         monthly: {
           labels: data?.monthlyData?.map(item => item.month) || [],
           datasets: [
             {
               label: 'จำนวนชีท',
               data: data?.monthlyData?.map(item => item.count) || [],
               borderColor: 'rgb(34, 197, 94)',
               backgroundColor: 'rgba(34, 197, 94, 0.1)',
               tension: 0.4,
               fill: true
             }
           ]
         },
         daily: {
           labels: data?.dailyData?.map(item => item.day) || [],
           datasets: [
             {
               label: 'จำนวนชีทต่อวัน',
               data: data?.dailyData?.map(item => item.count) || [],
               backgroundColor: 'rgba(34, 197, 94, 0.8)',
               borderColor: 'rgb(34, 197, 94)',
               borderWidth: 1
             }
           ]
         }
       };
           } else if (type === 'orders') {
        return {
          monthly: {
            labels: data?.monthlyData?.map(item => item.month) || [],
            datasets: [
              {
                label: 'จำนวนคำสั่งซื้อ',
                data: data?.monthlyData?.map(item => item.count) || [],
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          daily: {
            labels: data?.dailyData?.map(item => item.day) || [],
            datasets: [
              {
                label: 'จำนวนคำสั่งซื้อต่อวัน',
                data: data?.dailyData?.map(item => item.count) || [],
                backgroundColor: 'rgba(147, 51, 234, 0.8)',
                borderColor: 'rgb(147, 51, 234)',
                borderWidth: 1
              }
            ]
          }
        };
      } else if (type === 'revenue') {
        return {
          monthly: {
            labels: data?.monthlyData?.map(item => item.month) || [],
            datasets: [
              {
                label: 'รายได้รายเดือน',
                data: data?.monthlyData?.map(item => item.revenue) || [],
                borderColor: 'rgb(251, 191, 36)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          daily: {
            labels: data?.dailyData?.map(item => item.day) || [],
            datasets: [
              {
                label: 'รายได้รายวัน',
                data: data?.dailyData?.map(item => item.revenue) || [],
                backgroundColor: 'rgba(251, 191, 36, 0.8)',
                borderColor: 'rgb(251, 191, 36)',
                borderWidth: 1
              }
            ]
          }
        };
      }
    
    return { monthly: { labels: [], datasets: [] }, daily: { labels: [], datasets: [] } };
  };

  const chartData = getChartData();
  const monthlyChartData = chartData.monthly;
  const dailyChartData = chartData.daily;



  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: type === 'users' ? 'สถิติผู้ใช้' : type === 'sheets' ? 'สถิติชีท' : 'สถิติระบบ'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5
        }
      }
    }
  };



  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            กลับไปแดชบอร์ด
          </button>
          <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-xl bg-gradient-to-br from-${pageInfo.color}-100 to-${pageInfo.color}-200`}>
              <Icon className={`w-8 h-8 text-${pageInfo.color}-600`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pageInfo.title}</h1>
              <p className="text-gray-600">{pageInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('total')}
          >
            <div className="flex items-center gap-3 mb-2">
              {type === 'users' ? (
                <UsersIcon className="w-6 h-6 text-blue-600" />
              ) : type === 'sheets' ? (
                <DocumentDuplicateIcon className="w-6 h-6 text-green-600" />
              ) : type === 'orders' ? (
                <ShoppingCartIcon className="w-6 h-6 text-purple-600" />
              ) : (
                <BanknotesIcon className="w-6 h-6 text-yellow-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">รวมทั้งหมด</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {type === 'users' ? (data?.totalUsers || data?.total || 0) : 
               type === 'sheets' ? (data?.totalSheets || data?.total || 0) : 
               type === 'orders' ? (data?.totalOrders || data?.total || 0) : 
               type === 'revenue' ? `฿${(data?.totalRevenue || data?.total || 0).toLocaleString()}` : 
               (data?.total || 0)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ChartBarIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600">คลิกเพื่อดูกราฟ</span>
            </div>
          </div>

          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('monthly')}
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">ในเดือนนี้</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {type === 'users' ? (data?.usersThisMonth || data?.monthly || 0) : 
               type === 'sheets' ? (data?.sheetsThisMonth || data?.monthly || 0) : 
               type === 'orders' ? (data?.ordersThisMonth || data?.monthly || 0) : 
               type === 'revenue' ? `฿${(data?.revenueThisMonth || data?.monthly || 0).toLocaleString()}` : 
               (data?.monthly || 0)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <CalendarIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">คลิกเพื่อดูกราฟ</span>
            </div>
          </div>

          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('growth')}
          >
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">การเติบโต</h3>
            </div>
            <p className={`text-3xl font-bold ${data?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.growth >= 0 ? '+' : ''}{data?.growth || 0}%
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ChartBarIcon className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-600">คลิกเพื่อดูกราฟ</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                         <h3 className="text-xl font-bold text-gray-900 mb-6">
               {type === 'users' ? 'แนวโน้มผู้ใช้รายเดือน (6 เดือนล่าสุด)' : 
                type === 'sheets' ? 'แนวโน้มชีทรายเดือน (12 เดือนล่าสุด)' : 
                type === 'orders' ? 'แนวโน้มคำสั่งซื้อรายเดือน (12 เดือนล่าสุด)' : 
                type === 'revenue' ? 'แนวโน้มรายได้รายเดือน (12 เดือนล่าสุด)' : 
                'แนวโน้มรายเดือน (6 เดือนล่าสุด)'}
             </h3>
            <div className="h-80">
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          </div>

          {/* Daily Registration Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                         <h3 className="text-xl font-bold text-gray-900 mb-6">
               {type === 'users' ? 'การลงทะเบียนรายวัน (7 วันล่าสุด)' : 
                type === 'sheets' ? 'การอัพโหลดชีทรายวัน (30 วันล่าสุด)' : 
                type === 'orders' ? 'คำสั่งซื้อรายวัน (30 วันล่าสุด)' : 
                type === 'revenue' ? 'รายได้รายวัน (30 วันล่าสุด)' : 
                'ข้อมูลรายวัน (7 วันล่าสุด)'}
             </h3>
            <div className="h-80">
              <Bar data={dailyChartData} options={chartOptions} />
            </div>
          </div>
        </div>



        {/* Recent Data Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                     <h3 className="text-xl font-bold text-gray-900 mb-6">
             {type === 'users' ? 'ผู้ใช้ที่ลงทะเบียนล่าสุด' : 
              type === 'sheets' ? 'ชีทที่อัพโหลดล่าสุด' : 
              type === 'orders' ? 'คำสั่งซื้อล่าสุด' : 
              type === 'revenue' ? 'รายการรายได้ล่าสุด' : 
              'ข้อมูลล่าสุด'}
           </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {type === 'users' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ใช้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        อีเมล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        บทบาท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่ลงทะเบียน
                      </th>
                    </>
                  ) : type === 'sheets' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อชีท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้อัพโหลด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่อัพโหลด
                      </th>
                    </>
                                     ) : type === 'orders' ? (
                     <>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         ผู้ซื้อ
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         ชื่อชีท
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         สถานะ
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         วันที่สั่งซื้อ
                       </th>
                     </>
                   ) : type === 'revenue' ? (
                     <>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         ผู้ซื้อ
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         ชื่อชีท
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         จำนวนเงิน
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         วันที่
                       </th>
                     </>
                   ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ข้อมูล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รายละเอียด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {type === 'users' ? (
                  data?.recentUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.picture ? (
                              <img
                                src={user.picture}
                                alt={user.fullName || 'User'}
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                user.picture ? 'hidden' : 'flex'
                              } ${
                                user.role === 'ADMIN' ? 'bg-red-100' :
                                user.role === 'SELLER' ? 'bg-green-100' :
                                'bg-blue-100'
                              }`}
                            >
                              <UserGroupIcon className={`w-5 h-5 ${
                                user.role === 'ADMIN' ? 'text-red-600' :
                                user.role === 'SELLER' ? 'text-green-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || 'ไม่ระบุชื่อ'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'SELLER' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'ADMIN' ? 'แอดมิน' :
                           user.role === 'SELLER' ? 'ผู้ขาย' :
                           'ผู้ใช้ทั่วไป'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.time}
                      </td>
                    </tr>
                  ))
                ) : type === 'sheets' ? (
                  data?.recentSheets?.map((sheet, index) => (
                    <tr key={sheet.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sheet.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {sheet.seller?.user?.fullName || 'ไม่ระบุ'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sheet.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800'
                            : sheet.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sheet.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                           sheet.status === 'PENDING' ? 'รออนุมัติ' :
                           sheet.status === 'REJECTED' ? 'ถูกปฏิเสธ' : sheet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sheet.createdAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))
                                 ) : type === 'orders' ? (
                   data?.recentOrders?.map((order, index) => (
                     <tr key={order.id || index} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10">
                             {order.user?.picture ? (
                               <img
                                 src={order.user.picture}
                                 alt={order.user.fullName || 'User'}
                                 className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                   e.target.nextSibling.style.display = 'flex';
                                 }}
                               />
                             ) : null}
                             <div 
                               className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                 order.user?.picture ? 'hidden' : 'flex'
                               } bg-blue-100`}
                             >
                               <UserGroupIcon className="w-5 h-5 text-blue-600" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm text-gray-900">
                               {order.user?.fullName || 'ไม่ระบุ'}
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.sheet?.title || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                           order.status === 'PENDING' ? 'รอดำเนินการ' :
                           order.status === 'CANCELLED' ? 'ยกเลิก' : order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))
                                 ) : type === 'revenue' ? (
                   data?.recentTransactions?.map((transaction, index) => (
                     <tr key={transaction.id || index} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10">
                             {transaction.user?.picture ? (
                               <img
                                 src={transaction.user.picture}
                                 alt={transaction.user.fullName || 'User'}
                                 className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                   e.target.nextSibling.style.display = 'flex';
                                 }}
                               />
                             ) : null}
                             <div 
                               className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                 transaction.user?.picture ? 'hidden' : 'flex'
                               } bg-blue-100`}
                             >
                               <UserGroupIcon className="w-5 h-5 text-blue-600" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm text-gray-900">
                               {transaction.user?.fullName || 'ไม่ระบุ'}
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.sheet?.title || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ฿{transaction.amount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Chart Modal */}
        {showDetailedChart && selectedMetric && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedMetric === 'total' 
                    ? `กราฟแนวโน้ม${type === 'users' ? 'ผู้ใช้' : type === 'sheets' ? 'ชีท' : type === 'orders' ? 'คำสั่งซื้อ' : 'รายได้'}ทั้งหมด`
                    : selectedMetric === 'monthly'
                    ? `กราฟ${type === 'users' ? 'ผู้ใช้' : type === 'sheets' ? 'ชีท' : type === 'orders' ? 'คำสั่งซื้อ' : 'รายได้'}ในเดือนนี้`
                    : `กราฟการเติบโต${type === 'users' ? 'ผู้ใช้' : type === 'sheets' ? 'ชีท' : type === 'orders' ? 'คำสั่งซื้อ' : 'รายได้'}`
                  }
                </h2>
                <button
                  onClick={() => setShowDetailedChart(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                <div className="h-96">
                  {selectedMetric === 'monthly' ? (
                    <Bar data={dailyChartData} options={chartOptions} />
                  ) : (
                    <Line data={monthlyChartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">รวมทั้งหมด:</span>
                      <span className="font-semibold text-blue-600 ml-1">
                        {type === 'users' ? (data?.totalUsers || data?.total || 0) : 
                         type === 'sheets' ? (data?.totalSheets || data?.total || 0) : 
                         type === 'orders' ? (data?.totalOrders || data?.total || 0) : 
                         type === 'revenue' ? `฿${(data?.totalRevenue || data?.total || 0).toLocaleString()}` : 
                         (data?.total || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ในเดือนนี้:</span>
                      <span className="font-semibold text-green-600 ml-1">
                        {type === 'users' ? (data?.usersThisMonth || data?.monthly || 0) : 
                         type === 'sheets' ? (data?.sheetsThisMonth || data?.monthly || 0) : 
                         type === 'orders' ? (data?.ordersThisMonth || data?.monthly || 0) : 
                         type === 'revenue' ? `฿${(data?.revenueThisMonth || data?.monthly || 0).toLocaleString()}` : 
                         (data?.monthly || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">การเติบโต:</span>
                      <span className={`font-semibold ml-1 ${data?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data?.growth >= 0 ? '+' : ''}{data?.growth || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
