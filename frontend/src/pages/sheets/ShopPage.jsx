import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';

import { sheetsAPI, getProfilePictureURL } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductCard from '../../components/common/ProductCard';
import { facultiesList, majorsList } from '../../constants/academics';
import { formatCurrency, formatDate } from '../../utils/format';
import { getFacultyColors } from '../../utils/facultyColors';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  HeartIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const ShopPage = () => {
  // removed unused navigate
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();
 
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [faculty, setFaculty] = useState(searchParams.get('faculty') || '');
  const [major, setMajor] = useState(searchParams.get('major') || ''); // อ่านจาก major
  const [semester, setSemester] = useState(searchParams.get('term') || ''); // อ่านจาก term
  const [academicYear, setAcademicYear] = useState(searchParams.get('year') || ''); // อ่านจาก year
  const [sort, setSort] = useState(searchParams.get('sort') || 'createdAt');
  const [order, setOrder] = useState(searchParams.get('order') || 'DESC');
  const [isFree, setIsFree] = useState(searchParams.get('isFree') === 'true');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    averageRating: 0,
    totalSheets: 0
  });

  const fetchMetadata = React.useCallback(async () => {
    try {
      // ไม่ต้อง fetch metadata อีกต่อไป เพราะใช้ข้อมูลจากหน้าร้านชีท
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      const response = await sheetsAPI.getStats();
      if (response.data.success) {
        setStats({
          totalDownloads: response.data.data.totalDownloads || 0,
          averageRating: response.data.data.averageRating || 0,
          totalSheets: response.data.data.totalSheets || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
    fetchStats();
  }, [fetchMetadata, fetchStats]);

  const fetchSheets = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // แปลง faculty ID เป็นชื่อคณะ
  const selectedFaculty = faculty ? facultiesList.find(f => f.id === parseInt(faculty))?.name : undefined;
      
      // แปลง major ID เป็นชื่อสาขา
  const selectedMajor = major ? majorsList.find(m => m.id === parseInt(major))?.name : undefined;
      
      const params = {
        page: currentPage,
        limit: 12,
        faculty: selectedFaculty || undefined,
        term: semester || undefined, // ใช้ term แทน semester
        year: academicYear || undefined, // ใช้ year แทน academicYear
        major: selectedMajor || undefined, // ใช้ major สำหรับสาขา
        search: search || undefined,
        sort,
        order,
        isFree: isFree ? 'true' : undefined // ส่ง undefined เมื่อไม่ได้เลือกฟรี
      };

      const response = await sheetsAPI.getSheets(params);
      
      if (response.data.success) {
        setSheets(response.data.data.sheets);
        setPagination(response.data.data.pagination);
        
  // Fetch stats for StatCards
  fetchStats();
      }

      // Update URL params
      const newParams = new URLSearchParams();
      if (search) newParams.set('search', search);
      if (faculty) newParams.set('faculty', faculty);
      if (major) newParams.set('major', major); // ใช้ major สำหรับสาขา
      if (semester) newParams.set('term', semester); // ใช้ term แทน semester
      if (academicYear) newParams.set('year', academicYear); // ใช้ year แทน academicYear
      if (sort !== 'createdAt') newParams.set('sort', sort);
      if (order !== 'DESC') newParams.set('order', order);
      if (isFree) newParams.set('isFree', 'true');
      if (currentPage > 1) newParams.set('page', currentPage.toString());
      
      setSearchParams(newParams);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      toast.error('ไม่สามารถโหลดข้อมูลชีทได้');
    } finally {
      setLoading(false);
    }
  }, [currentPage, faculty, major, semester, academicYear, search, sort, order, isFree, setSearchParams, fetchStats]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // Handle scroll to sheets section when coming from faculty selection
  useEffect(() => {
    const shouldScroll = searchParams.get('scroll');
    if (shouldScroll === 'true') {
      // Remove scroll parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('scroll');
      setSearchParams(newSearchParams);
      
      // Scroll to sheets section after content is loaded
      const scrollToSheets = () => {
        const sheetsSection = document.getElementById('sheets-section');
        if (sheetsSection) {
          // Get the element's position and add some offset to show the section properly
          const elementTop = sheetsSection.offsetTop;
          const offset = 0; // Add 50px offset to show the filter section and section header
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });
        } else {
          // Retry if element not found
          setTimeout(scrollToSheets, 100);
        }
      };
      
      // Wait for data to load before scrolling
      if (!loading && sheets.length > 0) {
        setTimeout(scrollToSheets, 300);
      } else {
        // If still loading, wait longer
        setTimeout(scrollToSheets, 1000);
      }
    }
  }, [searchParams, setSearchParams, loading, sheets]);


  // removed unused semesters list

  const academicYears = [
    '2568',
    '2567',
    '2566',
    '2565',
    '2564',
    '2563',
    '2562',
    '2561',
    '2560'
  ];

  // ใช้ค่าคงที่จาก constants โดยตรง เพื่อลดปัญหา TDZ และไม่ต้องเก็บใน state
  const [availableMajors, setAvailableMajors] = useState([]);

  // ฟังก์ชันสำหรับ filter สาขาตามคณะที่เลือก
  const getMajorsByFaculty = React.useCallback((facultyId) => {
    if (!facultyId) return [];
    return majorsList.filter(m => m.facultyId === parseInt(facultyId));
  }, []);

  // อัพเดท availableMajors เมื่อคณะเปลี่ยน
  useEffect(() => {
    if (faculty) {
      const facultyMajors = getMajorsByFaculty(faculty);
      setAvailableMajors(facultyMajors);
      // รีเซ็ตสาขาเมื่อเปลี่ยนคณะ
      setMajor('');
    } else {
      setAvailableMajors([]);
      setMajor('');
    }
  }, [faculty, getMajorsByFaculty]);


  // removed duplicate non-memoized fetchSheets

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    
    // Scroll to sheets section after search
    setTimeout(() => {
      const sheetsSection = document.getElementById('sheets-section');
      if (sheetsSection) {
        sheetsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    switch (filterType) {
      case 'faculty':
        setFaculty(value);
        break;
      case 'major':
        setMajor(value);
        break;
      case 'semester':
        setSemester(value);
        break;
      case 'academicYear':
        setAcademicYear(value);
        break;
      case 'sort':
        setSort(value);
        break;
      case 'order':
        setOrder(value);
        break;
    }
    
    // No auto scroll for filter changes - only scroll when coming from faculty selection
  };

  const clearFilters = () => {
    setSearch('');
    setFaculty('');
    setMajor('');
    setSemester('');
    setAcademicYear('');
    setSort('createdAt');
    setOrder('DESC');
    setIsFree(false);
    setCurrentPage(1);
    
    // No auto scroll for clearing filters - only scroll when coming from faculty selection
  };

  // use shared formatCurrency

  // use shared getFacultyColors

  // use shared formatDate

  const getActiveFiltersCount = () => {
    let count = 0;
    if (faculty) count++;
    if (major) count++;
    if (semester) count++;
    if (academicYear) count++;
    if (search) count++;
    if (isFree) count++;
    return count;
  };

  // Remove toggleWishlist function as it's now handled by WishlistContext



  return (
    <div className="min-h-screen bg-white relative">

      {/* Hero Section with Search */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-b-[70px]">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              ค้นพบชีทสรุป
              <span className="block text-yellow-300 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>ที่ใช่สำหรับคุณ</span>
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              ชีทสรุปที่มีคุณภาพจากนักศึกษามหาวิทยาลัยเกษตรศาสตร์ 
              ครบทุกคณะ พร้อมส่งมอบความรู้สู่ความสำเร็จ
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชีท, รหัสวิชา, หรือชื่อวิชา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-full shadow-lg focus:ring-4 focus:ring-purple-300 focus:outline-none transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                >
                  ค้นหา
                </button>
              </div>
            </form>
          </div>
        </div>
        
        
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalSheets > 0 ? `${stats.totalSheets}+` : '0+'}
              </div>
              <div className="text-gray-600">ชีทสรุป</div>
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {facultiesList.length}+
              </div>
              <div className="text-gray-600">คณะ</div>
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalDownloads > 1000 ? `${Math.floor(stats.totalDownloads / 1000)}K+` : `${stats.totalDownloads}+`}
              </div>
              <div className="text-gray-600">ดาวน์โหลด</div>

            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.averageRating.toFixed(1)}★
              </div>
              <div className="text-gray-600">คะแนนรีวิว</div>
            </div>
          </div>
          
          {/* Test Cart Button */}
          <div className="mt-8 text-center">

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="sheets-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Mobile Layout - All controls in one row */}
            <div className="flex items-center gap-1 md:gap-2 lg:gap-4 w-full">
              {/* Filter Button */}
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                                // No auto scroll for filter toggle - only scroll when coming from faculty selection
                }}
                className="flex items-center gap-1 px-2 py-1.5 lg:px-4 lg:py-3 bg-purple-100 text-purple-700 rounded-md lg:rounded-lg hover:bg-purple-200 transition-all duration-300 hover:scale-105 text-xs lg:text-base"
              >
                <FunnelIcon className="w-3 h-3 lg:w-5 lg:h-5" />
                ตัวกรอง
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-purple-600 text-white text-[10px] lg:text-xs px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {/* Clear Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={() => {
                    clearFilters();
                    // No auto scroll for clearing filters - only scroll when coming from faculty selection
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 lg:px-4 lg:py-3 text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-105 text-xs lg:text-base"
                >
                  <XMarkIcon className="w-3 h-3 lg:w-5 lg:h-5" />
                  ล้างตัวกรอง
                </button>
              )}

              {/* Sort Dropdown */}
              <div className="relative ml-auto">
                <select
                  value={isFree ? 'isFree-DESC' : `${sort}-${order}`}
                  onChange={(e) => {
                    const [newSort, newOrder] = e.target.value.split('-');
                    if (newSort === 'isFree') {
                      setIsFree(true);
                      handleFilterChange('sort', 'createdAt');
                      handleFilterChange('order', 'DESC');
                    } else {
                      setIsFree(false);
                      handleFilterChange('sort', newSort);
                      handleFilterChange('order', newOrder);
                    }
                    
                                    // No auto scroll for sorting change - only scroll when coming from faculty selection
                  }}
                  className="appearance-none px-2 py-1.5 lg:px-4 lg:py-3 pr-6 lg:pr-10 border border-gray-300 rounded-md lg:rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-xs lg:text-base"
                >
                  <option value="createdAt-DESC">ใหม่ล่าสุด</option>
                  <option value="createdAt-ASC">เก่าสุด</option>
                  <option value="title-ASC">ชื่อ A-Z</option>
                  <option value="title-DESC">ชื่อ Z-A</option>
                  <option value="downloadCount-DESC">ดาวน์โหลดมากสุด</option>
                  <option value="isFree-DESC">ฟรี</option>
                </select>
                <ChevronDownIcon className="w-3 h-3 lg:w-5 lg:h-5 text-gray-400 absolute right-1 lg:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md lg:rounded-lg overflow-hidden">
                <button
                                    onClick={() => {
                    setViewMode('grid');
                    // No auto scroll for view mode change - only scroll when coming from faculty selection
                  }}
                  className={`px-2 py-1.5 lg:px-4 lg:py-3 transition-all duration-300 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                                    onClick={() => {
                    setViewMode('list');
                    // No auto scroll for view mode change - only scroll when coming from faculty selection
                  }}
                  className={`px-2 py-1.5 lg:px-4 lg:py-3 transition-all duration-300 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">คณะ</label>
                  <div className="relative">
                    <select
                      value={faculty}
                      onChange={(e) => handleFilterChange('faculty', e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300"
                    >
                      <option value="">เลือกคณะ</option>
                      {facultiesList.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">สาขา</label>
                  <div className="relative">
                    <select
                      value={major}
                      onChange={(e) => handleFilterChange('major', e.target.value)}
                      disabled={!faculty}
                      className={`appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300 ${!faculty ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{faculty ? 'เลือกสาขา' : 'เลือกสาขา'}</option>
                      {availableMajors.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">เทอม</label>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => handleFilterChange('semester', e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300"
                    >
                      <option value="">เลือกเทอม</option>
                      <option value="เทอมต้น">เทอมต้น</option>
                      <option value="เทอมปลาย">เทอมปลาย</option>
                      <option value="ซัมเมอร์">ซัมเมอร์</option>
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">ปีการศึกษา</label>
                  <div className="relative">
                    <select
                      value={academicYear}
                      onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                      className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300"
                    >
                      <option value="">เลือกปีการศึกษา</option>
                      {academicYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>


              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบ <span className="font-semibold text-purple-600">{pagination?.total_items || 0}</span> ชีท
            {search && ` สำหรับ "${search}"`}
          </p>
        </div>

        {/* Sheets Section - This is where the scroll will target */}
        <div id="sheets-section" className="relative z-10">
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Sheets Display */}
              {sheets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <DocumentTextIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบชีท</h3>
                  <p className="text-gray-500 mb-6 text-lg">
                    {search ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ยังไม่มีชีทในระบบ'}
                  </p>
                  {search && (
                    <button
                                            onClick={() => {
                        clearFilters();
                        // No auto scroll for clearing filters - only scroll when coming from faculty selection
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                      {sheets.map((sheet) => (
                        <ProductCard key={sheet.id} sheet={sheet} />
                      ))}
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === 'list' && (
                    <div className="space-y-4 mb-8 relative z-10">
                      {sheets.map((sheet) => {
                        return (
                        <div key={sheet.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative z-10">
                          <div className="flex">
                            {/* Image */}
                            <div className={`w-48 h-48 relative bg-gradient-to-br ${getFacultyColors(sheet.faculty?.name || sheet.faculty).gradient} overflow-hidden flex items-center justify-center`}>
                              <div className="flex flex-col items-center justify-center w-full h-full">
                                <DocumentTextIcon className={`w-12 h-12 ${getFacultyColors(sheet.faculty?.name || sheet.faculty).iconColor} mb-3`} />
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${getFacultyColors(sheet.faculty?.name || sheet.faculty).iconColor}`}>{sheet.subjectCode}</div>
                                </div>
                              </div>
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                              
                              {/* Wishlist Button */}
                              <button
                                onClick={() => toggleWishlist(sheet.id)}
                                className="absolute top-2 left-2 p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 hover:scale-110 hover:shadow-xl transition-all duration-300 group"
                              >
                                {wishlist.has(sheet.id) ? (
                                  <HeartIconSolid className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300" />
                                ) : (
                                  <HeartIcon className="w-4 h-4 text-gray-600 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
                                )}
                              </button>
                              
                              {/* Rating */}
                              <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg px-2 py-1 shadow-lg">
                                <div className="flex items-center gap-1">
                                  <StarIconSolid className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs font-semibold text-gray-800">{sheet.avgRating ? sheet.avgRating.toFixed(1) : '0.0'}</span>
                                  <span className="text-xs text-gray-500">({sheet.reviewCount || 0})</span>
                                </div>
                              </div>
                              
                              {/* Price Badge */}
                              <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                  sheet.isFree 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-purple-600 text-white'
                                }`}>
                                  {sheet.isFree ? 'ฟรี' : formatCurrency(sheet.price)}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                                    {sheet.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                      <AcademicCapIcon className="w-4 h-4 text-purple-500" />
                                      <span>{sheet.subjectName?.thai || sheet.subjectName?.display || sheet.subjectName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <BookOpenIcon className="w-4 h-4 text-blue-500" />
                                      <span>{sheet.faculty?.name || sheet.faculty || 'ไม่ระบุคณะ'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {sheet.seller?.user?.picture || sheet.seller?.picture ? (
                                        <img 
                                          src={getProfilePictureURL(sheet.seller?.user?.picture || sheet.seller?.picture)} 
                                          alt={sheet.seller?.penName}
                                          className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-md"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                          }}
                                        />
                                      ) : null}
                                      <UserIcon className={`w-7 h-7 text-green-500 ${sheet.seller?.user?.picture || sheet.seller?.picture ? 'hidden' : ''}`} />
                                      <span>By {sheet.seller?.penName}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      <span>{formatDate(sheet.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <EyeIcon className="w-4 h-4" />
                                      <span>{sheet.downloadCount || 0} ดาวน์โหลด</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <StarIconSolid className="w-4 h-4 text-yellow-400" />
                                      <span>{sheet.avgRating ? sheet.avgRating.toFixed(1) : '0.0'} ({sheet.reviewCount || 0})</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Link
                                    to={`/sheets/${sheet.id}`}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold"
                                  >
                                    ดูรายละเอียด
                                  </Link>
                                  {
                                    !sheet.userHasPurchased && !isInCart(sheet.id) ? (
                                      <button
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (e.target.disabled) return;
                                          e.target.disabled = true;
                                          setTimeout(() => (e.target.disabled = false), 1000);
                                          // parse price
                                          let price = 0;
                                          if (sheet.isFree || sheet.price === 0 || sheet.price === '0') {
                                            price = 0;
                                          } else {
                                            const parsedPrice = parseFloat(sheet.price);
                                            price = isNaN(parsedPrice) ? 0 : parsedPrice;
                                          }
                                          const cartItem = {
                                            id: sheet.id,
                                            title: sheet.title,
                                            price,
                                            subjectName: sheet.subjectName,
                                            subject: sheet.subject,
                                            subjectCode: sheet.subjectCode,
                                            seller: sheet.seller,
                                            sellerId: sheet.sellerId,
                                            isFree: sheet.isFree || price === 0,
                                            previewImages: sheet.previewImages,
                                            faculty: sheet.faculty,
                                            createdAt: sheet.createdAt,
                                            downloadCount: sheet.downloadCount
                                          };
                                          addToCart(cartItem);
                                        }}
                                      >
                                        <ShoppingCartIcon className="w-5 h-5" />
                                      </button>
                                    ) : !sheet.userHasPurchased && isInCart(sheet.id) ? (
                                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold select-none">อยู่ในตระกร้าแล้ว</span>
                                    ) : (
                                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold select-none">เป็นเจ้าของแล้ว</span>
                                    )
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6">
                      <div className="text-sm text-gray-700">
                        แสดง {((pagination.current_page - 1) * 12) + 1} ถึง{' '}
                        {Math.min(pagination.current_page * 12, pagination.total_items)} จาก{' '}
                        {pagination.total_items} รายการ
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                                                    onClick={() => {
                            setCurrentPage(currentPage - 1);
                            // No auto scroll for pagination - only scroll when coming from faculty selection
                          }}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        
                        <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                          หน้า {currentPage} จาก {pagination.total_pages}
                        </span>
                        
                        <button
                                                    onClick={() => {
                            setCurrentPage(currentPage + 1);
                            // No auto scroll for pagination - only scroll when coming from faculty selection
                          }}
                          disabled={currentPage === pagination.total_pages}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;