import React from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI, getProfilePictureURL } from '../../services/api';
import { ClockIcon, CalendarDaysIcon, UserGroupIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Add custom CSS for animations
const customStyles = `
  @keyframes gradient-x {
    0%, 100% {
      background-size: 200% 200%;
      background-position: left center;
    }
    50% {
      background-size: 200% 200%;
      background-position: right center;
    }
  }
  
  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
  }
  
  /* Smooth fade-in-up */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeInUp { animation: fadeInUp .6s ease-out both; will-change: transform, opacity; }

  /* Smooth transition utility */
  .transition-smooth { transition: all .25s ease; }

  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  
  .animation-delay-400 {
    animation-delay: 0.4s;
  }

  .animation-delay-600 { animation-delay: .6s; }
  .animation-delay-800 { animation-delay: .8s; }
  .animation-delay-1000 { animation-delay: 1s; }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow animate-pulse">
    <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
    <div className="h-4 w-2/3 bg-gray-200 rounded" />
  </div>
);

const GroupCard = ({ g }) => {
  // Gradient tone matching the reference
  const headerGradient = 'from-[#5E7BFE] via-[#5A67F6] to-[#7E5AF6]';
  const organizer = g.organizer || {};
  
  // Check if current user has joined this group
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
  // The API returns only the current user's membership in g.members array
  const hasJoined = g.members && g.members.length > 0 && 
    (g.members[0].status === 'approved' || g.members[0].status === 'pending');
  const isPending = g.members && g.members.length > 0 && g.members[0].status === 'pending';
  // badges for full/starting soon removed per request
  const statusClass = g.status === 'completed'
    ? 'bg-red-100 text-red-700'
    : g.status === 'ongoing'
    ? 'bg-blue-100 text-blue-700'
    : g.status === 'cancelled'
    ? 'bg-gray-200 text-gray-700'
    : 'bg-emerald-100 text-emerald-700';
  
  // Check if current user is the organizer
  const isOrganizer = g.organizer?.id === currentUserId;
  
  // console logs removed

  return (
    <div className="group rounded-[18px] border border-gray-100 bg-white shadow-lg shadow-black/5 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10">
      {/* Header */}
      <div className={`relative min-h-28 px-5 py-4 bg-gradient-to-r ${headerGradient} text-white`}> 
        {/* decorative circles */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute right-6 top-2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[20px] md:text-[22px] font-extrabold leading-tight whitespace-normal break-words drop-shadow-sm">{g.title}</div>
            <div className="mt-1 flex items-center gap-2 text-[13px] md:text-[14px] font-semibold text-white/90 drop-shadow-sm">
              <CalendarDaysIcon className="w-5 h-5" />
              <span>{new Date(g.startAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-[12px] font-semibold shadow-sm whitespace-nowrap ${statusClass}`}>
              {g.status === 'upcoming'
                ? 'กำลังจะเริ่ม'
                : g.status === 'ongoing'
                ? 'กำลังดำเนินการ'
                : g.status === 'completed'
                ? 'สิ้นสุดแล้ว'
                : g.status === 'cancelled'
                ? 'ยกเลิกแล้ว'
                : g.status}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex-1">
        {g.description && (
          <p className="text-[13px] text-gray-700 mb-4 leading-5 line-clamp-2">{g.description}</p>
        )}
        <div className="space-y-3 text-[14px] text-gray-800 font-medium">
          <div className="flex items-center gap-3 transition-colors hover:text-purple-600 group-hover:text-purple-600">
            <svg className="w-4 h-4 text-purple-500 group-hover:text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-7-10a7 7 0 1 1 14 0c0 5.65-7 10-7 10Zm0-12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>
            <span className="truncate">{g.locationName || '-'}</span>
          </div>
          <div className="flex items-center gap-3 transition-colors hover:text-blue-600 group-hover:text-blue-600">
            <CalendarDaysIcon className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
            <span>{new Date(g.startAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 transition-colors hover:text-emerald-600 group-hover:text-emerald-600">
            <ClockIcon className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
            <span>{new Date(g.startAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(g.endAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="flex items-center gap-3 transition-colors hover:text-orange-600 group-hover:text-orange-600">
            <UserGroupIcon className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
            <span>{g.approvedCount || 0}/{g.capacity} คน</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="rounded-[14px] bg-white shadow-sm border border-gray-100 p-3 flex items-center gap-3 mb-4">
          <img className="w-10 h-10 rounded-full object-cover bg-white border" src={getProfilePictureURL(organizer.picture)} onError={(e)=>{e.target.style.display='none';}} />
          <div className="text-sm leading-tight">
            <div className="font-semibold">{organizer.fullName || 'คนจัด'}</div>
            <div className="text-gray-500 text-[12px]">ผู้จัดกิจกรรม</div>
          </div>
        </div>
        {isOrganizer ? (
          <div className="flex gap-2">
            <Link 
              to={`/groups/${g.id}`} 
              className="flex-1 inline-flex items-center justify-center rounded-[14px] py-3 shadow text-[16px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              ดูรายละเอียด
            </Link>
            <Link 
              to={`/study-groups/${g.id}/edit`} 
              className="flex-1 inline-flex items-center justify-center rounded-[14px] py-3 text-[16px] font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              แก้ไข
            </Link>
          </div>
        ) : (
          <Link to={`/groups/${g.id}`} className={`w-full inline-flex items-center justify-center rounded-[14px] py-3 shadow text-[16px] font-semibold ${
            hasJoined 
              ? (isPending 
                  ? 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200')
              : 'border border-gray-200 bg-white hover:bg-gray-50'
          }`}>
            {hasJoined ? (isPending ? 'รออนุมัติ' : 'เข้าร่วมแล้ว') : 'ดูรายละเอียด'}
          </Link>
        )}
      </div>
    </div>
  );
};

const ListPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [groups, setGroups] = React.useState([]);
  const [filters] = React.useState({ text: '' });
  const [activeFilter, setActiveFilter] = React.useState('all'); // all, my, joined
  const [statusTab] = React.useState('all'); // all | upcoming | ongoing | completed

  // Always scroll to top on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeFilter === 'my') {
  res = await groupsAPI.myGroups();
        let arr = res.data?.data?.organized || [];
        // sort newest first by createdAt
        arr = arr.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        if (statusTab !== 'all') arr = arr.filter(g => g.status === statusTab);
        setGroups(arr);
      } else if (activeFilter === 'joined') {
  res = await groupsAPI.myGroups();
        let arr = res.data?.data?.joined || [];
        // sort newest first by createdAt
        arr = arr.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        if (statusTab !== 'all') arr = arr.filter(g => g.status === statusTab);
        setGroups(arr);
      } else {
        const params = { ...filters, sortBy: 'createdAt', order: 'desc' };
        if (statusTab !== 'all') params.status = statusTab;
        res = await groupsAPI.list(params);
        setGroups(res.data?.data || []);
      }
    } catch (e) {
      console.error('Error loading groups:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, statusTab, filters]);

  React.useEffect(() => { load(); }, [load]);

  // removed unused onChange handler

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-14 xl:px-20 pt-16 pb-20">
        {/* Hero Section - Compact */}
        <div className="mb-8">
          <div className="max-w-5xl mx-auto text-center px-2">
            {/* Compact Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 backdrop-blur-sm text-purple-700 text-sm font-semibold shadow-lg border border-purple-200 hover:shadow-xl transition-smooth animate-fadeInUp animation-delay-200">
              <SparklesIcon className="w-4 h-4 text-purple-600" />
              <span>ชุมชนการเรียนรู้ KU Sheet</span>
            </div>

            {/* Compact Title */}
            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#4F46E5] to-[#7C3AED] animate-fadeInUp animation-delay-400">
              กลุ่มติวออนไลน์
            </h1>
            
            {/* Compact Subtitle */}
            <p className="mt-3 text-base md:text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto animate-fadeInUp animation-delay-600">
              หาเพื่อนติวตามวิชาและสถานที่ที่คุณสนใจ สร้างเครือข่ายการเรียนรู้ที่แข็งแกร่ง
            </p>

            {/* Compact Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center animate-fadeInUp animation-delay-800">
              <button
                onClick={() => setActiveFilter('all')}
                className={`group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-smooth shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 shadow-xl'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-md'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                กลุ่มทั้งหมด
                {activeFilter === 'all' && <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>}
              </button>
              
              <button
                onClick={() => setActiveFilter(activeFilter === 'my' ? 'all' : 'my')}
                className={`group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-smooth shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  activeFilter === 'my'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-xl'
                    : 'bg-white text-purple-700 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 shadow-md'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                กลุ่มของฉัน
                {activeFilter === 'my' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </button>
              
              <button
                onClick={() => setActiveFilter(activeFilter === 'joined' ? 'all' : 'joined')}
                className={`group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-smooth shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  activeFilter === 'joined'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl'
                    : 'bg-white text-blue-700 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 shadow-md'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                กลุ่มที่เข้าร่วม
                {activeFilter === 'joined' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </button>
              
              <Link
                to="/study-groups/create"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-smooth shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                สร้างกลุ่มติว
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </Link>
            </div>
            {/* Status Tabs removed per request */}
          </div>
        </div>

        {/* Content Section */}
        <div className="relative">
          {/* Stats Bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 animate-fadeInUp animation-delay-1000">
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg transition-smooth">
                <span className="text-sm font-semibold text-gray-600">ทั้งหมด</span>
                <span className="ml-2 text-lg font-bold text-purple-600">{groups.length}</span>
              </div>
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg transition-smooth">
                <span className="text-sm font-semibold text-gray-600">กำลังเปิดรับ</span>
                <span className="ml-2 text-lg font-bold text-green-600">{groups.filter(g => g.status === 'upcoming').length}</span>
              </div>
            </div>
            
            {groups.length > 0 && (
              <div className="text-sm text-gray-500 font-medium">
                แสดงผล {groups.length} กลุ่ม
              </div>
            )}
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="relative">
              {/* Empty State with Enhanced Design */}
              <div className="text-center py-20 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                    <UserGroupIcon className="w-12 h-12 text-purple-500" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {activeFilter === 'my' 
                    ? 'คุณยังไม่ได้สร้างกลุ่มติว' 
                    : activeFilter === 'joined' 
                      ? 'คุณยังไม่ได้เข้าร่วมกลุ่มติว' 
                      : 'ยังไม่มีกลุ่มติว'
                  }
                </h3>
                
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {activeFilter === 'my' 
                    ? 'เริ่มต้นสร้างกลุ่มแรกของคุณได้เลย' 
                    : activeFilter === 'joined' 
                      ? 'ลองเข้าร่วมกลุ่มติวที่น่าสนใจ' 
                      : 'เริ่มต้นสร้างกลุ่มแรกของคุณได้เลย'
                  }
                </p>

                {/* Decorative Elements */}
                <div className="flex justify-center gap-2 mb-8">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((g, index) => (
                <div 
                  key={g.id} 
                  className="transform transition-smooth hover:-translate-y-2 animate-fadeInUp"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <GroupCard g={g} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListPage;
