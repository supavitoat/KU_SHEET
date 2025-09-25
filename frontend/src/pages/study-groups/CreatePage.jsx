import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { groupsAPI } from '../../services/api';
import {
  ChevronLeftIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import LocationPicker from '../../components/maps/LocationPicker';
// Smooth animations: inject keyframes and helpers
const customStyles = `
  @keyframes fadeInUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .animate-fadeInUp { animation: fadeInUp .6s ease-out both; will-change: transform, opacity; }
  .transition-smooth { transition: all .25s ease; }
  .animation-delay-200 { animation-delay: .2s; }
  .animation-delay-300 { animation-delay: .3s; }
  .animation-delay-400 { animation-delay: .4s; }
  .animation-delay-500 { animation-delay: .5s; }
  .animation-delay-600 { animation-delay: .6s; }
  .animation-delay-700 { animation-delay: .7s; }
  .animation-delay-800 { animation-delay: .8s; }
  .animation-delay-900 { animation-delay: .9s; }
  .animation-delay-1000 { animation-delay: 1s; }
  .animation-delay-1100 { animation-delay: 1.1s; }
  .animation-delay-1200 { animation-delay: 1.2s; }
  .animation-delay-1400 { animation-delay: 1.4s; }
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}
// Inline 24-hour single control with datalist suggestions (no new file)
const pad2 = (n) => String(n).padStart(2, '0');
function TimeField24Inline({ value, onChange }) {
  const [text, setText] = React.useState(value || '');
  const listId = React.useId();

  React.useEffect(() => setText(value || ''), [value]);

  const options = React.useMemo(() => {
    const arr = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        arr.push(`${pad2(h)}:${pad2(m)}`);
      }
    }
    return arr;
  }, []);

  const normalize = (s) => {
    const digits = (s || '').replace(/[^0-9]/g, '');
    if (digits.length === 4) {
      const hh = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const h = parseInt(hh, 10);
      const m = parseInt(mm, 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${pad2(h)}:${pad2(m)}`;
    }
    // Also accept already formatted HH:mm
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(s)) return s;
    return value || '';
  };

  return (
    <div className="relative">
      <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        inputMode="numeric"
        placeholder="เช่น 13:45"
        list={listId}
        value={text}
        onChange={(e)=> setText(e.target.value)}
        onBlur={(e)=> onChange(normalize(e.target.value))}
        className="w-full rounded-xl border pl-10 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
      />
      <datalist id={listId}>
        {options.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

const CreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [locationData, setLocationData] = React.useState(null);
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [capacity, setCapacity] = React.useState(10);
  const [joinPolicy, setJoinPolicy] = React.useState('auto');
  // visibility removed
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  // Today string for min attribute (local date YYYY-MM-DD)
  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());
    return `${y}-${m}-${d}`;
  }, []);

  // Prefill from duplication state
  React.useEffect(() => {
    const state = location.state || {};
    const dup = state.duplicateFromGroup;
    if (dup) {
      if (dup.title) setTitle(dup.title + ' (ครั้งถัดไป)');
      if (dup.description) setDescription(dup.description);
      if (dup.location) {
        setLocationData({
          name: dup.location.name || '',
          address: dup.location.address || '',
          lat: dup.location.lat ?? null,
          lng: dup.location.lng ?? null,
        });
      }
      if (dup.capacity) setCapacity(dup.capacity);
      if (dup.joinPolicy) setJoinPolicy(dup.joinPolicy);
    }
  }, [location.state]);

  // No subject selection required

  const toISODate = (d, t) => {
    if (!d || !t) return null;
    // Compose local datetime then convert to ISO
    const dt = new Date(`${d}T${t}`);
    return dt.toISOString();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title) nextErrors.title = 'โปรดกรอกหัวข้อกลุ่มติว';
    if (!locationData) nextErrors.location = 'โปรดระบุสถานที่';
    if (!date) nextErrors.date = 'โปรดเลือกวันที่';
  // Prevent past date selection (compare as strings in YYYY-MM-DD)
  if (date && date < todayStr) nextErrors.date = 'ไม่สามารถเลือกวันที่ผ่านมาแล้ว';
    if (!startTime) nextErrors.startTime = 'โปรดเลือกเวลาเริ่ม';
    if (!endTime) nextErrors.endTime = 'โปรดเลือกเวลาสิ้นสุด';

    if (date && startTime && endTime) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      
      // If end time is earlier than start time, assume it's the next day
      if (end <= start) {
        const nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + 1);
        const endNextDay = new Date(`${nextDay.toISOString().split('T')[0]}T${endTime}`);
        
        // Only show error if end time is still not valid even on next day
        if (endNextDay <= start) {
          nextErrors.endTime = 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม';
        }
      }
    }

    const cap = Number(capacity);
    if (Number.isNaN(cap) || cap < 2 || cap > 50) nextErrors.capacity = 'กำหนดระหว่าง 2 - 50 คน';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        locationName: locationData?.name || undefined,
        address: locationData?.address || undefined,
        latitude: locationData?.lat || undefined,
        longitude: locationData?.lng || undefined,
        startAt: toISODate(date, startTime),
        endAt: toISODate(date, endTime),
        capacity: Number(capacity) || 10,
        joinPolicy,
        // visibility removed
        // subject fields removed per requirement
      };
      await groupsAPI.create(payload);
      navigate('/study-groups');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-16 xl:px-24 pt-12 pb-16">
      {/* Breadcrumb */}
      <Link 
        to="/study-groups" 
        className="flex items-center gap-2 text-gray-600 mb-4 cursor-pointer animate-fadeInUp animation-delay-200 transition-smooth"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        <span>กลับไปยังกลุ่มติว</span>
      </Link>

      {/* Title */}
      <h1 className="text-4xl font-black text-gray-900 mb-2 animate-fadeInUp animation-delay-400">สร้างกลุ่มติวใหม่</h1>
      <p className="text-gray-600 mb-6 animate-fadeInUp animation-delay-500">สร้างกลุ่มติวเพื่อหาเพื่อนเรียนร่วมกัน</p>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeInUp animation-delay-600">
        <div className="h-1 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]" />
        <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
          {/* หัวข้อ */}
          <div className="animate-fadeInUp animation-delay-700">
            <label className="block text-sm font-medium text-gray-700 mb-2">หัวข้อกลุ่มติว <span className="text-red-500">*</span></label>
            <div className="relative">
              <BookOpenIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`w-full rounded-xl border px-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="เช่น สรุป Midterm Calculus, นัดพบ Final Physics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* วิชา - removed as requested */}

          {/* รายละเอียด */}
          <div className="animate-fadeInUp animation-delay-800">
            <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
            <textarea
              className="w-full h-36 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3 transition-smooth"
              placeholder="อธิบายเนื้อหาที่จะติว, สิ่งที่ต้องเตรียม, หรือข้อมูลเพิ่มเติม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* สถานที่ */}
          <div className="animate-fadeInUp animation-delay-900">
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ <span className="text-red-500">*</span></label>
            
            {/* Combined Location Picker */}
            <LocationPicker
              value={locationData}
              onChange={setLocationData}
              placeholder="เลือกสถานที่บนแผนที่ หรือพิมพ์ชื่อสถานที่"
              className="w-full transition-smooth"
            />
            
            <p className="text-xs text-gray-500 mt-1">
              เลือกสถานที่บนแผนที่ หรือพิมพ์ชื่อสถานที่ด้วยตนเอง
            </p>
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
          </div>

          {/* วันที่และเวลา */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeInUp animation-delay-1000">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  className={`w-full rounded-xl border pl-10 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth ${errors.date ? 'border-red-300' : 'border-gray-300'}`}
                  value={date}
                  min={todayStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Clamp to today if user tries to type a past date
                    setDate(v && v < todayStr ? todayStr : v);
                  }}
                />
              </div>
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เวลาเริ่ม <span className="text-red-500">*</span></label>
              <div className="transition-smooth"><TimeField24Inline value={startTime} onChange={setStartTime} /></div>
              {errors.startTime && <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เวลาสิ้นสุด <span className="text-red-500">*</span></label>
              <div className="transition-smooth"><TimeField24Inline value={endTime} onChange={setEndTime} /></div>
              {errors.endTime && <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* จำนวนผู้เข้าร่วมสูงสุด */}
          <div className="animate-fadeInUp animation-delay-1100">
            <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าร่วมสูงสุด</label>
            <div className="relative">
              <UserGroupIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min={2}
                max={50}
                className={`w-full rounded-xl border px-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 mt-1">จำนวนผู้เข้าร่วมสูงสุด (2-50 คน)</p>
              {errors.capacity && <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>}
            </div>
          </div>

          {/* นโยบายการเข้าร่วม */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeInUp animation-delay-1150">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">นโยบายการเข้าร่วม</label>
              <div className="relative">
                <ShieldCheckIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="appearance-none w-full rounded-xl border border-gray-300 pl-10 pr-10 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth bg-white"
                  value={joinPolicy}
                  onChange={(e) => setJoinPolicy(e.target.value)}
                >
                  <option value="auto">อนุมัติอัตโนมัติ</option>
                  <option value="approval">ต้องอนุมัติ</option>
                </select>
                <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 animate-fadeInUp animation-delay-1200">
            <button
              type="button"
              onClick={() => navigate('/study-groups')}
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-smooth"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-smooth"
            >
              {saving ? 'กำลังบันทึก...' : 'สร้างกลุ่มติว'}
            </button>
          </div>
        </form>
      </div>

      {/* Tips box */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 animate-fadeInUp animation-delay-1400">
        <h3 className="font-semibold text-blue-800 mb-3">เคล็ดลับการสร้างกลุ่มติว</h3>
        <ul className="list-disc pl-6 text-blue-900 space-y-1 text-sm">
          <li>ตั้งชื่อหัวข้อที่ชัดเจนและน่าสนใจ</li>
          <li>เลือกสถานที่ที่เข้าถึงง่ายและเหมาะสมกับการติว</li>
          <li>กำหนดเวลาที่เหมาะสมกับผู้เข้าร่วม</li>
          <li>อธิบายรายละเอียดให้ชัดเจนเพื่อดึงดูดผู้เข้าร่วม</li>
          <li>กำหนดจำนวนผู้เข้าร่วมที่เหมาะสมกับสถานที่</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePage;
