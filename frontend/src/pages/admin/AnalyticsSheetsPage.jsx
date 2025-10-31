import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminAPI } from '../../services/api';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  CalendarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
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
  Legend,
  ArcElement
);

const AnalyticsSheetsPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDetailedChart, setShowDetailedChart] = useState(false);

  useEffect(() => {
    fetchSheetsAnalytics();
  }, []);

  const fetchSheetsAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSheetAnalytics();
      const result = res.data;
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sheets analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (metricType) => {
    setSelectedMetric(metricType);
    setShowDetailedChart(true);
  };

  const getDetailedChartData = () => {
    if (!selectedMetric || !data) return null;

    switch (selectedMetric) {
      case 'total':
        return {
          labels: data?.monthlyData?.map(item => item.month) || [],
          datasets: [
            {
              label: 'จำนวนชีททั้งหมด',
              data: data?.monthlyData?.map(item => item.count) || [],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
      case 'monthly':
        return {
          labels: data?.dailyData?.map(item => item.day) || [],
          datasets: [
            {
              label: 'ชีทใหม่ในเดือนนี้',
              data: data?.dailyData?.map(item => item.count) || [],
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }
          ]
        };
      case 'growth':
        return {
          labels: ['อนุมัติแล้ว', 'รออนุมัติ', 'ถูกปฏิเสธ'],
          datasets: [
            {
              data: [
                data?.approvedSheets || 0,
                data?.pendingSheets || 0,
                data?.rejectedSheets || 0
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderColor: [
                'rgb(34, 197, 94)',
                'rgb(251, 191, 36)',
                'rgb(239, 68, 68)'
              ],
              borderWidth: 1
            }
          ]
        };
      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (selectedMetric) {
      case 'total':
        return 'แนวโน้มชีททั้งหมด (12 เดือนล่าสุด)';
      case 'monthly':
        return 'ชีทที่อัพโหลดในเดือนนี้ (รายวัน)';
      case 'growth':
        return 'สัดส่วนสถานะชีท';
      default:
        return 'กราฟ';
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: getChartTitle()
      }
    },
    scales: selectedMetric !== 'growth' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    } : {}
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

  const detailedChartData = getDetailedChartData();

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
            กลับไปแดशบอร์ด
          </button>
          <h1 className="text-lg font-bold text-gray-900">สถิติชีท</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
              <DocumentDuplicateIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">สถิติชีท</h1>
              <p className="text-gray-600">วิเคราะห์ข้อมูลชีทและการอัพโหลด</p>
            </div>
          </div>
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Sheets Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('total')}
          >
            <div className="flex items-center gap-3 mb-2">
              <DocumentDuplicateIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">ชีททั้งหมด</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.totalSheets || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">คลิกเพื่อดูกราฟ</span>
            </div>
          </div>

          {/* Monthly Sheets Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('monthly')}
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">ในเดือนนี้</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.sheetsThisMonth || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUpIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600">คลิกเพื่อดูกราฟ</span>
            </div>
          </div>

          {/* Growth/Status Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleCardClick('growth')}
          >
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">สถานะชีท</h3>
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

        {/* Detailed Chart Modal/Section */}
        {showDetailedChart && detailedChartData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{getChartTitle()}</h2>
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
                  {selectedMetric === 'growth' ? (
                    <Doughnut data={detailedChartData} options={chartOptions} />
                  ) : selectedMetric === 'monthly' ? (
                    <Bar data={detailedChartData} options={chartOptions} />
                  ) : (
                    <Line data={detailedChartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">อนุมัติแล้ว:</span>
                      <span className="font-semibold text-green-600 ml-1">{data?.approvedSheets || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">รออนุมัติ:</span>
                      <span className="font-semibold text-yellow-600 ml-1">{data?.pendingSheets || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ถูกปฏิเสธ:</span>
                      <span className="font-semibold text-red-600 ml-1">{data?.rejectedSheets || 0}</span>
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

        {/* Recent Sheets Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">ชีทที่อัพโหลดล่าสุด</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.recentSheets?.map((sheet, index) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSheetsPage;