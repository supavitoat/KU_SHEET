import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sheetsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductCard from '../components/common/ProductCard';
import { CoolMode } from "@/components/magicui/cool-mode";
import {
  CloudArrowUpIcon,
  UserGroupIcon,
  AcademicCapIcon,
  StarIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CogIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  UserIcon,
  MapIcon,
  WrenchScrewdriverIcon,
  SwatchIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import homeimg from '../assets/homeimg.png';
import logoKaset from '../assets/โลโก้คณะเกษตร.png';
import logoWitki from '../assets/โลโก้คณะวิทกี.png';
import logoWitsawa from '../assets/โลโก้คณะวิศวะ.png';
import logoSawad from '../assets/โลโก้คณะศวท.png';
import logoSueksa from '../assets/โลโก้คณะศึกษา.png';
import logoSattaw from '../assets/โลโก้คณะสัตวแพทย์.png';
import logoOb from '../assets/โลโก้คณะอบ.png';
// Removed unused shared utils imports

const HomePage = () => {
  // Toast แสดงหลังสมัคร/กรอกฟอร์ม infoEnter สำเร็จ
  React.useEffect(() => {
    if (sessionStorage.getItem('showLoginToast') === '1') {
      toast.success('🎉 ยินดีต้อนรับ! เข้าสู่ระบบสำเร็จแล้ว');
      sessionStorage.removeItem('showLoginToast');
    }
  }, []);
  
  // Auth and wishlist not needed on Home page UI
  const [searchQuery, setSearchQuery] = useState('');
  // const [selectedFaculty, setSelectedFaculty] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Removed faculties query (not used in this page)

  // Load default sheets on component mount
  useEffect(() => {
    loadDefaultSheets();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Enhanced scroll functionality
  useEffect(() => {
    const scrollContainer = document.querySelector('.custom-scrollbar');
    const progressBar = document.getElementById('scroll-progress');
    const leftArrow = document.querySelector('.scroll-left-btn');
    const rightArrow = document.querySelector('.scroll-right-btn');
    
    if (scrollContainer && progressBar) {
      const updateScrollProgress = () => {
        const scrollLeft = scrollContainer.scrollLeft;
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const progress = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * 100 : 0;
        
        // อัปเดต progress bar
        progressBar.style.width = `${progress}%`;
        
        // อัปเดต custom scrollbar thumb
        const containerWidth = scrollContainer.clientWidth;
        const thumbWidth = Math.max(60, (containerWidth / scrollContainer.scrollWidth) * containerWidth);
        const thumbLeft = (scrollLeft / maxScrollLeft) * (containerWidth - thumbWidth);
        
        // อัปเดต CSS custom property สำหรับ thumb position
        scrollContainer.style.setProperty('--thumb-left', `${thumbLeft}px`);
        scrollContainer.style.setProperty('--thumb-width', `${thumbWidth}px`);
        
        // แสดง/ซ่อนลูกศรตามตำแหน่งการเลื่อน
        if (leftArrow) {
          leftArrow.style.opacity = scrollLeft > 0 ? '1' : '0';
          leftArrow.style.pointerEvents = scrollLeft > 0 ? 'auto' : 'none';
        }
        
        if (rightArrow) {
          rightArrow.style.opacity = scrollLeft < maxScrollLeft ? '1' : '0';
          rightArrow.style.pointerEvents = scrollLeft < maxScrollLeft ? 'auto' : 'none';
        }
      };

      scrollContainer.addEventListener('scroll', updateScrollProgress);
      updateScrollProgress(); // Initial update
      
      return () => {
        scrollContainer.removeEventListener('scroll', updateScrollProgress);
      };
    }
  }, [searchResults]);

  // Real-time search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await sheetsAPI.searchSheets({
            q: debouncedSearchQuery.trim(),
            limit: 5,
          });
          if (response.data?.success) {
            setSearchResults(response.data.data.sheets);
          }
        } catch (error) {
          console.error('Error searching sheets:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        // If search query is empty, load default sheets
        loadDefaultSheets();
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const loadDefaultSheets = async () => {
    try {
      setIsLoadingDefault(true);
      const response = await sheetsAPI.getSheets({
        limit: 10,
        sort: 'createdAt',
        order: 'DESC'
      });
      if (response.data.success) {
        setSearchResults(response.data.data.sheets);
      }
    } catch (error) {
      console.error('Error loading default sheets:', error);
    } finally {
      setIsLoadingDefault(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    // For form submission, we can keep the existing logic or remove it since we have real-time search
    // For now, let's just prevent the default form submission
    e.preventDefault();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    // loadDefaultSheets will be called automatically by the useEffect
  };

  // const handleFacultySelect = (facultyId) => {
  //   window.location.href = `/shop?faculty=${facultyId}`;
  // };

  // Helpers moved to shared utils (formatCurrency, formatDate, getFacultyColors)

  // Removed unused local formatDate helper

  // Remove toggleWishlist function as it's now handled by WishlistContext

  // Faculty data with logos and colors
  // Removed unused facultyData list (using direct logo blocks below)

      return (
      <div className="min-h-screen bg-white relative">

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="w-full pt-0 pb-2 px-4 lg:px-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-center relative z-10 min-h-[60vh] md:min-h-[80vh] pt-4 md:pt-8">
              {/* Left Side - Text Content */}
              <div className="text-gray-900 space-y-8 lg:col-span-3 lg:pr-8 text-center md:text-left">
                {/* Badge */}
                <div className="flex w-fit mx-auto md:mx-0 items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-4 py-2 md:px-4 md:py-2 rounded-full text-sm md:text-sm font-medium mb-4 md:mb-6 animate-fade-in">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  🎓 แพลตฟอร์มการเรียนรู้เพื่อชาวเกษตร
                </div>
                
                                 {/* Main Heading */}
                 <div className="animate-fade-in-up">
                   <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-4 md:mb-6">
                     <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent drop-shadow-sm">
                       ค้นหาสรุปและเพื่อนติว
                     </span>
                     <br />
                     <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                       ก่อนการสอบของคุณ
                     </span>
                   </h1>
                 </div>
                
                {/* Descriptive Text */}
                <div className="animate-fade-in-up animation-delay-200">
                  <p className="text-sm md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
                    แหล่งรวมชีทสรุปและเพื่อนๆ สำหรับการติวสอบ
                    <br className="md:hidden" />
                    และการทบทวนในรายวิชาต่างๆ
                    <br />
                    <span className="font-semibold text-purple-600">ในมหาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน</span>
                  </p>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 md:flex md:gap-8 mb-6 md:mb-8 animate-fade-in-up animation-delay-400 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-purple-600">1,000+</div>
                    <div className="text-xs md:text-sm text-gray-600">ชีทสรุป</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-blue-600">500+</div>
                    <div className="text-xs md:text-sm text-gray-600">ผู้ใช้งาน</div>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-row gap-2 md:gap-4 animate-fade-in-up animation-delay-600 justify-center md:justify-start">
                  <button
                    onClick={() => window.location.href = '/shop'}
                    className="group flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 md:px-14 md:py-4 rounded-2xl font-semibold text-sm md:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>ดาวน์โหลดชีท</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => window.location.href = '/seller'}
                    className="group flex-1 bg-white text-gray-700 px-4 py-3 md:px-16 md:py-4 rounded-2xl font-semibold text-sm md:text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 border-2 border-gray-200 hover:border-purple-300 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <span>อัพโหลดชีท</span>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Side - 3D Illustration */}
              <div className="hidden md:flex justify-center lg:justify-center items-center lg:col-span-2 animate-fade-in-up animation-delay-800">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <img 
                    src={homeimg} 
                    alt="Student studying" 
                    className="relative w-56 h-56 md:w-[500px] md:h-[500px] object-contain transform md:scale-110 group-hover:scale-110 md:group-hover:scale-125 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Advanced Search Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl relative z-10">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
              <MagnifyingGlassIcon className="w-5 h-5" />
              🔍 ช่องค้นหา
            </div>
            <h2 className="text-3xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent drop-shadow-sm">
                ค้นหาชีทที่คุณต้องการ
              </span>
            </h2>
            
          </div>

          {/* Main Search */}
          <div className="max-w-4xl mx-auto mb-10 md:mb-12 animate-fade-in-up animation-delay-200">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-2">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-5 md:left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยรหัสวิชา ชื่อวิชา หรือชื่อผู้เขียน..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 md:pl-16 pr-4 py-2.5 md:py-4 text-sm md:text-xl border-0 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400"
                    />
                    {isSearching && (
                      <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 md:px-6 md:py-4 rounded-2xl font-semibold text-sm md:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <span className="flex items-center gap-3">
                      ค้นหา
                      <svg className="hidden md:block w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isLoadingDefault) && (
            <div className="mb-12 relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? `ผลการค้นหา: "${searchQuery}"` : ''}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? `พบ ${searchResults.length} ชีท`
                    : ''
                  }
                </p>
              </div>
              
              {isLoadingDefault ? (
                <div className="flex justify-center items-center py-12 pt-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="relative group">
                    {/* Custom Scrollbar Styling */}
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-6 md:pt-8 custom-scrollbar">
                      {searchResults.map((sheet) => (
                        <div key={sheet.id} className="flex-shrink-0 w-44 md:w-60">
                          <ProductCard sheet={sheet} />
                        </div>
                      ))}
                    </div>
                    
                    {/* Enhanced Scroll Indicators */}
                    <button
                      onClick={() => {
                        const container = document.querySelector('.custom-scrollbar');
                        if (container) {
                          container.scrollBy({ left: -300, behavior: 'smooth' });
                        }
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 bg-gradient-to-r from-purple-300 to-purple-400 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 hover:from-purple-400 hover:to-purple-500 hover:scale-110 cursor-pointer z-20 transform"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        const container = document.querySelector('.custom-scrollbar');
                        if (container) {
                          container.scrollBy({ left: 300, behavior: 'smooth' });
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 hover:from-purple-500 hover:to-purple-400 hover:scale-110 cursor-pointer z-20 transform"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Scroll Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-300 to-purple-400 rounded-full transition-all duration-300" 
                           style={{ width: '0%' }}
                           id="scroll-progress">
                      </div>
                    </div>
                  </div>
                  

                </>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Faculty Section */}
      <section className="py-8 relative overflow-hidden">
        <div className="container-app relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
              <AcademicCapIcon className="w-5 h-5" />
              🎓 คณะทั้งหมดในมหาลัย
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent drop-shadow-sm">
                คณะทั้งหมดในมหาลัย
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              ค้นหาชีทสรุปจากคณะของคุณ
              <br />
              <span className="text-purple-600 font-semibold">ในมหาวิทยาลัยเกษตรศาสตร์</span>
            </p>
          </div>

          <div className="max-w-6xl mx-auto animate-fade-in-up animation-delay-200">
            {/* Faculty Logos Hexagonal Layout */}
            <div className="flex flex-col items-center justify-center">
              {/* Top Row - 3 logos */}
              <div className="flex justify-center items-center gap-0 mb-0">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=1&scroll=true'}>
                    <img 
                      src={logoKaset} 
                      alt="คณะเกษตร" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=2&scroll=true'}>
                    <img 
                      src={logoWitsawa} 
                      alt="คณะวิศวกรรมศาสตร์" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=3&scroll=true'}>
                    <img 
                      src={logoWitki} 
                      alt="คณะวิทยาศาสตร์การกีฬา" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row - 4 logos (offset) */}
              <div className="flex justify-center items-center gap-0 -mt-3 md:-mt-5" style={{ marginLeft: '0rem' }}>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=4&scroll=true'}>
                    <img 
                      src={logoSawad} 
                      alt="คณะศิลปะศาสตร์และวิทยาศาสตร์" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=5&scroll=true'}>
                    <img 
                      src={logoSueksa} 
                      alt="คณะศึกษาศาสตร์และพัฒนศาสตร์" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-green-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=6&scroll=true'}>
                    <img 
                      src={logoOb} 
                      alt="คณะอุตสาหกรรมบริการ" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                   <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center cursor-pointer" onClick={() => window.location.href = '/shop?faculty=7&scroll=true'}>
                    <img 
                      src={logoSattaw} 
                      alt="คณะสัตวแพทยศาสตร์" 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative rounded-t-[70px] mt-20 md:mt-40">
        
        <div className="container-app text-center relative z-10">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              🚀 เริ่มต้นการเรียนรู้
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-yellow-300 mb-4 md:mb-6">
              พร้อมเริ่มต้นการเรียนรู้แล้วหรือยัง?
            </h2>
            <p className="text-base md:text-xl text-white/90 mb-6 md:mb-10 max-w-3xl mx-auto leading-relaxed">
              ค้นหาชีทสรุปเพื่อช่วยเหลือการเรียนรู้ของคุณ 
              <br />
              <span className="font-semibold ">หรืออัพโหลดชีทสรุปของคุณเพื่อช่วยเหลือนักศึกษาคนอื่นๆ</span>
            </p>
          </div>
          

          
          {/* View All Sheets Button */}
          <div className="mt-4 animate-fade-in-up animation-delay-400">
            <CoolMode>
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0"></div>
              
                {/* Button */}
                <button
                  onClick={() => {
                    // เพิ่ม delay ก่อนเปลี่ยนหน้า
                    setTimeout(() => {
                      window.location.href = '/shop';
                    }, 400);
                  }}
                  className="relative inline-flex items-center gap-2 md:gap-4 bg-gradient-to-r from-white/15 via-white/20 to-white/15 backdrop-blur-md text-white px-6 py-3 md:px-10 md:py-5 rounded-2xl font-bold text-sm md:text-lg hover:from-white/25 hover:via-white/30 hover:to-white/25 transition-all duration-500 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-2xl transform hover:scale-105 justify-center"
                >
                  {/* Icon */}
                  <div className="relative">
                    <svg className="w-4 h-4 md:w-6 md:h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {/* Sparkle effect */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                  
                  <span className="relative">
                    ดูชีททั้งหมด
                    {/* Text underline effect */}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-300 to-orange-300 group-hover:w-full transition-all duration-500"></div>
                  </span>
                  
                  {/* Arrow */}
                  <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </CoolMode>
          </div>
        </div>
      </section>

      {/* Custom CSS for animations and effects */}
      <style>{`
        .clip-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          position: relative;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        
        .clip-hexagon::before {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          bottom: 1px;
          background: rgba(255, 255, 255, 0.15);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          z-index: 1;
        }
        
        .clip-hexagon > div {
          z-index: 2;
          position: relative;
        }
        
        .clip-hexagon:hover {
          border-color: rgba(255, 255, 255, 0.4);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
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

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
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

        .animation-delay-5000 {
          animation-delay: 5s;
        }

        .animation-delay-6000 {
          animation-delay: 6s;
        }

        .animation-delay-7000 {
          animation-delay: 7s;
        }

        .animation-delay-8000 {
          animation-delay: 8s;
        }

        /* Hide tooltips */
        a[title] {
          position: relative;
        }
        
        a[title]:hover::after {
          display: none !important;
        }

        /* Custom Scrollbar Styling - Hide Default Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          display: none; /* ซ่อน scrollbar เดิมของ WebKit browsers */
        }
        
        /* Firefox Scrollbar - ซ่อน scrollbar เดิม */
        .custom-scrollbar {
          scrollbar-width: none; /* ซ่อน scrollbar เดิมของ Firefox */
          -ms-overflow-style: none; /* ซ่อน scrollbar เดิมของ IE/Edge */
        }
        
        /* Custom Scrollbar ที่เราสร้างขึ้น */
        .custom-scrollbar::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          z-index: 10;
        }
        
        /* Custom Scrollbar Thumb */
        .custom-scrollbar::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: var(--thumb-left, 0px);
          height: 8px;
          width: var(--thumb-width, 60px);
          background: linear-gradient(90deg, #c4b5fd, #a78bfa);
          border-radius: 4px;
          z-index: 11;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(196, 181, 253, 0.3);
        }
        
        /* Hover effect สำหรับ custom thumb */
        .custom-scrollbar:hover::before {
          background: linear-gradient(90deg, #a78bfa, #8b5cf6);
          transform: scaleY(1.1);
          box-shadow: 0 4px 8px rgba(196, 181, 253, 0.4);
        }
        
        /* Enhanced Scroll Indicators Animation */
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
          }
          50% { 
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }
        
        .group:hover .custom-scrollbar::-webkit-scrollbar-thumb {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;