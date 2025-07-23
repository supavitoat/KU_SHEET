import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';
import groupImage from '../../assets/Group.png';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Add debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Check email availability with debounce
  const checkEmailAvailability = debounce(async (email) => {
    if (!email || !email.includes('@')) return;
    
    setIsCheckingEmail(true);
    try {
      const response = await authAPI.checkEmail(email.toLowerCase().trim());
      if (!response.data.data.isAvailable) {
        setError(response.data.data.message);
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  }, 500);

  // Handle email change
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError('');
    if (newEmail) {
      checkEmailAvailability(newEmail);
    }
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate password length
      if (password.length < 8) {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        return;
      }

      // Validate password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข');
        return;
      }

      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        return;
      }

      if (!agreeToTerms) {
        setError('กรุณายอมรับข้อตกลงและนโยบายความเป็นส่วนตัว');
        return;
      }

      // Check email one last time before proceeding
      const emailResponse = await authAPI.checkEmail(email.toLowerCase().trim());
      if (!emailResponse.data.data.isAvailable) {
        setError(emailResponse.data.data.message);
        return;
      }

      // Store registration data in localStorage temporarily
      const registrationData = {
        email: email.toLowerCase().trim(),
        password,
        timestamp: Date.now()
      };
      localStorage.setItem('tempRegistration', JSON.stringify(registrationData));

      // Navigate to info enter page immediately
      window.location.href = '/infoEnter';
    } catch (error) {
      console.error('Registration error:', error);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
          alt="Register illustration" 
          className="max-w-[400px] w-full"
        />
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 max-w-[400px] mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Create your account on</h1>
          <h2 className="text-3xl font-bold text-[#853EF4]">KU SHEET</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">อีเมล</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="example@ku.th"
                className="w-full px-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors disabled:opacity-50"
                required
                disabled={isLoading}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
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
            <p className="text-xs text-gray-500">รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">ยืนยันรหัสผ่าน</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors disabled:opacity-50"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#853EF4] focus:ring-[#853EF4] disabled:opacity-50"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">
              ฉันยอมรับ{' '}
              <Link to="/terms" className="text-[#853EF4] hover:underline">เงื่อนไขการใช้งาน</Link>
              {' '}และ{' '}
              <Link to="/privacy" className="text-[#853EF4] hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !agreeToTerms}
            className="w-full py-2.5 bg-[#853EF4] text-white rounded-lg font-medium hover:bg-[#7B38E3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดำเนินการ...
              </>
            ) : (
              'ถัดไป'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          มีบัญชีอยู่แล้ว?{' '}
          <Link 
            to="/login" 
            className={`text-[#853EF4] hover:underline font-medium ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;