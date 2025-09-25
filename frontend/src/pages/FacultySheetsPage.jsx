import React, { useState, useEffect, useMemo } from 'react';
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  StarIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FacultySheetsPage = () => {
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const faculties = [
    {
      id: 'all',
      name: 'ทุกคณะ',
      icon: '🏛️',
      description: 'ชีทสรุปจากทุกคณะ',
      sheetCount: 1250
    },
    {
      id: 'engineering',
      name: 'คณะวิศวกรรมศาสตร์',
      icon: '⚙️',
      description: 'ชีทสรุปวิศวกรรมศาสตร์',
      sheetCount: 320
    },
    {
      id: 'science',
      name: 'คณะวิทยาศาสตร์',
      icon: '🔬',
      description: 'ชีทสรุปวิทยาศาสตร์',
      sheetCount: 280
    },
    {
      id: 'agriculture',
      name: 'คณะเกษตร',
      icon: '🌾',
      description: 'ชีทสรุปเกษตรศาสตร์',
      sheetCount: 250
    },
    {
      id: 'economics',
      name: 'คณะเศรษฐศาสตร์',
      icon: '💰',
      description: 'ชีทสรุปเศรษฐศาสตร์',
      sheetCount: 180
    },
    {
      id: 'arts',
      name: 'คณะศิลปศาสตร์',
      icon: '🎨',
      description: 'ชีทสรุปศิลปศาสตร์',
      sheetCount: 120
    },
    {
      id: 'veterinary',
      name: 'คณะสัตวแพทยศาสตร์',
      icon: '🐾',
      description: 'ชีทสรุปสัตวแพทยศาสตร์',
      sheetCount: 80
    },
    {
      id: 'education',
      name: 'คณะศึกษาศาสตร์',
      icon: '📚',
      description: 'ชีทสรุปศึกษาศาสตร์',
      sheetCount: 90
    }
  ];

  // Mock data for demonstration
  const mockSheets = useMemo(() => [
    {
      id: 1,
      title: 'ชีทสรุปวิชาแคลคูลัส 1',
      faculty: 'คณะวิศวกรรมศาสตร์',
      subject: 'แคลคูลัส 1',
      price: 150,
      rating: 4.5,
      downloadCount: 1250,
      viewCount: 3200,
      imageUrl: 'https://via.placeholder.com/300x400/3B82F6/FFFFFF?text=แคลคูลัส+1',
      isFree: false
    },
    {
      id: 2,
      title: 'ชีทสรุปวิชาเคมีทั่วไป',
      faculty: 'คณะวิทยาศาสตร์',
      subject: 'เคมีทั่วไป',
      price: 120,
      rating: 4.2,
      downloadCount: 890,
      viewCount: 2100,
      imageUrl: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=เคมีทั่วไป',
      isFree: false
    },
    {
      id: 3,
      title: 'ชีทสรุปวิชาสถิติเบื้องต้น',
      faculty: 'คณะเกษตร',
      subject: 'สถิติเบื้องต้น',
      price: 100,
      rating: 4.7,
      downloadCount: 1560,
      viewCount: 4100,
      imageUrl: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=สถิติเบื้องต้น',
      isFree: false
    },
    {
      id: 4,
      title: 'ชีทสรุปวิชาฟิสิกส์ 1',
      faculty: 'คณะวิศวกรรมศาสตร์',
      subject: 'ฟิสิกส์ 1',
      price: 130,
      rating: 4.3,
      downloadCount: 1100,
      viewCount: 2800,
      imageUrl: 'https://via.placeholder.com/300x400/EF4444/FFFFFF?text=ฟิสิกส์+1',
      isFree: false
    },
    {
      id: 5,
      title: 'ชีทสรุปวิชาชีววิทยา',
      faculty: 'คณะวิทยาศาสตร์',
      subject: 'ชีววิทยา',
      price: 110,
      rating: 4.6,
      downloadCount: 980,
      viewCount: 2400,
      imageUrl: 'https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=ชีววิทยา',
      isFree: false
    },
    {
      id: 6,
      title: 'ชีทสรุปวิชาเศรษฐศาสตร์เบื้องต้น',
      faculty: 'คณะเศรษฐศาสตร์',
      subject: 'เศรษฐศาสตร์เบื้องต้น',
      price: 95,
      rating: 4.4,
      downloadCount: 750,
      viewCount: 1800,
      imageUrl: 'https://via.placeholder.com/300x400/EC4899/FFFFFF?text=เศรษฐศาสตร์',
      isFree: false
    }
  ], []);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSheets(mockSheets);
      setLoading(false);
    }, 1000);
  }, [mockSheets]);

  const filteredSheets = sheets.filter(sheet => {
    const matchesFaculty = selectedFaculty === 'all' || sheet.faculty.includes(faculties.find(f => f.id === selectedFaculty)?.name || '');
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFaculty && matchesSearch;
  });

  const handleFacultySelect = (facultyId) => {
    setSelectedFaculty(facultyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ชีทสรุปตามคณะ</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ค้นหาชีทสรุปคุณภาพสูงจากคณะต่างๆ ของมหาวิทยาลัยเกษตรศาสตร์
          </p>
        </div>

        {/* Faculty Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">เลือกคณะ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {faculties.map((faculty) => (
              <button
                key={faculty.id}
                onClick={() => handleFacultySelect(faculty.id)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedFaculty === faculty.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{faculty.icon}</div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{faculty.name}</h3>
                  <p className="text-gray-500 text-xs mb-2">{faculty.description}</p>
                  <span className="text-blue-600 text-xs font-medium">
                    {faculty.sheetCount} ชีท
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชีทสรุป..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบชีทสรุป <span className="font-semibold text-blue-600">{filteredSheets.length}</span> รายการ
            {selectedFaculty !== 'all' && (
              <span> จาก {faculties.find(f => f.id === selectedFaculty)?.name}</span>
            )}
          </p>
        </div>

        {/* Sheets Grid */}
        {filteredSheets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSheets.map((sheet) => (
              <div key={sheet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Sheet Image */}
                <div className="relative">
                  <img
                    src={sheet.imageUrl}
                    alt={sheet.title}
                    className="w-full h-48 object-cover"
                  />
                  {sheet.isFree ? (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ฟรี
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ฿{sheet.price}
                    </div>
                  )}
                </div>

                {/* Sheet Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                      {sheet.faculty}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {sheet.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {sheet.description || `ชีทสรุปวิชา${sheet.subject}`}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>{sheet.rating}</span>
                    </div>
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span>{sheet.downloadCount}</span>
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span>{sheet.viewCount}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {sheet.isFree ? (
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      ดาวน์โหลดฟรี
                    </button>
                  ) : (
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      เพิ่มลงตะกร้า
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบชีทสรุป</h3>
            <p className="text-gray-600">ลองเปลี่ยนคณะหรือคำค้นหา</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            ต้องการชีทสรุปจากคณะอื่น?
          </h2>
          <p className="text-blue-100 mb-6">
            ดูชีทสรุปจากทุกคณะหรือค้นหาตามวิชาที่ต้องการ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/shop"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              ดูชีทสรุปทั้งหมด
            </a>
            <a
                              href="#"
              className="bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors border border-white"
            >
              ชีทสรุปฟรี
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySheetsPage;
