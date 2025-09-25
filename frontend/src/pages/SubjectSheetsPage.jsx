import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpenIcon, 
  DocumentTextIcon, 
  StarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SubjectSheetsPage = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const subjects = [
    {
      id: 'all',
      name: 'ทุกวิชา',
      icon: '📚',
      description: 'ชีทสรุปทุกวิชา',
      sheetCount: 1250
    },
    {
      id: 'calculus',
      name: 'แคลคูลัส',
      icon: '∫',
      description: 'แคลคูลัส 1, 2, 3',
      sheetCount: 180
    },
    {
      id: 'chemistry',
      name: 'เคมี',
      icon: '🧪',
      description: 'เคมีทั่วไป, เคมีอินทรีย์',
      sheetCount: 150
    },
    {
      id: 'statistics',
      name: 'สถิติ',
      icon: '📊',
      description: 'สถิติเบื้องต้น, สถิติธุรกิจ',
      sheetCount: 120
    },
    {
      id: 'physics',
      name: 'ฟิสิกส์',
      icon: '⚡',
      description: 'ฟิสิกส์ 1, 2, 3',
      sheetCount: 160
    },
    {
      id: 'biology',
      name: 'ชีววิทยา',
      icon: '🧬',
      description: 'ชีววิทยา, ชีวเคมี',
      sheetCount: 140
    },
    {
      id: 'economics',
      name: 'เศรษฐศาสตร์',
      icon: '💰',
      description: 'เศรษฐศาสตร์เบื้องต้น, เศรษฐศาสตร์จุลภาค',
      sheetCount: 100
    },
    {
      id: 'english',
      name: 'ภาษาอังกฤษ',
      icon: '🇬🇧',
      description: 'ภาษาอังกฤษพื้นฐาน, ภาษาอังกฤษธุรกิจ',
      sheetCount: 80
    },
    {
      id: 'mathematics',
      name: 'คณิตศาสตร์',
      icon: '🔢',
      description: 'คณิตศาสตร์พื้นฐาน, พีชคณิต',
      sheetCount: 200
    },
    {
      id: 'programming',
      name: 'การเขียนโปรแกรม',
      icon: '💻',
      description: 'Python, Java, C++',
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
    },
    {
      id: 7,
      title: 'ชีทสรุปวิชาภาษาอังกฤษพื้นฐาน',
      faculty: 'คณะศิลปศาสตร์',
      subject: 'ภาษาอังกฤษพื้นฐาน',
      price: 80,
      rating: 4.1,
      downloadCount: 650,
      viewCount: 1500,
      imageUrl: 'https://via.placeholder.com/300x400/06B6D4/FFFFFF?text=ภาษาอังกฤษ',
      isFree: false
    },
    {
      id: 8,
      title: 'ชีทสรุปวิชาคณิตศาสตร์พื้นฐาน',
      faculty: 'คณะวิทยาศาสตร์',
      subject: 'คณิตศาสตร์พื้นฐาน',
      price: 90,
      rating: 4.8,
      downloadCount: 1200,
      viewCount: 3000,
      imageUrl: 'https://via.placeholder.com/300x400/84CC16/FFFFFF?text=คณิตศาสตร์',
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
    const matchesSubject = selectedSubject === 'all' || sheet.subject.toLowerCase().includes(subjects.find(s => s.id === selectedSubject)?.name.toLowerCase() || '');
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sheet.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSubject && matchesSearch;
  });

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
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
            <div className="bg-purple-100 p-3 rounded-full">
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ชีทสรุปตามวิชา</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ค้นหาชีทสรุปคุณภาพสูงตามวิชาที่คุณต้องการเรียน
          </p>
        </div>

        {/* Subject Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">เลือกวิชา</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject.id)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedSubject === subject.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{subject.icon}</div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{subject.name}</h3>
                  <p className="text-gray-500 text-xs mb-2">{subject.description}</p>
                  <span className="text-purple-600 text-xs font-medium">
                    {subject.sheetCount} ชีท
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบชีทสรุป <span className="font-semibold text-purple-600">{filteredSheets.length}</span> รายการ
            {selectedSubject !== 'all' && (
              <span> ในวิชา {subjects.find(s => s.id === selectedSubject)?.name}</span>
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
                    <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ฿{sheet.price}
                    </div>
                  )}
                </div>

                {/* Sheet Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-2">
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
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                      เพิ่มลงตะกร้า
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบชีทสรุป</h3>
            <p className="text-gray-600">ลองเปลี่ยนวิชาหรือคำค้นหา</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            ต้องการชีทสรุปวิชาอื่น?
          </h2>
          <p className="text-purple-100 mb-6">
            ดูชีทสรุปจากทุกวิชาหรือค้นหาตามคณะที่ต้องการ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/shop"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              ดูชีทสรุปทั้งหมด
            </a>
            <a
              href="/faculty-sheets"
              className="bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition-colors border border-white"
            >
              ชีทตามคณะ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSheetsPage;
