import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, getProfilePictureURL } from '../../services/api';
import { MapPinIcon, CalendarDaysIcon, ClockIcon, UserGroupIcon, LinkIcon, QrCodeIcon, MegaphoneIcon, ArrowDownTrayIcon, CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { reputationAPI, reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import GroupChat from '../../components/chat/GroupChat';
import MapDisplay from '../../components/maps/MapDisplay';

// Smooth animations: inject keyframes and helpers (scoped via dynamic style)
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
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const qrHref = typeof window !== 'undefined' ? window.location.href : '';
  const qrPrimary = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrHref)}`;
  const qrFallback = `https://chart.googleapis.com/chart?cht=qr&chs=320x320&chl=${encodeURIComponent(qrHref)}`;
  const [qrSrc, setQrSrc] = React.useState(qrPrimary);
  const [isEditingAnn, setIsEditingAnn] = React.useState(false);
  const [annText, setAnnText] = React.useState('');
  const [ratingTargets, setRatingTargets] = React.useState([]);
  const [ratings, setRatings] = React.useState({}); // memberId -> 1..5
  const [reps, setReps] = React.useState({}); // userId -> { score, count }
  const [myGiven, setMyGiven] = React.useState({}); // userId -> rating (persisted)
  // Per-person selection stored inline; we no longer restrict to one per group
  const downloadQR = async () => {
    try {
      const res = await fetch(qrSrc, { mode: 'cors', cache: 'no-store' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `group-${id}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลด QR แล้ว');
  } catch (e) {
      console.error('QR download error', e);
      toast.error('ดาวน์โหลดไม่สำเร็จ');
    }
  };
  // Remove location editing on detail page - read-only for members

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupsAPI.getById(id);
      setGroup(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);
  const [showReport, setShowReport] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const [reportDesc, setReportDesc] = React.useState('');
  const submitReport = async (payload) => {
    try {
      await reportsAPI.submit({ targetType: 'group', groupId: Number(id), reason: payload.reason, description: payload.description });
      // after submit, fetch my report to show summary
      const mine = await reportsAPI.getMine({ targetType: 'group', groupId: Number(id) });
      setMyReport(mine.data?.data || null);
      toast.success('ส่งรายงานแล้ว ขอบคุณสำหรับการแจ้ง');
      setShowReport(false);
      setReportReason('');
      setReportDesc('');
    } catch {
      // toast handled globally
    }
  };
  const [myReport, setMyReport] = React.useState(null);
  const reasonLabels = {
    spam: 'สแปมหรือโฆษณา',
    harassment: 'คุกคาม/ไม่เหมาะสม',
    fake: 'ข้อมูลปลอม/ทำให้เข้าใจผิด',
    safety: 'ความปลอดภัยสถานที่',
    other: 'อื่นๆ',
  };
  React.useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await reportsAPI.getMine({ targetType: 'group', groupId: Number(id) });
        setMyReport(res.data?.data || null);
      } catch {
        // ignore
      }
    };
    loadReport();
  }, [id]);
  React.useEffect(() => { setAnnText(group?.pinnedAnnouncementText || ''); }, [group]);

  // Prepare rateable members when completed
  React.useEffect(() => {
    if (!group) return;
    if (group.status === 'completed') {
      const meId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const rateables = (group.members || []).filter(m => m.user?.id !== meId && m.checkedInAt && (group.members.find(mm => mm.user?.id === meId)?.checkedInAt));
      setRatingTargets(rateables);
    } else {
      setRatingTargets([]);
    }
  }, [group]);

  // Load reputation for members (if logged in)
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!group || !token) return;
    const memberIds = Array.isArray(group.members) ? group.members.map(m => m.user?.id).filter(Boolean) : [];
    const organizerId = group.organizer?.id;
    const uniqueUserIds = Array.from(new Set([...(memberIds || []), organizerId].filter(Boolean)));
    const toFetch = uniqueUserIds.filter(uid => !reps[uid]);
    if (toFetch.length === 0) return;
    (async () => {
      try {
        const results = await Promise.allSettled(toFetch.map(uid => reputationAPI.getReputation(uid)));
        const next = {};
        results.forEach((r, idx) => {
          const uid = toFetch[idx];
          if (r.status === 'fulfilled') {
            next[uid] = r.value.data.data || {};
          }
        });
        if (Object.keys(next).length > 0) setReps(prev => ({ ...prev, ...next }));
      } catch {
        // ignore reputation fetch errors
      }
    })();
  }, [group, reps]);

  // Load my feedback to keep selected stars
  React.useEffect(() => {
    if (!group) return;
    (async () => {
      try {
        const res = await reputationAPI.getMyFeedbackForGroup(id);
        const rows = res.data?.data || [];
        const map = {};
        rows.forEach(r => { map[r.targetUserId] = r.rating; });
        setMyGiven(map);
      } catch {
        // ignore
      }
    })();
  }, [group, id]);

  const handleJoin = React.useCallback(async () => {
    setJoining(true);
    try {
      await groupsAPI.join(id);
      await load();
    } finally {
      setJoining(false);
    }
  }, [id, load]);

  const handleLeave = React.useCallback(async () => {
    setJoining(true);
    try {
      await groupsAPI.leave(id);
      navigate('/study-groups');
    } finally {
      setJoining(false);
    }
  }, [id, navigate]);

  const handleStart = React.useCallback(async () => {
    setJoining(true);
    try {
      await groupsAPI.start(id);
      await load();
    } finally {
      setJoining(false);
    }
  }, [id, load]);

  const handleFinish = React.useCallback(async () => {
    setJoining(true);
    try {
      await groupsAPI.finish(id);
      await load();
    } finally {
      setJoining(false);
    }
  }, [id, load]);

  // Removed handleDuplicate (unused)

  // Removed handleExport (unused)

  const handleCheckIn = async (memberId) => {
    try {
      await groupsAPI.checkIn(id, memberId);
      await load();
      toast.success('เช็คชื่อแล้ว');
    } catch {
      // ignore
    }
  };

  const saveAnnouncement = async () => {
    if (!annText.trim()) { toast.error('กรอกประกาศก่อน'); return; }
    try {
      await groupsAPI.setAnnouncement(id, annText.trim());
      await load();
      setIsEditingAnn(false);
      toast.success('ปักหมุดแล้ว');
    } catch {
      // ignore
    }
  };

  const clearAnnouncement = async () => {
    try {
      await groupsAPI.clearAnnouncement(id);
      await load();
      setIsEditingAnn(false);
      toast.success('เอาประกาศออกแล้ว');
    } catch {
      // ignore
    }
  };

  const submitRatings = async () => {
    try {
      // Collect new ratings per person (skip those already given before)
      const pending = Object.entries(ratings)
        .map(([memberId, value]) => {
          const member = ratingTargets.find(m => String(m.id) === String(memberId));
          return member ? { userId: member.user.id, rating: Number(value) } : null;
        })
        .filter(Boolean)
        .filter(({ userId }) => myGiven[userId] === undefined);

      if (pending.length === 0) {
        toast.error('ยังไม่ได้เลือกคะแนนใหม่');
        return;
      }

      for (const p of pending) {
        await reputationAPI.submitFeedback(p.userId, { groupId: Number(id), rating: p.rating });
      }
      const merge = { ...myGiven };
      pending.forEach(p => { merge[p.userId] = p.rating; });
      setMyGiven(merge);
      // Reload group to reflect updated organizer/member reputation from DB
      await load();
      toast.success('ส่งคะแนนเรียบร้อย');
    } catch (e) {
      const msg = e?.response?.data?.message || 'ส่งคะแนนไม่สำเร็จ';
      toast.error(msg);
    }
  };

  const copyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('คัดลอกลิงก์แล้ว');
    } catch {
      // ignore
    }
  };

  // Location editing removed on this page

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-16">กำลังโหลด...</div>;
  if (!group) return <div className="max-w-6xl mx-auto px-6 py-16">ไม่พบกลุ่ม</div>;

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const myMembership = (group.members || []).find(m => m.user?.id === currentUserId);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 xl:px-20 py-12">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden shadow-lg shadow-black/5 mb-6 animate-fadeInUp animation-delay-200">
        <div className="relative p-6 md:p-8 bg-gradient-to-r from-[#5E7BFE] via-[#5A67F6] to-[#7E5AF6] text-white animate-fadeInUp animation-delay-300">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-10 top-4 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          <h1 className="relative z-10 text-3xl md:text-4xl font-black leading-tight animate-fadeInUp animation-delay-400">{group.title}</h1>
          <div className="relative z-10 mt-2 opacity-90 animate-fadeInUp animation-delay-500">{group.description || '—'}</div>
        </div>
        {/* Quick facts */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5">
          <div className="flex items-center gap-3 text-sm text-gray-800 font-medium animate-fadeInUp animation-delay-400">
            <MapPinIcon className="w-5 h-5 text-purple-600" />
            <span className="truncate">{group.locationName || '-'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-800 font-medium animate-fadeInUp animation-delay-500">
            <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
            <span>{new Date(group.startAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-800 font-medium animate-fadeInUp animation-delay-600">
            <ClockIcon className="w-5 h-5 text-emerald-600" />
            <span>{new Date(group.startAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(group.endAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-800 font-medium animate-fadeInUp animation-delay-700">
            <UserGroupIcon className="w-5 h-5 text-orange-600" />
            <span>ความจุ {group.capacity} คน</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: organizer and actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-400">
            <div className="text-sm text-gray-500 mb-2">ผู้จัดกิจกรรม</div>
            <div className="flex items-center gap-3">
              <img className="w-12 h-12 rounded-full object-cover bg-white border" src={getProfilePictureURL(group.organizer?.picture)} onError={(e)=>{e.target.style.display='none';}} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate max-w-[180px]">{group.organizer?.fullName || 'ผู้จัด'}</span>
                  {(() => {
                    const org = group.organizer;
                    if (!org || !org.id) return null;
                    const score = org.reputationScore ?? reps[org.id]?.score;
                    const count = org.reputationCount ?? reps[org.id]?.count ?? 0;
                    const scoreText = (typeof score === 'number' && Number.isFinite(score)) ? score.toFixed(1) : '—';
                    return (
                    <span className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0">
                      <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{scoreText}</span>
                      <span className="text-gray-400">({count})</span>
                    </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-500">ผู้จัดกิจกรรม</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-500">
            <div className="text-sm text-gray-500 mb-3">การเข้าร่วม</div>
            <div className="flex flex-col gap-3">
              {myMembership && myMembership.role === 'organizer' ? (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="rounded-xl bg-purple-600 text-white py-3 text-center font-medium transition-smooth">
                      เจ้าของกลุ่ม
                    </div>
                    {group.status === 'upcoming' && (
                      <button onClick={handleStart} disabled={joining} className="rounded-xl bg-emerald-600 text-white py-3 hover:bg-emerald-700 transition-smooth">เริ่มกิจกรรม</button>
                    )}
                    {group.status !== 'completed' && (
                      <button onClick={handleFinish} disabled={joining} className="rounded-xl bg-orange-600 text-white py-3 hover:bg-orange-700 transition-smooth">สิ้นสุดกิจกรรม</button>
                    )}
                  </div>
                  {/* Organizer approvals list (pending members) */}
                  {Array.isArray(group.members) && group.members.some(m => m.status === 'pending') && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-2">รออนุมัติ</div>
                      <ul className="space-y-2 max-h-40 overflow-auto">
                        {group.members.filter(m => m.status === 'pending').map(m => (
                          <li key={m.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <img className="w-6 h-6 rounded-full object-cover border" src={getProfilePictureURL(m.user?.picture)} onError={(e)=>{e.target.style.display='none';}} />
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm truncate">{m.user?.fullName || m.user?.id}</span>
                                {m.user?.id && (
                                  <span className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0">
                                    <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                                    {(() => {
                                      const s = m.user.reputationScore ?? reps[m.user.id]?.score;
                                      const text = (typeof s === 'number' && Number.isFinite(s)) ? s.toFixed(1) : '—';
                                      return <span>{text}</span>;
                                    })()}
                                    <span className="text-gray-400">({m.user.reputationCount ?? reps[m.user.id]?.count ?? 0})</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={async () => { await groupsAPI.approve(group.id, m.id); await load(); }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                            >อนุมัติ</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : !myMembership && group.status === 'upcoming' ? (
                <button className="rounded-xl bg-emerald-600 text-white py-3 hover:bg-emerald-700 transition-smooth" disabled={joining} onClick={handleJoin}>
                  {group.joinPolicy === 'auto' ? 'เข้าร่วมทันที' : 'ขอเข้าร่วม'}
                </button>
              ) : myMembership && myMembership.role !== 'organizer' ? (
                <div className="flex gap-3">
                  {myMembership.status === 'pending' && (
                    <div className="flex-1 rounded-xl bg-yellow-100 text-yellow-900 py-3 text-center font-medium border border-yellow-200">รออนุมัติจากผู้จัด</div>
                  )}
                  <button className="flex-1 rounded-xl bg-red-600 text-white py-3 hover:bg-red-700 transition-smooth" disabled={joining} onClick={handleLeave}>ออกจากกลุ่ม</button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Email reminder notice */}
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3 animate-fadeInUp animation-delay-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600 mt-0.5"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 4.716a3 3 0 01-2.844 0L1.5 8.67z" /><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.337 4.933a1.5 1.5 0 001.426 0L22.5 6.908z" /></svg>
            <div className="text-sm text-blue-900">
              <div>ระบบจะส่งอีเมลแจ้งเตือนไปยังสมาชิก</div>
              <div><span className="font-semibold">ล่วงหน้า 2 ชั่วโมง</span> ก่อนถึงเวลานัด</div>
            </div>
          </div>

          {/* Share (moved below email reminder) */}
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-650">
            <div className="font-semibold mb-3 text-gray-800">แชร์กลุ่มนี้</div>
            <div className="flex gap-3">
              <button onClick={copyLink} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-smooth"><LinkIcon className="w-5 h-5"/>คัดลอกลิงก์</button>
              <button onClick={() => setShowQR(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-smooth"><QrCodeIcon className="w-5 h-5"/>QR Code</button>
            </div>
          </div>
          {/* Report summary (if already reported) */}
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center text-rose-700">
            {myReport ? (
              <div className="space-y-1">
                <div className="font-semibold">รายงานปัญหากลุ่มนี้</div>
                <div className="text-sm">สาเหตุ: {reasonLabels[myReport.reason] || myReport.reason}</div>
                {myReport.description && <div className="text-sm">รายละเอียด: {myReport.description}</div>}
                <div className="text-xs text-rose-600">ส่งเมื่อ {new Date(myReport.createdAt).toLocaleString('th-TH', { hour12: false })}</div>
              </div>
            ) : (
              <button onClick={() => setShowReport(true)} className="w-full rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 transition-smooth">รายงานปัญหากลุ่มนี้</button>
            )}
          </div>
          {/* Removed duplicate report button to keep a single entry point */}
        </div>

        {/* Right column: members list and notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Safety Tips moved to top */}
          <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-5 animate-fadeInUp animation-delay-400">
            <div className="font-semibold text-yellow-900 mb-2">คำแนะนำความปลอดภัย</div>
            <ul className="list-disc pl-5 text-sm text-yellow-900 space-y-1">
              <li>นัดพบในพื้นที่สาธารณะ</li>
              <li>ชวนเพื่อนไปด้วยหากเป็นการพบครั้งแรก</li>
              <li>หลีกเลี่ยงการให้ข้อมูลส่วนตัวเกินจำเป็น</li>
            </ul>
          </div>
          {/* Share card moved to left column */}

          {/* Pinned announcement */}
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-400">
            <div className="flex items-center gap-2 mb-3">
              <MegaphoneIcon className="w-5 h-5 text-rose-600" />
              <div className="font-semibold text-gray-800">ประกาศสำคัญ</div>
              <div className="ml-auto flex items-center gap-2">
                {myMembership?.role === 'organizer' && (
                  group?.pinnedAnnouncementText ? (
                    <>
                      <button onClick={() => setIsEditingAnn(v=>!v)} className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">แก้ไข</button>
                      <button onClick={clearAnnouncement} className="text-sm px-3 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50">เอาออก</button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditingAnn(true)} className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">ปักหมุด</button>
                  )
                )}
              </div>
            </div>
            {group?.pinnedAnnouncementText && !isEditingAnn && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4">
                <div className="whitespace-pre-wrap leading-relaxed">{group.pinnedAnnouncementText}</div>
                {group.pinnedAnnouncementAt && (
                  <div className="text-xs text-rose-700 mt-2">อัปเดต {new Date(group.pinnedAnnouncementAt).toLocaleString('th-TH', { hour12: false })}</div>
                )}
              </div>
            )}
            {isEditingAnn && myMembership?.role === 'organizer' && (
              <div className="space-y-2">
                <textarea value={annText} onChange={(e)=>setAnnText(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" placeholder="พิมพ์ประกาศสำคัญของกลุ่ม..." />
                <div className="flex gap-2">
                  <button onClick={saveAnnouncement} className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">บันทึก</button>
                  <button onClick={()=>{ setIsEditingAnn(false); setAnnText(group?.pinnedAnnouncementText || ''); }} className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50">ยกเลิก</button>
                </div>
              </div>
            )}
            {!group?.pinnedAnnouncementText && !isEditingAnn && (
              <div className="text-sm text-gray-500">ยังไม่มีประกาศ</div>
            )}
          </div>

          {/* Group Description removed per request */}

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="font-semibold">ผู้เข้าร่วม</div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-auto">
              {group.members?.map(m => (
                <li key={m.id} className="text-sm flex items-center gap-2 transition-smooth">
                  <img
                    className="w-8 h-8 rounded-full object-cover bg-white border"
                    src={getProfilePictureURL(m.user?.picture)}
                    onError={(e)=>{e.target.style.display='none';}}
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${m.status === 'approved' || m.status === 'checked_in' ? 'bg-emerald-500' : m.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{m.user?.fullName || m.user?.id}</span>
                        {(() => {
                          const u = m.user;
                          if (!u || !u.id) return null;
                          const repScore = u.reputationScore ?? reps[u.id]?.score;
                          const repCount = u.reputationCount ?? reps[u.id]?.count ?? 0;
                          const scoreText = (typeof repScore === 'number' && Number.isFinite(repScore)) ? repScore.toFixed(1) : '—';
                          return (
                            <span className="flex items-center gap-1 text-[11px] text-gray-600 flex-shrink-0">
                              <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                              <span>{scoreText}</span>
                              <span className="text-gray-400">({repCount})</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">{m.role} ({m.status}{m.checkedInAt ? ', checked-in' : ''})</div>
                    </div>
                  </div>
                  {myMembership?.role === 'organizer' && group.status === 'ongoing' && (
                    m.checkedInAt ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs ml-auto">
                        <CheckCircleIcon className="w-4 h-4" /> เช็คแล้ว
                      </div>
                    ) : (
                      m.status === 'approved' && (
                        <button onClick={() => handleCheckIn(m.id)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 ml-auto">เช็คชื่อ</button>
                      )
                    )
                  )}
                  {/* รายงานเป็นกลุ่มเท่านั้น: ปุ่มรายงานต่อคนถูกยกเลิก */}
                </li>
              ))}
            </ul>
          </div>

          {/* (removed duplicate safety tips from bottom after moving to top) */}

          {/* Map Display - Always show */}
          <div className="relative animate-fadeInUp animation-delay-700">
            <MapDisplay
              location={group.latitude && group.longitude ? {
                lat: group.latitude,
                lng: group.longitude,
                name: group.locationName,
                address: group.address
              } : null}
              title="สถานที่จัดกิจกรรม"
              className="mb-4"
              showMarkers={true}
            />
            {/* Read-only map - no edit button */}
          </div>

          {/* Group Chat */}
          {myMembership && (
            <div className="animate-fadeInUp animation-delay-800">
              <GroupChat groupId={group.id} currentUserId={currentUserId} />
            </div>
          )}

          {/* Rating panel after completion */}
          {group.status === 'completed' && myMembership && (
            <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm animate-fadeInUp animation-delay-900">
              <div className="font-semibold mb-3">ให้คะแนนเพื่อนร่วมกลุ่ม</div>
              {ratingTargets.length === 0 ? (
                <div className="text-sm text-gray-500">ให้คะแนนได้เฉพาะผู้ที่เช็คชื่อเช่นเดียวกับคุณ</div>
              ) : (
                <div className="space-y-3">
                  {ratingTargets.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <img className="w-8 h-8 rounded-full object-cover bg-white border" src={getProfilePictureURL(m.user?.picture)} onError={(e)=>{e.target.style.display='none';}} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{m.user?.fullName || m.user?.id}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((v) => {
                          const current = myGiven[m.user?.id] ?? (ratings[m.id] || 0);
                          const selected = current >= v;
                          const disabled = false;
                          return (
                            <button
                              key={v}
                              disabled={disabled}
                              onClick={() => setRatings(prev => ({ ...prev, [m.id]: v }))}
                              className={`w-7 h-7 rounded-full border text-xs ${ selected ? 'bg-yellow-400 border-yellow-500 text-white' : 'border-gray-300 text-gray-500 hover:bg-gray-100' } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >{v}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div>
                    <button onClick={submitRatings} className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">ส่งคะแนน</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-3">รายงานปัญหา</h3>
            <label className="block text-sm text-gray-700 mb-1">สาเหตุ</label>
            <div className="relative mb-3">
              <select value={reportReason} onChange={(e)=>setReportReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 appearance-none pr-10">
                <option value="">เลือกสาเหตุ</option>
                <option value="spam">สแปมหรือโฆษณา</option>
                <option value="harassment">คุกคาม/ไม่เหมาะสม</option>
                <option value="fake">ข้อมูลปลอม/ทำให้เข้าใจผิด</option>
                <option value="safety">ความปลอดภัยสถานที่</option>
                <option value="other">อื่นๆ</option>
              </select>
              <ChevronDownIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <label className="block text-sm text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea value={reportDesc} onChange={(e)=>setReportDesc(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="เล่าเหตุการณ์สั้นๆ" />
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded-lg" onClick={()=>setShowReport(false)}>ยกเลิก</button>
              <button className="px-4 py-2 rounded-lg bg-red-600 text-white" onClick={()=> submitReport({ targetType: 'group', groupId: Number(id), reason: reportReason || 'other', description: reportDesc })}>ส่งรายงาน</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[320px] text-center">
            <div className="font-semibold mb-2">สแกนเพื่อเข้าหน้าโปรด</div>
            <div className="bg-white p-3 inline-block">
              <img
                className="w-56 h-56"
                alt="QR"
                src={qrSrc}
                onError={(e) => { e.currentTarget.onerror = null; setQrSrc(qrFallback); }}
              />
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <button onClick={downloadQR} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">บันทึก QR</button>
              <button onClick={() => setShowQR(false)} className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
