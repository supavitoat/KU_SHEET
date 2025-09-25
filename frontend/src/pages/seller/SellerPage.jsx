import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  DocumentTextIcon,
  UsersIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeartIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import heroImg from '../../assets/11101976.png';
import { sellerAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SellerPage = () => {
  const navigate = useNavigate();
  const { user, getCurrentUser, isAuthenticated, isSeller } = useAuth();
  const hasCheckedSeller = useRef(false);
  
  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSeller, setIsCheckingSeller] = useState(true);
  const [formData, setFormData] = useState({
    penName: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Set form data from user (เหมือนหน้า infoEnter)
  useEffect(() => {
    if (user && user.fullName) {
      const parts = user.fullName.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      setFormData(prev => {
        const newData = {
          ...prev,
          firstName: firstName,
          lastName: lastName,
        };
        return newData;
      });
    }
  }, [user, user?.fullName]);

  // Check if user is already a seller
  useEffect(() => {
    const checkSellerStatus = async () => {
      // Prevent multiple calls
      if (hasCheckedSeller.current) {
        return;
      }
      
      // Check if user is authenticated and has token
      const token = localStorage.getItem('token');
      if (!isAuthenticated || !user || !token) {
        setIsCheckingSeller(false);
        return;
      }

      hasCheckedSeller.current = true;

      // ตรวจสอบว่าผู้ใช้เป็น seller หรือไม่โดยใช้ isSeller function
      if (isSeller()) {
        // User is already a seller, redirect to profile immediately
        navigate('/seller/profile');
        return;
      }

      // ถ้าไม่ใช่ seller ให้อยู่ที่หน้านี้เพื่อลงทะเบียน
      setIsCheckingSeller(false);
    };

    checkSellerStatus();
  }, [isAuthenticated, user, navigate, isSeller]);

  const benefits = [
    {
      icon: HeartIcon,
      title: 'แบ่งปันความรู้',
      description: 'ช่วยเหลือเพื่อนนักศึกษาและสร้างชุมชนการเรียนรู้ที่ดี'
    },
    {
      icon: UsersIcon,
      title: 'ชุมชนนักศึกษา',
      description: 'เป็นส่วนหนึ่งของชุมชนนักศึกษามหาวิทยาลัยเกษตรศาสตร์'
    },
    {
      icon: StarIcon,
      title: 'สร้างชื่อเสียง',
      description: 'สร้างแบรนด์ส่วนตัวในฐานะผู้เชี่ยวชาญและผู้แบ่งปันความรู้'
    },
    {
      icon: ClockIcon,
      title: 'ยืดหยุ่นเวลา',
      description: 'แบ่งปันความรู้ได้ตามเวลาที่สะดวก ไม่มีข้อจำกัดเรื่องเวลา'
    },
    {
      icon: ShieldCheckIcon,
      title: 'ปลอดภัย',
      description: 'ระบบที่ปลอดภัยและเชื่อถือได้ พร้อมการคุ้มครองข้อมูลส่วนตัว'
    },
    {
      icon: DocumentTextIcon,
      title: 'ง่ายดาย',
      description: 'อัพโหลดชีทได้ง่าย ระบบจัดการที่ใช้งานสะดวก'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.penName.trim()) {
      newErrors.penName = 'กรุณากรอกนามปากกาของคุณ';
    } else if (!/^[a-zA-Z0-9\u0E00-\u0E7F\s]+$/.test(formData.penName)) {
      newErrors.penName = 'นามปากกาต้องเป็นภาษาไทย ภาษาอังกฤษ หรือตัวเลขเท่านั้น';
    } else if (formData.penName.trim().length < 2) {
      newErrors.penName = 'นามปากกาต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อจริงของคุณ';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุลของคุณ';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0[0-9]{8,9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // อัพเดทข้อมูลชื่อและนามสกุลก่อน
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (fullName !== user?.fullName) {
        try {
          await authAPI.updateProfileName({
            fullName: fullName
          });
          // ยกเลิกการแสดง toast แจ้งเตือนการอัพเดทสำเร็จ
        } catch (profileError) {
          console.error('Profile update error:', profileError);
          if (profileError.response?.data?.errors) {
            // แสดง validation errors ที่เฉพาะเจาะจง
            const validationErrors = profileError.response.data.errors;
            const errorMessages = validationErrors.map(err => err.msg).join(', ');
            toast.error(`😔 ${errorMessages}`);
          } else {
            toast.error('😔 เกิดข้อผิดพลาดในการอัพเดทข้อมูลส่วนตัว กรุณาลองใหม่อีกครั้ง');
          }
          return;
        }
      }

      // ลงทะเบียนเป็น seller
      const response = await sellerAPI.registerSeller({
        pen_name: formData.penName,
        phone: formData.phone,
        bank_name: null,
        bank_account: null,
        account_name: null
      });

      if (response.data.success) {
        toast.success('🎉 คุณได้สมัครเป็นนักทำชีทสรุปสำเร็จแล้ว');
        // Update user data to reflect seller status and updated profile
        await getCurrentUser();
        // Navigate to seller profile page
        navigate('/seller/profile');
      }
    } catch (error) {
      console.error('SellerPage: Registration error:', error);
      console.error('SellerPage: Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        
        if (message === 'User is already registered as a seller') {
          toast.error('คุณเป็นนักทำชีทสรุปอยู่แล้ว! กำลังพาคุณไปหน้าโปรไฟล์');
          navigate('/seller/profile');
        } else if (message === 'Pen name is already taken') {
          toast.error('😅 นามปากกานี้มีคนใช้แล้ว กรุณาเลือกนามปากกาอื่น');
          // Set error in form with more specific message
          setErrors(prev => ({ ...prev, penName: '😅 นามปากกานี้มีคนใช้แล้ว กรุณาเลือกนามปากกาอื่น' }));
        } else {
          toast.error(`เกิดข้อผิดพลาด: ${message}`);
        }
      } else if (error.response?.data?.errors) {
        // แสดง validation errors ที่เฉพาะเจาะจง
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => `${err.path}: ${err.msg}`).join(', ');
        toast.error(`😔 ${errorMessages}`);
      } else {
        toast.error('😔 เกิดข้อผิดพลาดในการสมัคร กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Show loading while checking seller status
  if (isCheckingSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-700 mb-2">กำลังตรวจสอบสถานะของคุณ...</p>
          <p className="text-gray-500 text-sm">กรุณารอสักครู่นะครับ</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] opacity-90 z-0 rounded-b-[3rem] md:rounded-b-[5rem]" />
      <div className="relative z-10 container mx-auto px-4  pb-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <div className="relative">
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4 leading-tight animate-fadeInUp">
              สมัครเป็นนักทำชีทสรุป<br />
              <span className="block">KU SHEET</span>
            </h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mb-6 mx-auto md:mx-0 drop-shadow animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            เริ่มต้นการเดินทางในการแบ่งปันความรู้กับชุมชนนักศึกษา มหาวิทยาลัยเกษตรศาสตร์
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <img
              src={heroImg}
              alt="Hero"
              className="w-[400px] md:w-[500px] lg:w-[600px] transform -rotate-6 hover:rotate-0 transition-all duration-500 hover:scale-105 animate-float ml-4 md:ml-8"
            />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 container mx-auto px-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7c3aed] mb-12">
          ทำไมต้องแบ่งปันความรู้ที่ KU SHEET?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const cardGradients = [
              'from-pink-500 to-rose-600',
              'from-blue-500 to-indigo-600',
              'from-green-500 to-emerald-600',
              'from-purple-500 to-violet-600',
              'from-orange-500 to-red-600',
              'from-cyan-500 to-blue-600'
            ];
            const bgGradients = [
              'from-pink-50 to-rose-50',
              'from-blue-50 to-indigo-50',
              'from-green-50 to-emerald-50',
              'from-purple-50 to-violet-50',
              'from-orange-50 to-red-50',
              'from-cyan-50 to-blue-50'
            ];
            return (
              <div
                key={benefit.title}
                className={`bg-gradient-to-br ${bgGradients[index]} backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fadeInUp group`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >

                {/* Icon Container */}
                <div className={`w-16 h-16 bg-gradient-to-br ${cardGradients[index]} rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-8 h-8 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                </div>

                {/* Content */}
                <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${cardGradients[index]} bg-clip-text text-transparent`}>
                  {benefit.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Form Section */}
      <div className="relative z-20 max-w-xl mx-auto mb-16">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 md:p-12 hover:shadow-3xl transition-all duration-500">
          <h2 className="text-2xl font-extrabold text-center text-[#7c3aed] mb-8 drop-shadow">สมัครเป็นนักทำชีทสรุป</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pen Name */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                นามปากกา <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="penName"
                  value={formData.penName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    errors.penName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                  }`}
                  placeholder="เช่น ครูติวชีท, นักเขียนสรุป, ผู้เชี่ยวชาญ"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.penName && (
                <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.penName}</p>
              )}
            </div>
            {/* First Name */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                ชื่อ<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                  }`}
                  placeholder="เช่น สมชาย"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.firstName}</p>
              )}
            </div>
            {/* Last Name */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                  }`}
                  placeholder="เช่น ใจดี"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.lastName}</p>
              )}
            </div>
            {/* Phone */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                <PhoneIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                เบอร์โทรติดต่อ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                  }`}
                  placeholder="เช่น 0812345678"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.phone}</p>
              )}
            </div>
            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                              >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                        กำลังสมัครให้คุณ...
                      </>
                    ) : (
                      'สมัครเป็นนักทำชีทสรุป'
                    )}
                  </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="relative z-10 pb-12">
        <div className="max-w-2xl mx-auto text-center mt-8 px-4">
          <blockquote className="italic text-xl text-[#7c3aed] font-semibold bg-white/70 rounded-xl p-6 shadow-md border-l-4 border-[#8B5CF6]">
            "การแบ่งปันความรู้ คือการสร้างแรงบันดาลใจและโอกาสใหม่ ๆ ให้กับเพื่อนนักศึกษา"
          </blockquote>
        </div>
      </div>

      <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1) both;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
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
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-3000 {
            animation-delay: 3s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
    </div>
  );
};

export default SellerPage;