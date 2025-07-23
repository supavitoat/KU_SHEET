import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const InfoEnterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const faculties = [
    { id: 'F1', name: 'คณะเกษตร กำแพงแสน' },
    { id: 'F2', name: 'คณะวิศวกรรมศาสตร์ กำแพงแสน' },
    { id: 'F3', name: 'คณะวิทยาศาสตร์การกีฬาและสุขภาพ' },
    { id: 'F4', name: 'คณะศิลปศาสตร์และวิทยาศาสตร์' },
    { id: 'F5', name: 'คณะศึกษาศาสตร์และพัฒนศาสตร์' },
    { id: 'F6', name: 'คณะสัตวแพทยศาสตร์' },
    { id: 'F7', name: 'คณะอุตสาหกรรมบริการ' },
  ];

  const getMajors = (facultyId) => {
    switch (facultyId) {
      case 'F1':
        return [
          { id: 'F1M1', name: 'ภาควิชากีฏวิทยา' },
          { id: 'F1M2', name: 'ภาควิชาเกษตรกลวิธาน' },
          { id: 'F1M3', name: 'ภาควิชาปฐพีวิทยา' },
          { id: 'F1M4', name: 'ภาควิชาพืชไร่นา' },
          { id: 'F1M5', name: 'ภาควิชาพืชสวน' },
          { id: 'F1M6', name: 'ภาควิชาโรคพืช' },
        ];
      case 'F2':
        return [
          { id: 'F2M1', name: 'ภาควิชาวิศวกรรมเกษตร' },
          { id: 'F2M2', name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' },
          { id: 'F2M3', name: 'ภาควิชาวิศวกรรมเครื่องกล' },
          { id: 'F2M4', name: 'ภาควิชาวิศวกรรมชลประทาน' },
          { id: 'F2M5', name: 'ภาควิชาวิศวกรรมโยธา' },
          { id: 'F2M6', name: 'ภาควิชาวิศวกรรมอุตสาหการ' },
          { id: 'F2M7', name: 'ภาควิชาวิศวกรรมการอาหาร' },
        ];
      case 'F3':
        return [
          { id: 'F3M1', name: 'ภาควิชาการจัดการการกีฬาและสุขภาพ' },
          { id: 'F3M2', name: 'ภาควิชาวิทยาศาสตร์การกีฬา' },
          { id: 'F3M3', name: 'ภาควิชาวิทยาศาสตร์สุขภาพและการเคลื่อนไหว' },
        ];
      case 'F4':
        return [
          { id: 'F4M1', name: 'สาขาวิชาการจัดการ' },
          { id: 'F4M2', name: 'สาขาวิชาการตลาด' },
          { id: 'F4M3', name: 'สาขาวิชาการบัญชี' },
          { id: 'F4M4', name: 'สาขาวิชาคณิตศาสตร์และสถิติ' },
          { id: 'F4M5', name: 'สาขาวิชาเคมี' },
          { id: 'F4M6', name: 'สาขาวิชาชีวเคมี' },
          { id: 'F4M7', name: 'สาขาวิชาชีววิทยา' },
          { id: 'F4M8', name: 'สาขาวิชาเทคโนโลยีสารสนเทศและการสื่อสาร' },
          { id: 'F4M9', name: 'สาขาวิชานวัตกรรมสังคม รัฐประศาสนศาสตร์ และนิติศาสตร์' },
          { id: 'F4M10', name: 'สาขาวิชาบรรณารักษศาสตร์' },
          { id: 'F4M11', name: 'สาขาวิชาปรัชญาและศาสนา' },
          { id: 'F4M12', name: 'สาขาวิชาพันธุศาสตร์' },
          { id: 'F4M13', name: 'สาขาวิชาฟิสิกส์' },
          { id: 'F4M14', name: 'สาขาวิชาภาษาจีน' },
          { id: 'F4M15', name: 'สาขาวิชาภาษาญี่ปุ่น' },
          { id: 'F4M16', name: 'สาขาวิชาภาษาไทย' },
          { id: 'F4M17', name: 'สาขาวิชาภาษาฝรั่งเศส' },
          { id: 'F4M18', name: 'สาขาวิชารัฐศาสตร์' },
          { id: 'F4M19', name: 'สาขาวิชาวิทยาการคอมพิวเตอร์' },
          { id: 'F4M20', name: 'สาขาวิชาสัตววิทยา' },
        ];
      case 'F5':
        return [
          { id: 'F5M1', name: 'ภาควิชาการพัฒนาทรัพยากรมนุษย์และชุมชน' },
          { id: 'F5M2', name: 'ภาควิชาครุศึกษา' },
          { id: 'F5M3', name: 'ภาควิชาพลศึกษาและกีฬา' },
        ];
      case 'F6':
        return [
          { id: 'F6M1', name: 'ภาควิชาเวชศาสตร์คลินิกสัตว์เลี้ยง' },
          { id: 'F6M2', name: 'ภาควิชาเวชศาสตร์คลินิกสัตว์ใหญ่และสัตว์ป่า' },
          { id: 'F6M3', name: 'ภาควิชาเวชศาสตร์และทรัพยากรการผลิตสัตว์' },
          { id: 'F6M4', name: 'ภาควิชาสัตวแพทยสาธารณสุขศาสตร์' },
        ];
      case 'F7':
        return [
          { id: 'F7M1', name: 'สาขาวิชาการจัดการธุรกิจการบิน' },
          { id: 'F7M2', name: 'สาขาวิชาการจัดการธุรกิจบริการและอุตสาหกรรมไมซ์' },
          { id: 'F7M3', name: 'สาขาวิชาการจัดการอุตสาหกรรมการบริการ' },
          { id: 'F7M4', name: 'สาขาวิชาการโรงแรมและภัตตาคาร' },
          { id: 'F7M5', name: 'สาขาวิชาการสร้างสรรค์การบริการเพื่อธุรกิจการท่องเที่ยว' },
          { id: 'F7M6', name: 'สาขาวิชานวัตกรรมบริการและการสื่อสารระหว่างวัฒนธรรม' },
          { id: 'F7M7', name: 'สาขาวิชาภาษาอังกฤษเพื่ออุตสาหกรรมบริการ' },
          { id: 'F7M8', name: 'สาขาอุตสาหกรรมการท่องเที่ยวและบริการ' },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    // Check for temporary registration data
    const tempRegistration = localStorage.getItem('tempRegistration');
    if (!tempRegistration) {
      navigate('/register');
      return;
    }

    // Check if registration data is expired (30 minutes)
    const registrationData = JSON.parse(tempRegistration);
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - registrationData.timestamp > thirtyMinutes) {
      localStorage.removeItem('tempRegistration');
      toast.error('ข้อมูลการลงทะเบียนหมดอายุ กรุณาลงทะเบียนใหม่');
      navigate('/register');
    }
  }, [navigate]);

  // Update majors when faculty changes
  useEffect(() => {
    setMajor(''); // Reset major when faculty changes
  }, [faculty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!firstName.trim()) {
      setError('กรุณากรอกชื่อ');
      setIsLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError('กรุณากรอกนามสกุล');
      setIsLoading(false);
      return;
    }

    if (!faculty) {
      setError('กรุณาเลือกคณะ');
      setIsLoading(false);
      return;
    }

    if (!year) {
      setError('กรุณาเลือกชั้นปี');
      setIsLoading(false);
      return;
    }

    try {
      // Get registration data
      const tempRegistration = localStorage.getItem('tempRegistration');
      if (!tempRegistration) {
        throw new Error('ไม่พบข้อมูลการลงทะเบียน');
      }

      const registrationData = JSON.parse(tempRegistration);

      // Get faculty and major names
      const selectedFaculty = faculties.find(f => f.id === faculty)?.name || '';
      const selectedMajor = getMajors(faculty).find(m => m.id === major)?.name || '';

      // Register user with complete data
      const result = await register({
        email: registrationData.email,
        password: registrationData.password,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        faculty: selectedFaculty,
        major: selectedMajor || null,
        year: parseInt(year),
        profileCompleted: true,
        isFirstLogin: false
      });

      if (result.success) {
        // Clear temporary registration data
        localStorage.removeItem('tempRegistration');
        navigate('/');
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
          error.message || error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] animate-slideUp">
        <h1 className="text-2xl font-bold text-center mb-8">แนะนำตัวคุณหน่อย</h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              value={JSON.parse(localStorage.getItem('tempRegistration') || '{}').email || ''}
              readOnly
              className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">คณะ</label>
            <div className="relative">
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors appearance-none"
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
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สาขา</label>
            <div className="relative">
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors appearance-none"
                disabled={isLoading || !faculty}
              >
                <option value="">เลือกสาขา</option>
                {getMajors(faculty).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชั้นปี</label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#853EF4] focus:bg-white transition-colors appearance-none"
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
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-8 bg-gradient-to-r from-[#853EF4] to-[#6300FF] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึกข้อมูล...
              </>
            ) : (
              'เริ่มต้นใช้งาน'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InfoEnterPage;