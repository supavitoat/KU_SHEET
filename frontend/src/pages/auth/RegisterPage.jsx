import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI, getBaseURL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import groupImage from '../../assets/Group.png';
import mailIcon from '../../assets/mail.png';
import keyIcon from '../../assets/key.png';
import openEyeIcon from '../../assets/OpenEye.png';
import closeEyeIcon from '../../assets/CloseEye.png';
import toast from 'react-hot-toast';
import { clearTempRegistration } from '../../utils/localStorage';

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
      const data = response.data.data;
      if (!data || data.isAvailable === undefined) {
        setError('เกิดข้อผิดพลาดในการตรวจสอบอีเมล');
      } else if (!data.isAvailable) {
        setError(data.message);
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

  // navigate not used; navigation via window.location

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate password length
      if (password.length < 8) {
        setError('🔒 รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        return;
      }

      // Validate password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('🔒 รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข');
        return;
      }

      if (password !== confirmPassword) {
        setError('🔒 รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
        return;
      }

      if (!agreeToTerms) {
        setError('📋 กรุณายอมรับข้อตกลงและนโยบายความเป็นส่วนตัว');
        return;
      }

      // Check email one last time before proceeding
      const emailResponse = await authAPI.checkEmail(email.toLowerCase().trim());
      const data = emailResponse.data.data;
      if (!data || data.isAvailable === undefined) {
        setError('📧 เกิดข้อผิดพลาดในการตรวจสอบอีเมล กรุณาลองใหม่อีกครั้ง');
        return;
      }
      if (!data.isAvailable) {
        setError(data.message);
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
  } catch {
      console.error('Registration error:', error);
      setError('😔 เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // Google login button not used here; flow handled via separate Google widget

  const { getCurrentUser } = useAuth();
  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const callbackUrl = `${getBaseURL()}/api/auth/google/callback`;
      const res = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        clearTempRegistration(); // Clear any existing tempRegistration
        localStorage.setItem('token', data.token);
        if (getCurrentUser) await getCurrentUser();
        toast.success('🎉 ยินดีต้อนรับ! เข้าสู่ระบบด้วย Google สำเร็จแล้ว');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        alert(data.message || 'Google login failed');
      }
  } catch {
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    }
  }, [getCurrentUser]);

  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large' }
      );
    }
  }, [handleGoogleResponse]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Animated Background Elements - REMOVED */}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-between p-8">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center animate-fade-in-up animation-delay-100">
          <img 
            src={groupImage}
            alt="Register illustration" 
            className="max-w-[450px] w-full"
          />
        </div>

        {/* Right side - Register Form */}
        <div className="w-full lg:w-1/2 max-w-[480px] mx-auto bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-all duration-300 border border-white/30 animate-fade-in-up animation-delay-200">
          <div className="mb-6 animate-fade-in-up animation-delay-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up animation-delay-400">สร้างบัญชีใหม่</h1>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-6 animate-fade-in-up animation-delay-500">KU SHEET</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg animate-fade-in-up animation-delay-600">
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="w-full mb-4 animate-fade-in-up animation-delay-700">
            <div id="googleSignInDiv" className="w-full"></div>
          </div>
          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 animate-fade-in-up animation-delay-800">
            <div className="h-[1px] flex-1 bg-gray-200"></div>
            <span className="text-gray-500 text-sm">หรือ</span>
            <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-fade-in-up animation-delay-900">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">อีเมล</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-300">
                  <img src={mailIcon} alt="mail icon" className="w-5 h-5 opacity-80" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="example@ku.th"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:bg-white/70 hover:shadow-lg hover:border-purple-400 disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-up animation-delay-1000">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">รหัสผ่าน</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-300">
                  <img src={keyIcon} alt="key icon" className="w-5 h-5 opacity-80" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:bg-white/70 hover:shadow-lg hover:border-purple-400 disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 transition-transform duration-300"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <img src={closeEyeIcon} alt="close eye" className="w-5 h-5 opacity-80" />
                  ) : (
                    <img src={openEyeIcon} alt="open eye" className="w-5 h-5 opacity-80" />
                  )}
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-white/20">รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข</p>
            </div>

            <div className="space-y-2 animate-fade-in-up animation-delay-1100">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ยืนยันรหัสผ่าน</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-300">
                  <img src={keyIcon} alt="key icon" className="w-5 h-5 opacity-80" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:bg-white/70 hover:shadow-lg hover:border-purple-400 disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 transition-transform duration-300"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <img src={closeEyeIcon} alt="close eye" className="w-5 h-5 opacity-80" />
                  ) : (
                    <img src={openEyeIcon} alt="open eye" className="w-5 h-5 opacity-80" />
                  )}
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="flex items-start gap-3 group animate-fade-in-up animation-delay-1200">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-lg border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                  disabled={isLoading}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                ฉันยอมรับ{' '}
                <button onClick={() => window.location.href = '/terms'} className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all duration-200">เงื่อนไขการใช้งาน</button>
                {' '}และ{' '}
                <button onClick={() => window.location.href = '/privacy'} className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all duration-200">นโยบายความเป็นส่วนตัว</button>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreeToTerms}
              className={`relative w-full py-4 text-white rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden group animate-fade-in-up animation-delay-1300 ${
                !agreeToTerms 
                  ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-800 hover:shadow-2xl'
              } disabled:opacity-50 disabled:transform-none`}
            >
              {/* Shimmer effect - only show when button is enabled */}
              {agreeToTerms && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
              
              {/* Button content */}
              <span className="relative flex items-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>สร้างบัญชี</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700 animate-fade-in-up animation-delay-1400">
            มีบัญชีอยู่แล้ว?{' '}
            <button 
              onClick={() => window.location.href = '/login'}
              className={`text-[#853EF4] hover:underline font-bold ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              เข้าสู่ระบบ
            </button>
          </p>
          
          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-in-up animation-delay-1500">
            <p className="text-xs text-red-600 text-center leading-relaxed">
              <span className="font-semibold text-red-500">*</span>ระบบนี้ไม่ใช่ระบบของทางมหาวิทยาลัย ระบบนี้สร้างขึ้นเพื่อเป็นเพียงคลังความรู้ของนิสิตเกษตรด้วยกันเองเท่านั้น
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .animation-delay-900 {
          animation-delay: 0.9s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1100 {
          animation-delay: 1.1s;
        }

        .animation-delay-1200 {
          animation-delay: 1.2s;
        }

        .animation-delay-1300 {
          animation-delay: 1.3s;
        }

        .animation-delay-1400 {
          animation-delay: 1.4s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }

        .animation-delay-1800 {
          animation-delay: 1.8s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-2500 {
          animation-delay: 2.5s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }

        .animation-delay-3200 {
          animation-delay: 3.2s;
        }

        .animation-delay-3500 {
          animation-delay: 3.5s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-4500 {
          animation-delay: 4.5s;
        }

        .animation-delay-5000 {
          animation-delay: 5s;
        }

        .animation-delay-5500 {
          animation-delay: 5.5s;
        }

        .animation-delay-6000 {
          animation-delay: 6s;
        }

        .animation-delay-7000 {
          animation-delay: 7s;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;