import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { EyeIcon, TrashIcon, ExclamationTriangleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminSidebar from '../../components/common/AdminSidebar';
import { adminAPI, adminReportsAPI } from '../../services/api';

const styles = `@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.animate-fadeInUp{animation:fadeInUp .6s ease-out both;will-change:transform,opacity}.transition-smooth{transition:all .25s ease}`;

const GroupsManagePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [groups, setGroups] = React.useState([]);
  const [filters, setFilters] = React.useState({ text: '', status: '' });
  const [selectedGroupReports, setSelectedGroupReports] = React.useState([]);
  const [reportsOpen, setReportsOpen] = React.useState(false);
  const [reportsGroupId, setReportsGroupId] = React.useState(null);
  const groupStatusText = {
    upcoming: 'กำลังจะเริ่ม',
    ongoing: 'กำลังดำเนินการ',
    completed: 'สิ้นสุดแล้ว',
    cancelled: 'ยกเลิกแล้ว'
  };
  const statusLabels = {
    open: { text: 'รอพิจารณา', cls: 'bg-amber-100 text-amber-800' },
    in_review: { text: 'กำลังตรวจสอบ', cls: 'bg-blue-100 text-blue-800' },
    resolved: { text: 'ตรวจสอบแล้ว', cls: 'bg-emerald-100 text-emerald-800' },
    rejected: { text: 'ปฏิเสธ', cls: 'bg-gray-200 text-gray-700' }
  };
  const reasonLabels = {
    spam: 'สแปมหรือโฆษณา',
    harassment: 'คุกคาม/ไม่เหมาะสม',
    fake: 'ข้อมูลปลอม/ทำให้เข้าใจผิด',
    safety: 'ความปลอดภัยสถานที่',
    other: 'อื่นๆ'
  };
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState({ id: null, title: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGroups(filters);
      setGroups(res.data?.data || []);
    } catch {
      setGroups([]); // ignore
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => { load(); }, [load]);

  // Removed cancel status action per request

  const deleteGroup = async (id) => {
    await adminAPI.deleteGroup(id);
    setConfirmOpen(false);
    setConfirmTarget({ id: null, title: '' });
    load();
  };

  const openReports = async (groupId) => {
    try {
      const res = await adminReportsAPI.list({ groupId });
      setSelectedGroupReports(res.data?.data || []);
      setReportsOpen(true);
      setReportsGroupId(groupId);
    } catch {
      setSelectedGroupReports([]);
      setReportsOpen(true);
    }
  };
  const markResolved = async (reportId) => {
    try {
      await adminReportsAPI.update(reportId, { status: 'resolved' });
      if (reportsGroupId) {
        const res = await adminReportsAPI.list({ groupId: reportsGroupId });
        setSelectedGroupReports(res.data?.data || []);
      }
    } catch {
      // ignore
    }
  };
  // Removed unused: banUserFromReport

  if (authLoading) return (<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>);
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center">ไม่มีสิทธิ์เข้าถึง</div></div>);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 animate-fadeInUp" style={{animationDelay:'200ms'}}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการกลุ่มติว</h1>
              <p className="text-gray-600">ค้นหา ดูรายละเอียด อัปเดตสถานะ หรือลบกลุ่มติว</p>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col md:flex-row gap-3 animate-fadeInUp" style={{animationDelay:'300ms'}}>
              <input
                placeholder="ค้นหาชื่อ/ที่อยู่/คำอธิบาย"
                className="flex-1 rounded-xl border px-4 py-2 transition-smooth"
                value={filters.text}
                onChange={(e)=>setFilters({...filters, text: e.target.value})}
              />
              <select className="rounded-xl border px-3 py-2 transition-smooth" value={filters.status} onChange={(e)=>setFilters({...filters, status: e.target.value})}>
                <option value="">สถานะทั้งหมด</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeInUp" style={{animationDelay:'400ms'}}>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">ชื่อกลุ่ม</th>
                      <th className="px-4 py-3 text-left">ผู้จัด</th>
                      <th className="px-4 py-3">เริ่ม</th>
                      <th className="px-4 py-3">สิ้นสุด</th>
                      <th className="px-4 py-3">สมาชิก</th>
                      <th className="px-4 py-3">สถานะ</th>
                      <th className="px-4 py-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">กำลังโหลด...</td></tr>
                    ) : groups.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">ไม่มีกลุ่ม</td></tr>
                    ) : groups.map((g, idx) => (
                      <tr key={g.id} className="border-t hover:bg-gray-50 transition-smooth animate-fadeInUp" style={{animationDelay:`${450 + idx*50}ms`}}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{g.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[260px]">{g.locationName || g.address || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">{g.organizer?.fullName || g.organizer?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{new Date(g.startAt).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short', hour12:false })}</td>
                        <td className="px-4 py-3 text-gray-700">{new Date(g.endAt).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short', hour12:false })}</td>
                        <td className="px-4 py-3 text-center">{g.approvedCount ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium ${g.status==='upcoming'?'bg-emerald-100 text-emerald-700':g.status==='completed'?'bg-gray-200 text-gray-700':g.status==='ongoing'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-700'}`}>{groupStatusText[g.status] || g.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-smooth"
                              aria-label="ดูรายละเอียด"
                              title="ดูรายละเอียด"
                              onClick={()=>navigate(`/groups/${g.id}`)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="relative p-1.5 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-smooth"
                              aria-label="รายงานของกลุ่มนี้"
                              title="รายงานของกลุ่มนี้"
                              onClick={()=>openReports(g.id)}
                            >
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              {g.reportCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                                  {g.reportCount}
                                </span>
                              )}
                            </button>
                            <button
                              className="p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-smooth"
                              aria-label="ลบกลุ่ม"
                              title="ลบกลุ่ม"
                              onClick={()=>{ setConfirmTarget({ id: g.id, title: g.title }); setConfirmOpen(true); }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-fadeInUp" role="dialog" aria-modal="true">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">ยืนยันการลบกลุ่ม</h3>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม <span className="font-semibold">{confirmTarget.title}</span>?<br/>
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-smooth"
                  onClick={() => { setConfirmOpen(false); setConfirmTarget({ id: null, title: '' }); }}
                >
                  ยกเลิก
                </button>
                <button
                  className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-smooth"
                  onClick={() => deleteGroup(confirmTarget.id)}
                >
                  ลบกลุ่ม
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {reportsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 animate-fadeInUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">รายงานของกลุ่ม</h3>
                <button className="px-3 py-1 rounded-lg border" onClick={()=>setReportsOpen(false)}>ปิด</button>
              </div>
              <div className="max-h-[70vh] overflow-auto">
                {selectedGroupReports.length === 0 ? (
                  <div className="text-gray-500">ไม่พบรายงาน</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">ผู้รายงาน</th>
                        <th className="px-3 py-2 text-left">สาเหตุ</th>
                        <th className="px-3 py-2 text-left">รายละเอียด</th>
                        <th className="px-3 py-2">เวลา</th>
                        <th className="px-3 py-2">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroupReports.map((r)=> (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2">{r.reporter?.fullName || r.reporter?.email}</td>
                          <td className="px-3 py-2">{reasonLabels[r.reason] || r.reason}</td>
                          <td className="px-3 py-2">{r.description || '-'}</td>
                          <td className="px-3 py-2 text-center">{new Date(r.createdAt).toLocaleString('th-TH', { hour12:false })}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusLabels[r.status]?.cls || 'bg-gray-100 text-gray-700'}`}>
                                {statusLabels[r.status]?.text || r.status}
                              </span>
                              {r.status === 'open' && (
                                <button
                                  className="text-xs px-2 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  onClick={()=> markResolved(r.id)}
                                >
                                  ตรวจสอบแล้ว
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManagePage;


