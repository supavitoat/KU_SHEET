import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
// Removed unused resetIcon and emailIcon
import sendmailIcon from '../../assets/Sendmail.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-0 sm:p-0 flex flex-col items-center">
        <div className="bg-white/90 shadow-2xl rounded-3xl px-4 py-6 w-full relative" style={{boxShadow:'0 8px 32px 0 rgba(0,0,0,0.12), 0 1.5px 8px 0 rgba(0,0,0,0.10)'}}>
          <div className="flex flex-col items-center mb-8">
            <img src={sendmailIcon} alt="send mail icon" className="w-[200px] mb-3" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight text-center">ลืมรหัสผ่าน</h2>
            <p className="text-gray-500 text-center text-base">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
          </div>
          {success ? (
            <div className="text-green-600 text-center mb-4 text-lg font-semibold">ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="mb-2 p-3 bg-red-50 text-red-600 text-base rounded-lg text-center font-medium shadow">{error}</div>
              )}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#853EF4] bg-white text-base border-[#d1c4e9]"
                  placeholder="example@ku.th"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-base font-bold rounded-xl shadow-lg bg-gradient-to-r from-[#853EF4] to-[#6300FF] text-white hover:scale-[1.03] hover:shadow-xl transition-all duration-150"
              >
                {isLoading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
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

export default ForgotPasswordPage; 