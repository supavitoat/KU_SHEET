import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminSidebar from '../../components/common/AdminSidebar';
import ManageSheetsPage from './ManageSheetsPage';

const AdminManageSheetsPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Check authentication and admin permissions
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้า Admin</p>
        </div>
      </div>
    );
  }

  const styles = `@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.animate-fadeInUp{animation:fadeInUp .6s ease-out both;will-change:transform,opacity}.transition-smooth{transition:all .25s ease}`;
  if (typeof document !== 'undefined') { const el=document.createElement('style'); el.type='text/css'; el.innerText=styles; document.head.appendChild(el); }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fadeInUp" style={{animationDelay:'200ms'}}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการชีท</h1>
              <p className="text-gray-600">อนุมัติและจัดการชีทสรุป</p>
            </div>

            {/* Manage Sheets Component */}
            <div className="animate-fadeInUp" style={{animationDelay:'400ms'}}>
              <ManageSheetsPage />
            </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

export default AdminManageSheetsPage;
