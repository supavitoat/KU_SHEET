import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationsProvider } from './contexts/NotificationsContext.jsx';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InfoEnterPage from './pages/auth/InfoEnterPage';
import ShopPage from './pages/sheets/ShopPage';
import SheetDetailPage from './pages/sheets/SheetDetailPage';
import OrderHistoryPage from './pages/orders/OrderHistoryPage';
import SellerPage from './pages/seller/SellerPage';
import SellerProfilePage from './pages/seller/SellerProfilePage';
import SellerEditPage from './pages/seller/SellerEditPage';
import EditSheetPage from './pages/seller/EditSheetPage';
import RevenueHistoryPage from './pages/seller/RevenueHistoryPage';
import SellerManageSheetsPage from './pages/seller/ManageSheetsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import AdminManageSheetsPage from './pages/admin/AdminManageSheetsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SheetInfoPage from './pages/admin/SheetInfoPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import PayoutPage from './pages/admin/PayoutPage';
import GroupsManagePage from './pages/admin/GroupsManagePage';
import DiscountCodesPage from './pages/admin/DiscountCodesPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/orders/CartPage';
import CheckoutPage from './pages/orders/CheckoutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import FacultySheetsPage from './pages/FacultySheetsPage';
import SubjectSheetsPage from './pages/SubjectSheetsPage';
import ReviewsPage from './pages/ReviewsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import GroupDetailPage from './pages/groups/GroupDetailPage';
import StudyGroupCreatePage from './pages/study-groups/CreatePage';
import StudyGroupEditPage from './pages/study-groups/EditPage';
import StudyGroupsListPage from './pages/study-groups/ListPage';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000, 
    },
  },
});

// ScrollToTop component to ensure pages start at the top
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

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
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="min-h-screen pt-16">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:facultyId" element={<ShopPage />} />
            <Route path="/infoSheet/:id" element={<SheetDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
    
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
    
            <Route path="/faculty-sheets" element={<FacultySheetsPage />} />
            <Route path="/subject-sheets" element={<SubjectSheetsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* New Study Groups */}
            <Route path="/study-groups" element={<StudyGroupsListPage />} />
            <Route path="/study-groups/create" element={<ProtectedRoute><StudyGroupCreatePage /></ProtectedRoute>} />
            <Route path="/study-groups/:id/edit" element={<ProtectedRoute><StudyGroupEditPage /></ProtectedRoute>} />

            {/* Legacy groups (keep for backward compatibility) */}
            <Route path="/groups/:id" element={<GroupDetailPage />} />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={<LoginPage />} 
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
                isAuthenticated && isFirstLogin ? (
                  <InfoEnterPage />
                ) : localStorage.getItem('tempRegistration') ? (
                  <InfoEnterPage />
                ) : (
                  <Navigate to="/register" replace />
                )
              } 
            />

            {/* Protected User Routes */}
            {/* Cart Route - Accessible without authentication */}
            <Route 
              path="/cart" 
              element={<CartPage />}
            />
            {/* Protected Checkout Route */}
            <Route 
              path="/cart/checkout" 
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mysheet" 
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
              path="/seller/manage" 
              element={
                <ProtectedRoute requireSeller>
                  <SellerManageSheetsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/profile" 
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
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <ManageUsersPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/sheets" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminManageSheetsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/infoSheet/:id" 
              element={
                <ProtectedRoute requireAdmin>
                  <SheetInfoPage />
                </ProtectedRoute>
              } 
            />
                            
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/orders/:id"
              element={
                <ProtectedRoute requireAdmin>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/finance"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminFinancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <ProtectedRoute requireAdmin>
                  <GroupsManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/discounts"
              element={
                <ProtectedRoute requireAdmin>
                  <DiscountCodesPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/payout/:payoutId"
              element={
                <ProtectedRoute requireAdmin>
                  <PayoutPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/analytics/:type"
              element={
                <ProtectedRoute requireAdmin>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all admin route - must be last */}
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
        <Footer />
      </div>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <WishlistProvider>
            <CartProvider>
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
            </CartProvider>
          </WishlistProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
