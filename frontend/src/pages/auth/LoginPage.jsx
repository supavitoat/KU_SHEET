import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import groupImage from '../../assets/Group.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({
        email: email,
        password: password,
        remember_me: rememberMe
      });
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(
        error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // TODO: Implement Google login
      console.log('Google login clicked');
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // TODO: Implement Facebook login
      console.log('Facebook login clicked');
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-between p-8">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <img 
          src={groupImage}
          alt="Login illustration" 
          className="max-w-[400px] w-full"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 max-w-[400px] mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Welcome to</h1>
          <h2 className="text-3xl font-bold text-[#853EF4]">KU SHEET</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/google.svg" alt="Google" className="w-5 h-5" />
            Login with Google
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/src/assets/facebook.svg" alt="Facebook" className="w-5 h-5" />
            Login with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-gray-200"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@ku.th"
              className="w-full px-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors disabled:opacity-50"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors disabled:opacity-50"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#853EF4] focus:ring-[#853EF4] disabled:opacity-50"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">จดจำฉัน</span>
            </label>
            <Link 
              to="/forgot-password" 
              className={`text-sm text-[#853EF4] hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#853EF4] text-white rounded-lg font-medium hover:bg-[#7B38E3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          ยังไม่มีบัญชี?{' '}
          <Link 
            to="/register" 
            className={`text-[#853EF4] hover:underline font-medium ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;