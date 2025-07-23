import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'ดาวโหลดชีท', href: '/shop', icon: null },
    { name: 'อัพโหลดชีท', href: '/seller', icon: null },
    { name: 'กลุ่มติว', href: '#', icon: null, disabled: true },
  ];

  return (
    <nav className="bg-[#8B5CF6] fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
              <img 
                src={logo}
                alt="KU Sheet Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">KU SHEET</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-base font-medium text-white px-6 py-2 rounded-full transition-all duration-200 ${
                  link.disabled ? 'opacity-50 cursor-not-allowed' : 
                  isActiveRoute(link.href) ? 'bg-[#FFFFFF] text-[#853EF4]' : 'hover:bg-[#FFFFFF] hover:text-[#853EF4]'
                }`}
                onClick={link.disabled ? (e) => e.preventDefault() : undefined}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[#9D6EF9] text-white"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <span className="text-sm font-medium">
                    {user?.full_name || user?.email}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {isAdmin() && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    {isSeller() && (
                      <Link
                        to="/seller/mysheet"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>My Sheets</span>
                      </Link>
                    )}

                    <Link
                      to="/user/myorder"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingCartIcon className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-8 py-2 bg-white text-[#8B5CF6] rounded-full font-medium text-base hover:bg-opacity-90 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-white hover:bg-[#9D6EF9]"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-[#9D6EF9]">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`block px-3 py-2 text-base font-medium text-white hover:bg-[#9D6EF9] ${
                    link.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => {
                    if (!link.disabled) setIsMobileMenuOpen(false);
                  }}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-[#9D6EF9]">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-300">Signed in as</p>
                      <p className="text-sm font-medium text-white">
                        {user?.full_name || user?.email}
                      </p>
                    </div>

                    {isAdmin() && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-base font-medium text-white hover:bg-[#9D6EF9]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    {isSeller() && (
                      <Link
                        to="/seller/mysheet"
                        className="flex items-center gap-2 px-3 py-2 text-base font-medium text-white hover:bg-[#9D6EF9]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                        <span>My Sheets</span>
                      </Link>
                    )}

                    <Link
                      to="/user/myorder"
                      className="flex items-center gap-2 px-3 py-2 text-base font-medium text-white hover:bg-[#9D6EF9]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      <span>My Orders</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-white hover:bg-[#9D6EF9]"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-3">
                    <Link
                      to="/login"
                      className="block w-full text-center px-8 py-2 bg-white text-[#8B5CF6] rounded-full font-medium text-base hover:bg-opacity-90 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;