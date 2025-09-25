import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { CoolMode } from "@/components/magicui/cool-mode";
import toast from 'react-hot-toast';
import { clearTempRegistration } from "../../utils/localStorage";
import { facultiesList, majorsList } from "../../constants/academics";

const InfoEnterPage = () => {
  const { register, updateProfile, user } = useAuth();
  // ดึงชื่อและนามสกุลจาก user หรือ tempRegistration
  const tempRegistration = localStorage.getItem('tempRegistration');
  let initialFirstName = "";
  let initialLastName = "";
  if (tempRegistration) {
    const reg = JSON.parse(tempRegistration);
    if (reg.fullName) {
      const parts = reg.fullName.split(" ");
      initialFirstName = parts[0] || "";
      initialLastName = parts.slice(1).join(" ") || "";
    }
  } else if (user && user.fullName) {
    const parts = user.fullName.split(" ");
    initialFirstName = parts[0] || "";
    initialLastName = parts.slice(1).join(" ") || "";
  }
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const faculties = facultiesList;

  const getMajors = (facultyId) => {
    if (!facultyId) return [];
    return majorsList.filter((major) => major.facultyId === parseInt(facultyId));
  };

  useEffect(() => {
    // ถ้าไม่มี tempRegistration และไม่ได้ login ด้วย Google (isFirstLogin)
    if (!tempRegistration && !(user && (user.isFirstLogin || user.is_first_login))) {
      navigate('/register');
      return;
    }
    
    // ถ้ามี tempRegistration ให้เช็คอายุข้อมูลและตรวจสอบ user
    if (tempRegistration) {
      try {
        const registrationData = JSON.parse(tempRegistration);
        const thirtyMinutes = 30 * 60 * 1000;
        
        // เช็คอายุข้อมูล
        if (Date.now() - registrationData.timestamp > thirtyMinutes) {
          localStorage.removeItem('tempRegistration');
          toast.error('⏰ ข้อมูลการลงทะเบียนหมดอายุ กรุณาลงทะเบียนใหม่');
          navigate('/register');
          return;
        }
        
        // ตรวจสอบว่า user ที่ login อยู่เป็นคนเดียวกับที่กำลังสมัครหรือไม่
        if (user && user.email && registrationData.email && user.email !== registrationData.email) {
          // ถ้า email ไม่ตรงกัน ให้ลบ tempRegistration และ redirect ไปหน้า register
          localStorage.removeItem('tempRegistration');
          toast.error('🔐 ตรวจพบข้อมูลการลงทะเบียนของบัญชีอื่น กรุณาลงทะเบียนใหม่');
          navigate('/register');
          return;
        }
        
        // ตรวจสอบเพิ่มเติม: ถ้า user login แล้วแต่มี tempRegistration ให้ลบ tempRegistration
        if (user && user.email && !user.isFirstLogin && !user.is_first_login) {
          // ถ้า user login แล้วและไม่ใช่ first login ให้ลบ tempRegistration
          localStorage.removeItem('tempRegistration');
          toast.error('🔐 ตรวจพบข้อมูลการลงทะเบียนที่ไม่ตรงกับบัญชีปัจจุบัน');
          navigate('/register');
          return;
        }
  } catch {
        // ถ้า parse tempRegistration ไม่ได้ ให้ลบออก
        localStorage.removeItem('tempRegistration');
        toast.error('❌ ข้อมูลการลงทะเบียนเสียหาย กรุณาลงทะเบียนใหม่');
        navigate('/register');
        return;
      }
    }
  }, [navigate, user, tempRegistration]);

  // Cleanup tempRegistration when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // ลบ tempRegistration เมื่อ user ปิดแท็บหรือรีเฟรชหน้า
      if (tempRegistration) {
        const registrationData = JSON.parse(tempRegistration);
        // ถ้าเป็น Google user และยังไม่ได้สมัครเสร็จ ให้ลบ tempRegistration
        if (registrationData.credential) {
          localStorage.removeItem('tempRegistration');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tempRegistration]);

  // Update majors when faculty changes
  useEffect(() => {
    setMajor(''); // Reset major when faculty changes
  }, [faculty]);

  const handleCancel = () => {
    // ลบ tempRegistration และ redirect ไปหน้า register
    clearTempRegistration();
    navigate('/register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!firstName.trim()) {
      setError('👤 กรุณากรอกชื่อจริงของคุณ');
      setIsLoading(false);
      return;
    }
    if (!lastName.trim()) {
      setError('👤 กรุณากรอกนามสกุลของคุณ');
      setIsLoading(false);
      return;
    }
    if (!faculty) {
      setError('🎓 กรุณาเลือกคณะที่คุณเรียนอยู่');
      setIsLoading(false);
      return;
    }
    if (!year) {
      setError('📚 กรุณาเลือกชั้นปีที่คุณเรียนอยู่');
      setIsLoading(false);
      return;
    }
    // Major is optional, no validation needed

    try {
      let email = '', password = '';
      let isGoogle = false;
      let credential = null;
      const tempRegistration = localStorage.getItem('tempRegistration');
      if (tempRegistration) {
        const reg = JSON.parse(tempRegistration);
        if (reg.credential) {
          // Google user
          isGoogle = true;
          credential = reg.credential;
          email = reg.email;
        } else {
          // สมัครปกติ
          email = reg.email;
          password = reg.password;
        }
      } else if (user && user.email) {
        email = user.email;
        isGoogle = true;
      }

      // Get faculty and major names
      const selectedFaculty = faculties.find(f => f.id === parseInt(faculty))?.name || '';
      const selectedMajor = getMajors(parseInt(faculty)).find(m => m.id === parseInt(major))?.name || '';

      // เตรียมข้อมูลสำหรับอัปเดตโปรไฟล์
      const profileData = {
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        faculty: selectedFaculty,
        year: parseInt(year),
        profileCompleted: true,
        isFirstLogin: false
      };
      if (selectedMajor) profileData.major = selectedMajor;

      // Debug log
      if (isGoogle && credential) {
        // Google first login: สร้าง user จริง
        try {
          sessionStorage.setItem('showLoginToast', '1');
          
          const res = await fetch('http://localhost:5000/api/auth/google/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              credential,
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              faculty: selectedFaculty,
              major: selectedMajor,
              year: year
            })
          });
          const data = await res.json();
          if (data.success && data.token && data.user) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.removeItem('tempRegistration');
            window.location.reload();
            return;
          } else {
            setError(data.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี Google');
            setIsLoading(false);
            return;
          }
  } catch {
          setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ Google Register');
          setIsLoading(false);
          return;
        }
      }
      // สมัครปกติหรือ Google ที่ login สำเร็จแล้ว (updateProfile)
      let result;
      if (isGoogle) {
        sessionStorage.setItem('showLoginToast', '1');
        result = await updateProfile(profileData);
        window.location.reload();
        return;
      } else {
        sessionStorage.setItem('showLoginToast', '1');
        result = await register({
          email,
          password,
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          faculty: selectedFaculty,
          major: selectedMajor,
          year: parseInt(year)
        });
      }

      if (result.success) {
        // สมัครสมาชิกปกติ: set token, user, ลบ tempRegistration, reload เหมือน Google
        if (result.token && result.user) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        localStorage.removeItem('tempRegistration');
        window.location.reload();
        return;
      } else {
        setError(result.message || '😔 เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
  } catch (error) {
      console.error('Registration failed:', error);
      if (error.response?.data?.errors) {
        // Show validation errors from backend
        const validationErrors = error.response.data.errors
          .map(err => err.msg)
          .join(', ');
        setError(validationErrors);
      } else {
        setError(
          error.message || error.response?.data?.message || '😔 เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงอีเมลจาก tempRegistration หรือ user.email
  let emailValue = '';
  if (tempRegistration) {
    emailValue = JSON.parse(tempRegistration).email || '';
  } else if (user && user.email) {
    emailValue = user.email;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-6">

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[480px] bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl transition-all duration-300 border border-white/30 animate-fade-in-up animation-delay-200">
        <h1 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent animate-fade-in-up animation-delay-300">แนะนำตัวคุณหน่อย</h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg animate-fade-in-up animation-delay-400">
            {error}
          </div>
        )}

        {/* Information Text */}
        <div className="mb-6 text-center animate-fade-in-up animation-delay-450">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-blue-600">💡 แนะนำ:</span> โปรดกรอกข้อมูลให้เสร็จสิ้น
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            และกดปุ่มเริ่มต้นใช้งาน จึงจะสร้างบัญชีสำเร็จ
          </p>
        </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-fade-in-up animation-delay-500">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ชื่อ</label>
              <div className="relative group">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-12 px-4 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:border-purple-400 hover:shadow-lg disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

                      <div className="space-y-2 animate-fade-in-up animation-delay-600">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">นามสกุล</label>
              <div className="relative group">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-12 px-4 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:border-purple-400 hover:shadow-lg disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

                      <div className="space-y-2 animate-fade-in-up animation-delay-700">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">อีเมล</label>
              <div className="relative group">
                <input
                  type="email"
                  value={emailValue}
                  readOnly
                  className="w-full h-12 px-4 bg-white/30 backdrop-blur-sm rounded-xl border-2 border-gray-200 text-gray-500"
                />
              </div>
            </div>

                      <div className="space-y-2 animate-fade-in-up animation-delay-800">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">คณะ</label>
              <div className="relative group">
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full h-12 px-4 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:border-purple-400 hover:shadow-lg disabled:opacity-50 appearance-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">เลือกคณะ</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300" />
              </div>
            </div>

                      <div className="space-y-2 animate-fade-in-up animation-delay-900">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">สาขา</label>
              <div className="relative group">
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full h-12 px-4 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:border-purple-400 hover:shadow-lg disabled:opacity-50 appearance-none"
                  disabled={isLoading || !faculty}
                >
                  <option value="">เลือกสาขา</option>
                  {getMajors(parseInt(faculty)).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300" />
              </div>
            </div>

                      <div className="space-y-2 animate-fade-in-up animation-delay-1000">
              <label className="block text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ชั้นปี</label>
              <div className="relative group">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-12 px-4 bg-white/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white/80 transition-all duration-300 hover:border-purple-400 hover:shadow-lg disabled:opacity-50 appearance-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">เลือกชั้นปี</option>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      ชั้นปีที่ {y}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300" />
              </div>
            </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-12 text-gray-600 bg-gray-100 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:transform-none overflow-hidden group animate-fade-in-up animation-delay-1100"
            >
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>ยกเลิก</span>
              </span>
            </button>

            <CoolMode>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:transform-none overflow-hidden group animate-fade-in-up animation-delay-1100"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Button content */}
              <span className="relative flex items-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>เริ่มต้นใช้งาน</span>
                  </>
                )}
              </span>
            </button>
            </CoolMode>
          </div>
        </form>
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

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
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

export default InfoEnterPage;