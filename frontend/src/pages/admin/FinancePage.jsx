import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LoadingSpinner, 
  formatCurrency, 
  formatDate
} from '../../utils/adminUtils';

import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MinusIcon,
  CalculatorIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const FinancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Financial Data
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalPayout: 0,
    pendingPayout: 0,
    thisMonthRevenue: 0,
    thisMonthCommission: 0,
    thisMonthPayout: 0
  });
  
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  


  useEffect(() => {
    fetchFinanceData();
    fetchSystemSettings();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      const response = await adminAPI.getFinanceStats();
      if (response.data.success) {
        setFinancialStats(response.data.data);
      }
      
      const payoutResponse = await adminAPI.getPendingPayouts();
      if (payoutResponse.data.success) {
        setPendingPayouts(payoutResponse.data.data);
      }
      
      
      const historyResponse = await adminAPI.getPayoutHistory();
      if (historyResponse.data.success) {
        setPayoutHistory(historyResponse.data.data);
      }
      
    } catch (error) {
      console.error('❌ Error fetching finance data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await adminAPI.getSettings();
      if (response.data.success) {
        setCommissionRate(response.data.data.commissionRate || 15);
        setPayoutSchedule(response.data.data.payoutSchedule || 'weekly');
      }
    } catch (error) {
      console.error('❌ Error fetching system settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchFinanceData();
    setRefreshing(false);
    toast.success('อัพเดทข้อมูลเรียบร้อย');
  };

  const updateCommissionRate = async () => {
    try {
      // Validate commission rate
      if (commissionRate === '' || commissionRate < 0 || commissionRate > 100) {
        toast.error('กรุณากรอกอัตราค่าคอมมิชชันระหว่าง 0-100%');
        return;
      }

      setSettingsLoading(true);
      const response = await adminAPI.updateSettings({
        commissionRate: commissionRate
      });
      
      if (response.data.success) {
        toast.success('อัพเดทอัตราค่าคอมมิชชันเรียบร้อย');
      } else {
        throw new Error(response.data.message || 'Failed to update commission rate');
      }
    } catch (error) {
      console.error('❌ Error updating commission rate:', error);
      toast.error('ไม่สามารถอัพเดทอัตราค่าคอมมิชชันได้');
    } finally {
      setSettingsLoading(false);
    }
  };

  const updatePayoutSchedule = async () => {
    try {
      setSettingsLoading(true);
      const response = await adminAPI.updateSettings({
        payoutSchedule: payoutSchedule
      });
      
      if (response.data.success) {
        toast.success('อัพเดทตารางการโอนเงินเรียบร้อย');
      } else {
        throw new Error(response.data.message || 'Failed to update payout schedule');
      }
    } catch (error) {
      console.error('❌ Error updating payout schedule:', error);
      toast.error('ไม่สามารถอัพเดทตารางการโอนเงินได้');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProcessPayout = (payoutId) => {
    // Navigate to payout page instead of processing directly
    navigate(`/admin/payout/${payoutId}`);
  };

  // System Settings
  const [commissionRate, setCommissionRate] = useState(15);
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');
  const [settingsLoading, setSettingsLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'กำลังอัพเดท...' : 'อัพเดทข้อมูล'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">รายได้รวม</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financialStats.totalRevenue)}</p>
              <p className="text-sm text-gray-600 mt-2">เดือนนี้: {formatCurrency(financialStats.thisMonthRevenue)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BanknotesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ค่าคอมมิชชัน</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(financialStats.totalCommission)}</p>
              <p className="text-sm text-gray-600 mt-2">เดือนนี้: {formatCurrency(financialStats.thisMonthCommission)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <CreditCardIcon className="w-6 h-6 text-purple-600" />
                </div>
                <ArrowTrendingDownIcon className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">โอนเงินแล้ว</h3>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(financialStats.totalPayout)}</p>
              <p className="text-sm text-gray-600 mt-2">เดือนนี้: {formatCurrency(financialStats.thisMonthPayout)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">รอโอนเงิน</h3>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(financialStats.pendingPayout)}</p>
              <p className="text-sm text-gray-600 mt-2">รอการโอนเงิน (หลังหักค่าคอมมิชชัน)</p>
            </div>
          </div>

          {/* Commission Settings */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">ตั้งค่าค่าคอมมิชชัน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัตราค่าคอมมิชชัน (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    placeholder="กรอกอัตราค่าคอมมิชชัน"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setCommissionRate('');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                          setCommissionRate(numValue);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={updateCommissionRate}
                    disabled={settingsLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {settingsLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">ค่าคอมมิชชันที่หักจากรายได้ของเจ้าของชีท</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ตารางการโอนเงิน
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={payoutSchedule}
                    onChange={(e) => setPayoutSchedule(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="weekly">รายสัปดาห์</option>
                    <option value="monthly">รายเดือน</option>
                  </select>
                  <button
                    onClick={updatePayoutSchedule}
                    disabled={settingsLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {settingsLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">ความถี่ในการโอนเงินให้เจ้าของชีท</p>
              </div>
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">รายการรอโอนเงิน</h3>
            </div>
            
                          {pendingPayouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">เจ้าของชีท</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">ข้อมูลธนาคาร</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">จำนวนเงิน</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">คำสั่งซื้อ</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">การโอนล่าสุด</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 text-xs">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div>
                              <div className="font-medium text-gray-900 text-xs">{payout.sellerName}</div>
                              <div className="text-xs text-gray-500">{payout.email}</div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="space-y-0.5">
                              <div className="text-xs text-gray-900">{payout.bankName}</div>
                              <div className="text-xs text-gray-600">เลขบัญชี: {payout.bankAccount}</div>
                              <div className="text-xs text-gray-600">ชื่อบัญชี: {payout.accountName}</div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <div className="text-sm font-bold text-green-600">{formatCurrency(payout.netAmount)}</div>
                              <div className="text-xs text-gray-500">
                                รวม: {formatCurrency(payout.amount)} | ค่าคอมมิชชัน: {formatCurrency(payout.commission)}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-900">{payout.orders} คำสั่งซื้อ</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-500">{payout.lastTransfer}</div>
                          </td>
                          <td className="py-2 px-3">
                            {payout.status === 'COMPLETED' ? (
                              <button
                                onClick={() => handleProcessPayout(payout.id)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                title="ดูรายละเอียดการโอน"
                              >
                                โอนเงินแล้ว
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleProcessPayout(payout.id)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                              >
                                โอนเงิน
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            ) : (
              <div className="text-center py-8">
                <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ไม่มีรายการรอโอนเงิน</p>
              </div>
            )}
          </div>


          {/* Payout History */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">ประวัติการโอนเงิน</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[120px]">เจ้าของชีท</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[100px]">จำนวนเงิน</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[80px]">คำสั่งซื้อ</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[80px]">วันที่โอน</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[80px]">สถานะ</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-gray-900 text-xs min-w-[100px]">อ้างอิง</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutHistory.map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-1.5 px-2 min-w-[120px]">
                        <div className="font-medium text-gray-900 text-xs truncate">{payout.sellerName}</div>
                      </td>
                      <td className="py-1.5 px-2 min-w-[100px]">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(payout.amount)}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 min-w-[80px]">
                        <div className="text-left">
                          <span className="font-medium text-gray-900 text-xs">{payout.orders}</span>
                          <span className="text-xs text-gray-500 ml-1">คำสั่งซื้อ</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 min-w-[80px]">
                        <div className="text-xs text-gray-500">{formatDate(payout.date)}</div>
                      </td>
                      <td className="py-1.5 px-2 min-w-[80px]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          เสร็จสิ้น
                        </span>
                      </td>
                      <td className="py-1.5 px-2 min-w-[100px]">
                        <div className="text-xs text-gray-500 font-mono truncate">{payout.reference}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancePage;