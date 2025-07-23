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
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-xl text-gray-600 mb-8">Admin access required</p>
          <a href="/" className="btn btn-primary">
            Go Home
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-xl text-gray-600 mb-8">Seller access required</p>
          <p className="text-gray-500 mb-8">
            You need to register as a seller to access this page.
          </p>
          <div className="space-x-4">
            <a href="/seller" className="btn btn-primary">
              Become a Seller
            </a>
            <a href="/" className="btn btn-outline">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if user needs to complete profile setup
  if (user?.is_first_login && location.pathname !== '/infoEnter') {
    return <Navigate to="/infoEnter" replace />;
  }

  return children;
};

export default ProtectedRoute;