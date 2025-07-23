import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InfoEnterPage from './pages/auth/InfoEnterPage';
import ShopPage from './pages/sheets/ShopPage';
import SheetDetailPage from './pages/sheets/SheetDetailPage';
import CartPage from './pages/orders/CartPage';
import OrderHistoryPage from './pages/orders/OrderHistoryPage';
import SellerPage from './pages/seller/SellerPage';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerEditPage from './pages/seller/SellerEditPage';
import EditSheetPage from './pages/seller/EditSheetPage';
import RevenueHistoryPage from './pages/seller/RevenueHistoryPage';
import AdminDashboard from './pages/admin/AdminDashboard';

// Import components
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Main App Router Component
const AppRouter = () => {
  const { isLoading, isAuthenticated, isFirstLogin, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="min-h-screen pt-16">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:facultyId" element={<ShopPage />} />
            <Route path="/infoSheet/:id" element={<SheetDetailPage />} />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  isAdmin() ? <Navigate to="/admin/dashboard" replace /> :
                  isFirstLogin ? <Navigate to="/infoEnter" replace /> :
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? (
                  isAdmin() ? <Navigate to="/admin/dashboard" replace /> :
                  isFirstLogin ? <Navigate to="/infoEnter" replace /> :
                  <Navigate to="/" replace />
                ) : (
                  <RegisterPage />
                )
              } 
            />

            {/* First-time user profile setup */}
            <Route 
              path="/infoEnter" 
              element={
                <ProtectedRoute>
                  <InfoEnterPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected User Routes */}
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/myorder" 
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              } 
            />

            {/* Seller Routes */}
            <Route 
              path="/seller" 
              element={
                <ProtectedRoute>
                  <SellerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/mysheet" 
              element={
                <ProtectedRoute requireSeller>
                  <SellerProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/selledit" 
              element={
                <ProtectedRoute requireSeller>
                  <SellerEditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/editSheet" 
              element={
                <ProtectedRoute requireSeller>
                  <EditSheetPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/editSheet/:id" 
              element={
                <ProtectedRoute requireSeller>
                  <EditSheetPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/sellrev" 
              element={
                <ProtectedRoute requireSeller>
                  <RevenueHistoryPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 404 Route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a 
                      href="/" 
                      className="btn btn-primary btn-lg"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
