import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';
import { TagIcon } from '@heroicons/react/24/outline';
import { TagIcon as TagIconSolid } from '@heroicons/react/24/solid';

const AdminSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active tab based on current path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'overview';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/sheets')) return 'sheets';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/finance') || path.includes('/admin/payout')) return 'finance';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/groups')) return 'groups';
  if (path.includes('/admin/discounts')) return 'discounts';
    return 'overview';
  };

  const activeTab = getCurrentTab();

  const sidebarItems = [
    {
      id: 'overview',
      name: 'ภาพรวม',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      description: 'สถิติและภาพรวมของระบบ'
    },
    {
      id: 'users',
      name: 'จัดการผู้ใช้',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      description: 'จัดการบัญชีผู้ใช้และสิทธิ์'
    },
    {
      id: 'sheets',
      name: 'จัดการชีท',
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      description: 'อนุมัติและจัดการชีทสรุป'
    },
    {
      id: 'orders',
      name: 'จัดการคำสั่งซื้อ',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      description: 'ตรวจสอบการชำระเงิน'
    },
    {
      id: 'finance',
      name: 'จัดการการเงิน',
      icon: CurrencyDollarIcon,
      iconSolid: CurrencyDollarIconSolid,
      description: 'จัดการการเงินและค่าคอมมิชชัน'
    }
    ,
    {
      id: 'groups',
      name: 'จัดการกลุ่มติว',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      description: 'ดู/อัปเดตสถานะ ลบกลุ่มติว'
    }
    ,
    {
      id: 'discounts',
      name: 'โค้ดส่วนลด',
      icon: TagIcon,
      iconSolid: TagIconSolid,
      description: 'สร้าง/แก้ไข/ปิดใช้งานโค้ด'
    }
  ];

  const handleNavigation = (itemId) => {
    const tabToPath = {
      'overview': '/admin/dashboard',
      'users': '/admin/users',
      'sheets': '/admin/sheets',
      'orders': '/admin/orders',
      'finance': '/admin/finance',
  'groups': '/admin/groups',
  'discounts': '/admin/discounts'
    };
    navigate(tabToPath[itemId] || '/admin/dashboard');
    setIsSidebarOpen(false); // Close mobile sidebar
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 h-screen w-80 bg-white border-r border-gray-200 z-30 transition-transform duration-300 overflow-y-auto`}>
        <div className="p-6">
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">KU Sheet</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = activeTab === item.id ? item.iconSolid : item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      activeTab === item.id ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-sm mt-1 ${
                      activeTab === item.id ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
