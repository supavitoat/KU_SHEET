import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireSeller = false 
}) => {
  const { isAuthenticated, isLoading, user, isAdmin, isSeller } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="กำลังโหลด..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🚫 403</h1>
        <p className="text-xl text-gray-600 mb-8">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</p>
        <p className="text-gray-500 mb-8">
          คุณต้องเป็นผู้ดูแลระบบเพื่อเข้าถึงหน้านี้
        </p>
        <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          กลับหน้าหลัก
        </a>
      </div>
      </div>
    );
  }

  // Check seller requirement
  if (requireSeller && !isSeller()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🚫 403</h1>
        <p className="text-xl text-gray-600 mb-8">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</p>
        <p className="text-gray-500 mb-8">
          คุณต้องสมัครเป็นนักทำชีทสรุปเพื่อเข้าถึงหน้านี้
        </p>
        <div className="space-x-4">
          <a href="/seller" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            สมัครเป็นนักทำชีทสรุป
          </a>
          <a href="/" className="inline-block px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            กลับหน้าหลัก
          </a>
        </div>
      </div>
      </div>
    );
  }

  // Check if user needs to complete profile setup
  if ((user?.isFirstLogin || user?.is_first_login) && location.pathname !== '/infoEnter') {
    return <Navigate to="/infoEnter" replace />;
  }

  return children;
};

export default ProtectedRoute;