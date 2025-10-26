import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { getProfilePictureURL } from '../../services/api';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  ShoppingCartIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';
import heartIcon from '../../assets/heart.png';
import cartIcon from '../../assets/cart.png';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import Swal from 'sweetalert2';
import { useNotifications } from '../../contexts/NotificationsContext.jsx'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated, user, logout, isAdmin, isSeller } = useAuth();
  const { getWishlistCount } = useWishlist();
  const { getCartCount } = useCart();
  const { items: notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  
  // Removed unused displayName to satisfy lint rule no-unused-vars

  // Full name for dropdowns (first + last if provided)
  const fullName = useMemo(() => {
    return (user?.fullName || user?.full_name || '').trim();
  }, [user?.fullName, user?.full_name]);
  
  const profilePictureURL = useMemo(() => {
    return user?.picture ? getProfilePictureURL(user.picture) : null;
  }, [user?.picture]);

  useEffect(() => {
    setImageError(false);
  }, [profilePictureURL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (isMobileMenuOpen) {
      body.classList.add('overflow-hidden');
    } else {
      body.classList.remove('overflow-hidden');
    }
    return () => body.classList.remove('overflow-hidden');
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#a0aec0',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        actions: 'swal2-actions-stretch',
      },
    });
    
    if (result.isConfirmed) {
      try {
        await logout();
        navigate('/');
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleMenuClick = (callback) => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    if (callback) callback();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'ดาวน์โหลดชีท', href: '/shop', icon: null },
    { 
      name: 'อัพโหลดชีท', 
      href: isSeller() ? '/seller/profile' : '/seller', 
      icon: null 
    },
    { name: 'กลุ่มติว', href: '/study-groups', icon: null },
  ];

  // เพิ่ม CSS global ให้ปุ่ม SweetAlert2 เท่ากันและขอบมนมากขึ้น
  if (typeof window !== 'undefined' && !window.__swal2_btn_logout_css) {
    const style = document.createElement('style');
    style.innerHTML = `
      .swal2-actions-stretch button {
        min-width: 140px !important;
        width: 140px !important;
        margin: 0 8px !important;
        border-radius: 0.75rem !important;
        font-size: 1rem !important;
        white-space: nowrap !important;
        padding: 0.625rem 1.25rem !important;
      }
    `;
    document.head.appendChild(style);
    window.__swal2_btn_logout_css = true;
  }

  return (
    <nav className="bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="px-4 md:px-8">
        <div className="flex items-center h-16 relative">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-3 z-10 group">
            <div className="hidden md:flex w-12 h-12 bg-white/90 rounded-full items-center justify-center p-2 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <img 
                src={logo}
                alt="KU Sheet Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-wide group-hover:text-white/90 transition-colors">KU SHEET</span>
          </button>

          {/* Desktop Navigation - Absolutely Centered */}
          <div className="hidden md:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.href)}
                className={`text-lg font-medium px-5 py-2 rounded-full transition-all duration-200 ${
                  isActiveRoute(link.href) ? 'bg-[#FFFFFF] text-[#853EF4]' : 
                  'text-[#FFFFFF] hover:bg-white/20 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center ml-auto z-10 gap-2">

            {!isAuthenticated && (
              <InteractiveHoverButton
                className="bg-white text-[#8B5CF6] border-0 hover:bg-[#8B5CF6] hover:text-white hover:border-white hover:border-2"
                onClick={() => navigate('/login')}
              >
                LOGIN
              </InteractiveHoverButton>
            )}

            {/* Wishlist Button - Only show when authenticated */}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/wishlist')}
                className="relative p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <img src={heartIcon} alt="รายการโปรด" className="w-6 h-6" />
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-white hover:bg-white/20 rounded-lg transition-colors "
            >
              <img src={cartIcon} alt="รถเข็น" className="w-6 h-6" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </button>

            {/* Notification Button */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">การแจ้งเตือน</p>
                      <button
                        onClick={async () => {
                          try {
                            await markAllRead();
                          } finally {
                            setIsNotifOpen(false);
                            window.location.reload();
                          }
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        ทำทั้งหมดว่าอ่านแล้ว
                      </button>
                    </div>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <button
                        onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }}
                        className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                      >
                        ดูการแจ้งเตือนทั้งหมด
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-2 text-center text-gray-500 text-sm">
                          ไม่มีการแจ้งเตือน
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                              markRead(notif.id);
                              if (notif.link) navigate(notif.link);
                              setIsNotifOpen(false);
                            }}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                              <BellIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {notif.body}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(notif.createdAt).toLocaleString('default', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu - moved to the end */}
            {isAuthenticated && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-md text-white transition-colors"
                >
                  {profilePictureURL && !imageError ? (
                    <span className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110">
                      <img
                        src={profilePictureURL}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-cover bg-white border-2 border-white"
                        onError={() => setImageError(true)}
                      />
                    </span>
                  ) : (
                    <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110">
                      <UserIcon className="w-6 h-6 text-[#8B5CF6]" />
                    </span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="fixed left-0 right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 ml-auto mr-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fullName || user?.email}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        to="/mysheet"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>ชีทของฉัน</span>
                      </Link>
                    </div>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          handleMenuClick();
                          window.location.href = '/admin/dashboard';
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleMenuClick();
                        window.location.href = '/wishlist';
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <HeartIcon className="w-4 h-4" />
                      <span>รายการโปรด</span>
                      {getWishlistCount() > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {getWishlistCount()}
                        </span>
                      )}
                    </button>

                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile quick actions + menu button */}
          <div className="ml-auto flex items-center gap-0 -mr-2.5 md:hidden">
            {/* Replace wishlist with profile avatar on mobile */}
            <button
              onClick={() => {
                if (isAuthenticated) {
                  if (isSeller()) navigate('/seller/profile');
                  else navigate('/mysheet');
                } else {
                  navigate('/login');
                }
              }}
              className="relative p-2 text-white rounded-full active:bg-white/20"
              aria-label="Profile"
            >
        {profilePictureURL && !imageError ? (
                <img
                  src={profilePictureURL}
                  alt="profile"
                  className="w-9 h-9 rounded-full object-cover bg-white border border-white/70"
          onError={() => setImageError(true)}
                />
              ) : (
                <span className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-[#8B5CF6]" />
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-white rounded-lg active:bg-white/20"
              aria-label="Cart"
            >
              <img src={cartIcon} alt="รถเข็น" className="w-8 h-8" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-white active:bg-white/20"
              aria-label="Open Menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-8 h-8" />
              ) : (
                <Bars3Icon className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 md:hidden z-40" onClick={() => setIsMobileMenuOpen(false)} />
            {/* Panel */}
            <div id="mobile-menu-panel" className="fixed top-16 left-0 right-0 md:hidden z-50">
              <div className="mx-3 rounded-2xl bg-[#8B5CF6]/95 backdrop-blur border border-white/20 shadow-xl overflow-hidden">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate(link.href);
                      }}
                      className={`block w-full text-left px-3 py-3 text-base font-medium rounded-xl transition-all ${
                        isActiveRoute(link.href) ? 'bg-white text-[#8B5CF6]' : 'text-white hover:bg-white/15'
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}

                  {/* Mobile Auth Section */}
                  <div className="pt-3 border-t border-white/20">
                    {isAuthenticated ? (
                      <div className="space-y-1">
                        <div className="px-3 py-3 flex items-center gap-3">
              {profilePictureURL && !imageError ? (
                            <img
                              src={profilePictureURL}
                              alt="profile"
                              className="w-9 h-9 rounded-full object-cover bg-white border border-white/80"
                onError={() => setImageError(true)}
                            />
                          ) : (
                            <span className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-[#8B5CF6]" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-white/80">Signed in as</p>
                            <p className="text-sm font-medium text-white truncate">
                              {fullName || user?.email}
                            </p>
                            {user?.email && (
                              <p className="text-xs text-white/80 truncate">{user.email}</p>
                            )}
                          </div>
                        </div>

                        {isAdmin() && (
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigate('/admin/dashboard');
                            }}
                            className="flex items-center gap-2 px-3 py-3 text-base font-medium text-white rounded-xl hover:bg-white/15 w-full text-left"
                          >
                            <Cog6ToothIcon className="w-5 h-5" />
                            <span>Admin Dashboard</span>
                          </button>
                        )}

                        {/* Wishlist - mobile menu */}
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate('/wishlist');
                          }}
                          className="flex items-center gap-2 px-3 py-3 text-base font-medium text-white rounded-xl hover:bg-white/15 w-full text-left"
                        >
                          <HeartIcon className="w-5 h-5" />
                          <span>รายการโปรด</span>
                          {getWishlistCount() > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                              {getWishlistCount()}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate('/mysheet');
                          }}
                          className="flex items-center gap-2 px-3 py-3 text-base font-medium text-white rounded-xl hover:bg-white/15 w-full text-left"
                        >
                          <ClipboardDocumentListIcon className="w-5 h-5" />
                          <span>My Orders</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-3 text-base font-medium text-white hover:bg-white/15 rounded-xl text-left"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 pb-2">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate('/login');
                          }}
                          className="block w-full text-center px-8 py-2 bg-white text-[#8B5CF6] rounded-full font-medium text-base hover:bg-opacity-90 transition-colors"
                        >
                          Login
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;