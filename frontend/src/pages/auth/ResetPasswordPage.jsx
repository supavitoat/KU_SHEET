import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import openEyeIcon from '../../assets/OpenEye.png';
import closeEyeIcon from '../../assets/CloseEye.png';
import resetIcon from '../../assets/reset.png';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const passwordHint = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข';
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  const validatePassword = (value) => {
    if (!passwordRegex.test(value)) {
      setPasswordError(passwordHint);
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (value !== password) {
      setConfirmPasswordError('รหัสผ่านไม่ตรงกัน');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validatePassword(e.target.value);
    if (confirmPassword) validateConfirmPassword(confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validateConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!token) {
      setFormError('ลิงก์ไม่ถูกต้อง');
      return;
    }
    const validPassword = validatePassword(password);
    const validConfirm = validateConfirmPassword(confirmPassword);
    if (!validPassword || !validConfirm) return;
    setIsLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setFormError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-0 sm:p-0 flex flex-col items-center">
        <div className="bg-white/90 shadow-2xl rounded-3xl px-4 py-6 w-full relative" style={{boxShadow:'0 8px 32px 0 rgba(0,0,0,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.10)'}}>
          <div className="flex flex-col items-center mb-8">
            <img src={resetIcon} alt="reset icon" className="w-[200px] mb-3" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight text-center">รีเซ็ตรหัสผ่านใหม่</h2>
            <p className="text-gray-500 text-center text-base">กรอกรหัสผ่านใหม่ของคุณด้านล่างเพื่อเปลี่ยนรหัสผ่าน</p>
          </div>
          {success ? (
            <div className="text-green-600 text-center mb-4 text-lg font-semibold">รีเซ็ตรหัสผ่านสำเร็จ กำลังนำไปหน้าเข้าสู่ระบบ...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="mb-2 p-3 bg-red-50 text-red-600 text-base rounded-lg text-center font-medium shadow">{formError}</div>
              )}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#853EF4] bg-white text-base ${passwordError ? 'border-red-400' : 'border-[#d1c4e9]'}`}
                    placeholder="กรอกรหัสผ่านใหม่"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    <img
                      src={showPassword ? closeEyeIcon : openEyeIcon}
                      alt={showPassword ? 'close eye' : 'open eye'}
                      className="w-6 h-6 opacity-80"
                    />
                  </button>
                </div>
                {passwordError ? (
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm mt-2 font-medium">{passwordError}</div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">{passwordHint}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#853EF4] bg-white text-base ${confirmPasswordError ? 'border-red-400' : 'border-[#d1c4e9]'}`}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    <img
                      src={showConfirmPassword ? closeEyeIcon : openEyeIcon}
                      alt={showConfirmPassword ? 'close eye' : 'open eye'}
                      className="w-6 h-6 opacity-80"
                    />
                  </button>
                </div>
                {confirmPasswordError && <div className="text-xs text-red-500 mt-2 font-medium">{confirmPasswordError}</div>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-base font-bold rounded-xl shadow-lg bg-gradient-to-r from-[#853EF4] to-[#6300FF] text-white hover:scale-[1.03] hover:shadow-xl transition-all duration-150"
              >
                {isLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
              </button>
            </form>
          )}
        </div>
        <button
          className="mt-8 w-full text-[#853EF4] hover:underline text-base font-semibold"
          onClick={() => navigate('/login')}
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 