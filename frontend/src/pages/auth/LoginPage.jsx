import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import groupImage from '../../assets/Group.png';
import mailIcon from '../../assets/mail.png';
import keyIcon from '../../assets/key.png';
import openEyeIcon from '../../assets/OpenEye.png';
import closeEyeIcon from '../../assets/CloseEye.png';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CoolMode } from "@/components/magicui/cool-mode";
import { clearTempRegistration } from '../../utils/localStorage';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const { login, getCurrentUser, isAuthenticated, isAdmin, isFirstLogin } = useAuth();
  const navigate = useNavigate();

  const redirectUser = React.useCallback(() => {
    if (isAuthenticated) {
      if (isAdmin && typeof isAdmin === 'function' && isAdmin()) {
        navigate('/admin/dashboard', { replace: true });
      } else if (isFirstLogin) {
        navigate('/infoEnter', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isFirstLogin, navigate]);

  useEffect(() => {
    redirectUser();
  }, [redirectUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    // ตรวจสอบรูปแบบอีเมลเบื้องต้น
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login({
        email: email,
        password: password
      });
      if (result.success) {
        navigate('/');
      } else {
        // แปลงข้อความ error ให้เหมาะสม (backup translation)
        let errorMessage = result.message || "😔 เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน";
        
        if (result.message === "Validation failed" || result.message === "กรุณากรอกข้อมูลให้ครบถ้วน") {
          errorMessage = "อีเมลไม่ถูกต้อง";
        } else if (result.message?.includes("รูปแบบอีเมลไม่ถูกต้อง") || result.message?.includes("Please provide a valid email")) {
          errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
        } else if (result.message?.includes("กรุณากรอกอีเมล") || result.message?.includes("email is required")) {
          errorMessage = "กรุณากรอกอีเมล";
        } else if (result.message?.includes("ไม่พบผู้ใช้") || result.message?.includes("user not found") || result.message?.includes("ยังไม่ได้สมัครสมาชิก")) {
          errorMessage = "อีเมลไม่ถูกต้อง";
        } else if (result.message?.includes("รหัสผ่านไม่ถูกต้อง") || result.message?.includes("password")) {
          errorMessage = "รหัสผ่านไม่ถูกต้อง";
        } else if (result.message?.includes("กรุณากรอกรหัสผ่าน") || result.message?.includes("password is required")) {
          errorMessage = "กรุณากรอกรหัสผ่าน";
        } else if (result.message?.includes("รหัสผ่านต้องมีอย่างน้อย")) {
          errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
        } else if (result.message?.includes("กรุณาเลือกรูปโปรไฟล์")) {
          errorMessage = "กรุณาเลือกรูปโปรไฟล์";
        } else if (result.message?.includes("รูปภาพมีขนาดใหญ่เกินไป")) {
          errorMessage = "รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)";
        } else if (result.message?.includes("รูปแบบรูปภาพไม่ถูกต้อง")) {
          errorMessage = "รูปแบบรูปภาพไม่ถูกต้อง";
        }
        
        setLoginError(errorMessage);
      }
    } catch (error) {
      // แสดงข้อความ error จาก API response หรือข้อความทั่วไป
      const errorMessage = error.response?.data?.message || '😔 เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && email && password) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // useEffect(() => {
  //   return () => {
  //   };
  // }, []);

  // Google OAuth response handler (placed before initializeGoogleSDK to avoid TDZ)
  const handleGoogleResponse = React.useCallback(async (response) => {
    try {
      const res = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        if (data.firstLogin === true) {
          // ยังไม่มี user ในระบบ: เก็บข้อมูล Google ชั่วคราว รอ infoEnter
          localStorage.setItem('tempRegistration', JSON.stringify({
            email: data.user?.email,
            fullName: data.user?.fullName,
            picture: data.user?.picture,
            credential: response.credential,
            timestamp: Date.now()
          }));
          window.location.href = '/infoEnter';
        } else {
          // user เดิม login สำเร็จ
          sessionStorage.setItem('showLoginToast', '1');
          clearTempRegistration(); // Clear any existing tempRegistration
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          await getCurrentUser();
          window.location.href = '/';
        }
      } else {
        alert(data.message || '😔 เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } catch {
      alert('😔 เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google กรุณาลองใหม่อีกครั้ง');
    }
  }, [getCurrentUser]);

  // Memoize Google SDK initialization to prevent unnecessary re-runs
  const initializeGoogleSDK = React.useCallback(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // ตรวจสอบว่า Google SDK โหลดแล้วหรือยัง
    const checkGoogleSDK = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignInDiv'),
            { theme: 'outline', size: 'large' }
          );
        } catch (error) {
          console.error('Google SDK initialization error:', error);
          renderFallbackGoogleButton();
        }
      } else {
        // Google SDK หรือ client_id ยังไม่พร้อม
        // ลองใหม่อีกครั้งใน 2 วินาที (ลดความถี่)
        setTimeout(checkGoogleSDK, 2000);
      }
    };

    checkGoogleSDK();
  }, [handleGoogleResponse]);

  useEffect(() => {
    initializeGoogleSDK();
  }, [initializeGoogleSDK]);

  const renderFallbackGoogleButton = () => {
    const googleDiv = document.getElementById('googleSignInDiv');
    if (googleDiv) {
      googleDiv.innerHTML = `
        <button 
          type="button"
          onclick="window.location.reload()"
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>
      `;
    }
  };


  // Facebook login not implemented yet; handler removed to avoid unused var

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-between p-8">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center animate-fade-in-up animation-delay-100">
          <img 
            src={groupImage}
            alt="Login illustration" 
            className="max-w-[450px] w-full"
          />
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 max-w-[480px] mx-auto bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-all duration-300 border border-white/30 animate-fade-in-up animation-delay-200">
          <div className="mb-6 animate-fade-in-up animation-delay-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up animation-delay-400">เข้าสู่ระบบ</h1>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-6 animate-fade-in-up animation-delay-500">KU SHEET</h2>
          </div>

          {/* Error Box */}
          {typeof loginError === 'string' && loginError.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 text-sm rounded-xl animate-fade-in-up animation-delay-600 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {(() => {
                    // แปลงข้อความ error ให้เหมาะสมในส่วน UI
                    if (loginError === "Validation failed" || loginError === "กรุณากรอกข้อมูลให้ครบถ้วน") {
                      return "อีเมลไม่ถูกต้อง";
                    } else if (loginError.includes("รูปแบบอีเมลไม่ถูกต้อง") || loginError.includes("Please provide a valid email")) {
                      return "รูปแบบอีเมลไม่ถูกต้อง";
                    } else if (loginError.includes("กรุณากรอกอีเมล") || loginError.includes("email is required")) {
                      return "กรุณากรอกอีเมล";
                    } else if (loginError.includes("ไม่พบผู้ใช้") || loginError.includes("user not found") || loginError.includes("ยังไม่ได้สมัครสมาชิก")) {
                      return "อีเมลไม่ถูกต้อง";
                    } else if (loginError.includes("รหัสผ่านไม่ถูกต้อง") || loginError.includes("password")) {
                      return "รหัสผ่านไม่ถูกต้อง";
                    } else if (loginError.includes("กรุณากรอกรหัสผ่าน") || loginError.includes("password is required")) {
                      return "กรุณากรอกรหัสผ่าน";
                    } else if (loginError.includes("รหัสผ่านต้องมีอย่างน้อย")) {
                      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
                    } else if (loginError.includes("กรุณาเลือกรูปโปรไฟล์")) {
                      return "กรุณาเลือกรูปโปรไฟล์";
                    } else if (loginError.includes("รูปภาพมีขนาดใหญ่เกินไป")) {
                      return "รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)";
                    } else if (loginError.includes("รูปแบบรูปภาพไม่ถูกต้อง")) {
                      return "รูปแบบรูปภาพไม่ถูกต้อง";
                    }
                    return loginError;
                  })()}
                </span>
              </div>
              {/* Debug Info - แสดงข้อมูลเพิ่มเติมเพื่อการแก้ไขปัญหา */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-500">
                  <details className="cursor-pointer">
                    <summary>🔍 ข้อมูล Debug (Development)</summary>
                    <div className="mt-1 font-mono">
                      Original Error: {loginError}
                    </div>
                  </details>
                </div>
              )}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-fade-in-up animation-delay-900">
              <label className="block text-sm font-medium text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">อีเมล</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-300">
                  <img src={mailIcon} alt="mail icon" className="w-5 h-5 opacity-80" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setLoginError('');
                  }}
                  onBlur={(e) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (e.target.value && !emailRegex.test(e.target.value)) {
                      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="example@ku.th"
                  className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 hover:bg-white/70 hover:shadow-lg disabled:opacity-50 ${
                    emailError 
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 hover:border-purple-400'
                  }`}
                  required
                  disabled={isLoading}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {/* Email Error Message */}
              {emailError && (
                <div className="mt-1 text-red-500 text-xs animate-fade-in-up">
                  {emailError}
                </div>
              )}
            </div>

            <div className="space-y-2 animate-fade-in-up animation-delay-1000">
              <label className="block text-sm font-medium text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">รหัสผ่าน</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center transition-transform duration-300">
                  <img src={keyIcon} alt="key icon" className="w-5 h-5 opacity-80" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
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
            </div>

            <div className="flex items-center justify-end animate-fade-in-up animation-delay-1100">
              <button 
                onClick={() => window.location.href = '/forgot-password'}
                className={`text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-blue-700 transition-all duration-200 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <CoolMode>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-purple-600 via-blue-600 to-blue-700 hover:from-purple-700 hover:via-blue-700 hover:to-blue-800 disabled:opacity-50 animate-fade-in-up animation-delay-1200"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-6 h-6 mr-3" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </CoolMode>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700 animate-fade-in-up animation-delay-1300">
            ยังไม่มีบัญชี?{' '}
            <button 
              onClick={() => window.location.href = '/register'}
              className={`text-[#853EF4] hover:underline font-bold ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              สมัครสมาชิก
            </button>
          </p>
          
          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-in-up animation-delay-1400">
            <p className="text-xs text-red-600 text-center leading-relaxed">
              <span className="font-semibold text-red-500">*</span> ระบบนี้ไม่ใช่ระบบของทางมหาวิทยาลัย ระบบนี้สร้างขึ้นเพื่อเป็นเพียงคลังความรู้ของนิสิตเกษตรด้วยกันเองเท่านั้น
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

export default LoginPage;