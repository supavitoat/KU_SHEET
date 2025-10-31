import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sellerAPI, authAPI } from '../../services/api';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SellerEditPage = () => {
  const navigate = useNavigate();
  const { user, getCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [formData, setFormData] = useState({
    penName: '',
    firstName: '',
    lastName: '',
    phone: '',
    bankName: '',
    bankAccount: '',
    accountName: '',
    promptPayId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Set form data from user (เหมือนหน้า infoEnter)
    if (user && user.fullName) {
      const parts = user.fullName.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      }));
    }
  }, [user]);

  const fetchSellerProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await sellerAPI.getSellerProfile();
      const profile = response.data.data;
      setSellerProfile(profile);
      // ใช้ข้อมูล seller profile เฉพาะข้อมูลอื่นๆ ไม่ใช่ชื่อ-นามสกุล
      setFormData(prev => ({
        ...prev, // เก็บข้อมูลชื่อ-นามสกุลไว้
        penName: profile.penName || profile.pen_name || '',
        phone: profile.phone || '',
        bankName: profile.bankName || profile.bank_name || '',
        bankAccount: profile.bankAccount || profile.bank_account || '',
        accountName: profile.accountName || profile.account_name || '',
        promptPayId: profile.promptPayId || profile.prompt_pay_id || ''
      }));
    } catch (error) {
      // ถ้าเจอ 403 (ยังไม่เป็น seller) ไม่ต้องทำอะไร เพราะข้อมูลชื่อ-นามสกุลถูก set แล้วจาก user
      if (error.response && error.response.status === 403) {
        setIsLoading(false);
        return;
      }
      toast.error('😔 ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
      navigate('/seller/profile');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSellerProfile();
    }
  }, [user, fetchSellerProfile]);



  const validateForm = () => {
    const newErrors = {};

    // Validate pen_name (required field)
    if (!formData.penName.trim()) {
      newErrors.penName = 'กรุณากรอกชื่อปากกา';
    } else if (formData.penName.trim().length < 2) {
      newErrors.penName = 'ชื่อปากกาต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
    } else if (formData.penName.trim().length > 50) {
      newErrors.penName = 'ชื่อปากกาต้องมีความยาวไม่เกิน 50 ตัวอักษร';
    }

    // Normalize phone by removing spaces/dashes
    const phoneDigits = (formData.phone || '').toString().replace(/[-\s]/g, '');
    if (phoneDigits && !/^0[0-9]{9}$/.test(phoneDigits)) {
      // Require exactly 10 digits and must start with 0
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 ตัวและขึ้นต้นด้วย 0 (เช่น 0812345678)';
    }

    // Validate bank account format if provided
    if (formData.bankAccount.trim() && !/^\d{10,12}$/.test(formData.bankAccount.trim().replace(/[-\s]/g, ''))) {
      newErrors.bankAccount = 'เลขบัญชีต้องเป็นตัวเลข 10-12 หลัก';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    // For phone field: allow only digits and limit to 10 characters
    if (name === 'phone') {
      value = (value || '').toString().replace(/\D/g, '');
      if (value.length > 10) value = value.slice(0, 10);
    }
    // For bank account and PromptPay: allow only digits
    if (name === 'bankAccount') {
      value = (value || '').toString().replace(/\D/g, '');
      // limit to 12 digits (common max length for bank accounts)
      if (value.length > 12) value = value.slice(0, 12);
    }
    if (name === 'promptPayId') {
      value = (value || '').toString().replace(/\D/g, '');
      // PromptPay may be phone (10) or national id (13) — allow up to 13
      if (value.length > 13) value = value.slice(0, 13);
    }
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      return newData;
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('😔 ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setIsSaving(true);

    try {
      // ตรวจสอบว่าข้อมูลครบหรือไม่
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error('😔 กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
        setIsSaving(false);
        return;
      }

      // Validate form data
      if (!validateForm()) {
        toast.error('😔 กรุณากรอกข้อมูลให้ถูกต้อง');
        setIsSaving(false);
        return;
      }

      // อัปเดตข้อมูล user ก่อน (เหมือนหน้า infoEnter)
      const userProfileData = {
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      };
      
      // เรียก updateProfileName API แทน updateProfile เพื่ออัปเดตเฉพาะชื่อ
      const userUpdateResult = await authAPI.updateProfileName(userProfileData);
      
      if (!userUpdateResult.data.success) {
        toast.error('😔 เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
        setIsSaving(false);
        return;
      }

      // Refresh user data หลังจากอัปเดตสำเร็จ
      await getCurrentUser();

      // อัปเดตข้อมูล seller (ถ้ามี)
      const sellerDataToSend = {
        pen_name: formData.penName.trim(),
        phone: formData.phone.trim(),
        bank_name: formData.bankName.trim(),
        bank_account: formData.bankAccount.trim(),
        account_name: formData.accountName.trim(),
        prompt_pay_id: formData.promptPayId.trim()
      };
      
      // ตรวจสอบว่าเป็น seller หรือไม่
      if (sellerProfile) {
        // ถ้าเป็น seller แล้ว ให้อัปเดต seller profile
        const response = await sellerAPI.updateSellerProfile(sellerDataToSend);
        
        if (!response.data.success) {
          toast.error('😔 เกิดข้อผิดพลาดในการอัปเดตข้อมูล seller');
          setIsSaving(false);
          return;
        }
        
        // อัปเดตข้อมูลใน state หลังจากอัปเดตสำเร็จ
        setSellerProfile(prev => ({
          ...prev,
          penName: formData.penName.trim(),
          phone: formData.phone.trim(),
          bankName: formData.bankName.trim(),
          bankAccount: formData.bankAccount.trim(),
          accountName: formData.accountName.trim(),
          promptPayId: formData.promptPayId.trim()
        }));
      } else {
        // ถ้ายังไม่เป็น seller ให้ register เป็น seller
        try {
          const registerResponse = await sellerAPI.registerSeller(sellerDataToSend);
          if (registerResponse.data.success) {
            // อัปเดตข้อมูลใน state หลังจาก register สำเร็จ
            setSellerProfile(registerResponse.data.data);
          }
        } catch (registerError) {
          console.error('Seller registration error:', registerError);
          // ไม่ต้องหยุดการทำงาน เพราะการอัปเดตชื่อสำเร็จแล้ว
        }
      }

      toast.success('🎉 อัปเดตข้อมูลสำเร็จ');
      navigate('/seller/profile');
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;

        if (message === 'Pen name is already taken') {
          toast.error('😅 นามปากกานี้มีคนใช้แล้ว กรุณาเลือกนามปากกาอื่น');
          setErrors(prev => ({ ...prev, penName: '😅 นามปากกานี้มีคนใช้แล้ว กรุณาเลือกนามปากกาอื่น' }));
        } else {
          toast.error(`เกิดข้อผิดพลาด: ${message}`);
        }
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        console.error('Validation errors:', errors);
        
        if (errors.bank_name) {
          toast.error(`ข้อมูลธนาคาร: ${errors.bank_name[0]}`);
        } else if (errors.bank_account) {
          toast.error(`เลขบัญชี: ${errors.bank_account[0]}`);
        } else if (errors.account_name) {
          toast.error(`ชื่อบัญชี: ${errors.account_name[0]}`);
        } else if (errors.fullName) {
          toast.error(`ชื่อ: ${errors.fullName[0]}`);
        } else {
          toast.error('กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
        }
      } else {
        toast.error('😔 เกิดข้อผิดพลาดในการอัปเดตข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }


  
  return (
    <div className="min-h-screen bg-white">

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 mt-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight py-2">
              แก้ไขข้อมูลนักทำชีทสรุป
            </h1>
          </div>
          <p className="text-gray-600 mb-6">อัปเดตข้อมูลส่วนตัวและข้อมูลธนาคารของคุณ</p>

          {/* Gradient Divider */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-1 rounded-full hover:w-32 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pen Name */}
              <div className="group animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                  <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                  นามปากกา
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="penName"
                    value={formData.penName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.penName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
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
              <div className="group animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                  <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                  ชื่อ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.firstName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                      }`}
                    placeholder="ชื่อจริงของคุณ"
                    data-testid="firstName-input"
                    data-value={formData.firstName}
                    data-debug={`firstName: "${formData.firstName}"`}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="group animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                  <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                  นามสกุล
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.lastName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                      }`}
                    placeholder="นามสกุลของคุณ"
                    data-testid="lastName-input"
                    data-value={formData.lastName}
                    data-debug={`lastName: "${formData.lastName}"`}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.lastName}</p>
                )}
              </div>

              {/* Phone */}
              <div className="group animate-fadeInUp" style={{ animationDelay: '1.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                  <PhoneIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                  เบอร์โทรติดต่อ
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    onPaste={(e) => {
                      // Ensure pasted value only keeps digits and does not exceed 10 chars
                      const paste = e.clipboardData.getData('text') || '';
                      const digits = paste.replace(/\D/g, '').slice(0, 10 - (formData.phone?.length || 0));
                      if (digits.length === 0) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      const newVal = (formData.phone + digits).slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: newVal }));
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.phone ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                      }`}
                    placeholder="เช่น 0812345678"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.phone}</p>
                )}
              </div>

              {/* Bank Information Section */}
              <div className="border-t pt-6 animate-fadeInUp" style={{ animationDelay: '1.3s' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCardIcon className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-sans leading-relaxed py-1">
                    ข้อมูลธนาคาร (สำหรับรับเงิน)
                  </span>
                </h3>
                
                {/* แสดงสถานะข้อมูลธนาคาร */}
                {/* ลบการแจ้งเตือนออกแล้ว */}

                {/* Account Name */}
                <div className="mb-4 group animate-fadeInUp" style={{ animationDelay: '1.5s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                    <UserIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                    ชื่อเจ้าของบัญชี
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.accountName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                        }`}
                      placeholder="กรอกชื่อเจ้าของบัญชี"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.accountName && (
                    <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.accountName}</p>
                  )}
                </div>

                {/* Bank Name */}
                <div className="mb-4 group animate-fadeInUp" style={{ animationDelay: '1.7s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                    <BuildingOfficeIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                    ชื่อธนาคาร
                  </label>
                  <div className="relative">
                    <select
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className={`appearance-none w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.bankName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'}`}
                    >
                      <option value="">เลือกธนาคาร</option>
                      {[
                        'กสิกรไทย',
                        'ไทยพาณิชย์',
                        'กรุงเทพ',
                        'กรุงไทย',
                        'กรุงศรีอยุธยา',
                        'ทหารไทยธนชาต',
                        'ออมสิน',
                        'ธ.ก.ส.',
                        'ยูโอบี',
                        'ซีไอเอ็มบี',
                        'แลนด์แอนด์เฮ้าส์',
                        // Removed 'อื่นๆ'
                      ].map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.bankName}</p>
                  )}
                </div>

                {/* Bank Account */}
                <div className="mb-4 group animate-fadeInUp" style={{ animationDelay: '1.9s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                    <CreditCardIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                    เลขบัญชีธนาคาร
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text') || '';
                        const digits = paste.replace(/\D/g, '').slice(0, 12 - (formData.bankAccount?.length || 0));
                        if (digits.length === 0) {
                          e.preventDefault();
                          return;
                        }
                        e.preventDefault();
                        const newVal = (formData.bankAccount + digits).slice(0, 12);
                        setFormData(prev => ({ ...prev, bankAccount: newVal }));
                        if (errors.bankAccount) setErrors(prev => ({ ...prev, bankAccount: '' }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.bankAccount ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                        }`}
                      placeholder="กรอกเลขบัญชีธนาคาร"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.bankAccount && (
                    <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.bankAccount}</p>
                  )}
                </div>

                {/* PromptPay ID */}
                <div className="mb-4 group animate-fadeInUp" style={{ animationDelay: '2.1s' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">
                    <CreditCardIcon className="w-4 h-4 inline mr-2 group-hover:scale-110 transition-transform" />
                    หมายเลข PromptPay
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="promptPayId"
                      value={formData.promptPayId}
                      onChange={handleInputChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={13}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData('text') || '';
                        const digits = paste.replace(/\D/g, '').slice(0, 13 - (formData.promptPayId?.length || 0));
                        if (digits.length === 0) {
                          e.preventDefault();
                          return;
                        }
                        e.preventDefault();
                        const newVal = (formData.promptPayId + digits).slice(0, 13);
                        setFormData(prev => ({ ...prev, promptPayId: newVal }));
                        if (errors.promptPayId) setErrors(prev => ({ ...prev, promptPayId: '' }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.promptPayId ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'
                        }`}
                      placeholder="เบอร์โทร หรือ เลขบัตรประชาชน"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.promptPayId && (
                    <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.promptPayId}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-8 animate-fadeInUp" style={{ animationDelay: '2.3s' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center">
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                        กำลังบันทึกข้อมูล...
                      </>
                    ) : (
                      'บันทึกการเปลี่ยนแปลง'
                    )}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Back Button - Outside Form */}
        <div className="text-center mt-8 animate-fadeInUp" style={{ animationDelay: '2.4s' }}>
          <button
            onClick={() => navigate('/seller/profile')}
            className="mx-auto px-8 py-3 text-purple-600 hover:text-purple-700 hover:underline transition-all duration-300 font-medium"
          >
            กลับไปหน้าโปรไฟล์
          </button>
        </div>
      </div>

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
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-gradient-flow {
          background: linear-gradient(90deg, #9333ea, #7c3aed, #3b82f6, #4f46e5, #9333ea, #7c3aed, #3b82f6, #4f46e5);
          background-size: 200% 100%;
          animation: gradientFlow 6s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

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
      `}</style>
    </div>
  );
};

export default SellerEditPage;