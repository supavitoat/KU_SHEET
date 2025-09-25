import React from 'react';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminSidebar from '../../components/common/AdminSidebar';
import { ClockIcon } from '@heroicons/react/24/outline';

const EmptyState = () => (
  <div className="text-center py-10 text-gray-500">ยังไม่มีโค้ดส่วนลด</div>
);

// Helpers for 24-hour local formatting
const isoToLocalParts = (iso) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (isNaN(d)) return { date: '', time: '' };
  const tzShifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  const isoLocal = tzShifted.toISOString();
  const date = isoLocal.slice(0, 10); // yyyy-MM-dd
  const time = isoLocal.slice(11, 16); // HH:mm
  return { date, time };
};

const combineLocalToISO = (date, time) => {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}`); // treated as local time
  if (isNaN(dt)) return null;
  return dt.toISOString();
};

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

const formatLocal24 = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleString('th-TH', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: undefined, hour12: false
  });
};

const DiscountForm = ({ onSubmit, loading, initial }) => {
  const [code, setCode] = React.useState(initial?.code || '');
  const [type, setType] = React.useState(initial?.type || 'percentage');
  const [value, setValue] = React.useState(initial?.value ?? 10);
  const [description, setDescription] = React.useState(initial?.description || '');
  const [active, setActive] = React.useState(initial?.active ?? true);
  const initStart = isoToLocalParts(initial?.startsAt);
  const initEnd = isoToLocalParts(initial?.endsAt);
  const [startDate, setStartDate] = React.useState(initStart.date);
  const [startTime, setStartTime] = React.useState(initStart.time);
  const [endDate, setEndDate] = React.useState(initEnd.date);
  const [endTime, setEndTime] = React.useState(initEnd.time);
  const [usageLimit, setUsageLimit] = React.useState(initial?.usageLimit ?? '');
  const [perUserLimit, setPerUserLimit] = React.useState(initial?.perUserLimit ?? '');

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      code,
      type,
      value: Number(value),
      description,
      active,
      startsAt: combineLocalToISO(startDate, startTime),
      endsAt: combineLocalToISO(endDate, endTime),
      usageLimit: usageLimit === '' ? null : Number(usageLimit),
      perUserLimit: perUserLimit === '' ? null : Number(perUserLimit),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {!initial && (
        <div>
          <label className="block text-sm font-medium">โค้ด</label>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required className="mt-1 w-full border rounded px-3 py-2" placeholder="WELCOME10" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">ประเภท</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
            <option value="percentage">เปอร์เซ็นต์</option>
            <option value="fixed">จำนวนคงที่</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">มูลค่า</label>
          <input type="number" value={value} onChange={e=>setValue(e.target.value)} min={0} max={type==='percentage'?100:999999} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">คำอธิบาย</label>
        <input value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">เริ่มใช้ (วันที่)</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          <label className="block text-xs text-gray-500 mt-2">เวลา (24 ชม.)</label>
          <div className="mt-1"><TimeField24Inline value={startTime} onChange={setStartTime} /></div>
        </div>
        <div>
          <label className="block text-sm font-medium">สิ้นสุด (วันที่)</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          <label className="block text-xs text-gray-500 mt-2">เวลา (24 ชม.)</label>
          <div className="mt-1"><TimeField24Inline value={endTime} onChange={setEndTime} /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">จำกัดจำนวนใช้ทั้งหมด</label>
          <input type="number" value={usageLimit} onChange={e=>setUsageLimit(e.target.value)} min={0} className="mt-1 w-full border rounded px-3 py-2" placeholder="ไม่จำกัดปล่อยว่าง" />
        </div>
        <div>
          <label className="block text-sm font-medium">จำกัด/ผู้ใช้</label>
          <input type="number" value={perUserLimit} onChange={e=>setPerUserLimit(e.target.value)} min={0} className="mt-1 w-full border rounded px-3 py-2" placeholder="ไม่จำกัดปล่อยว่าง" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="active" type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
        <label htmlFor="active">เปิดใช้งาน</label>
      </div>
      <div className="flex gap-2">
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{initial? 'บันทึกการแก้ไข' : 'สร้างโค้ด'}</button>
      </div>
    </form>
  );
};

const DiscountCodesPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [codes, setCodes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  const load = async () => {
    try {
      const res = await adminAPI.listDiscounts();
      setCodes(res.data.data || []);
    } catch {
      toast.error('โหลดโค้ดส่วนลดล้มเหลว');
    }
  };

  React.useEffect(() => {
    // เรียกโหลดเมื่อยืนยันว่าเป็นแอดมินเท่านั้น
    if (!authLoading && user && isAdmin && typeof isAdmin === 'function' && isAdmin()) {
      load();
    }
  }, [authLoading, user, isAdmin]);
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้า Admin</p>
        </div>
      </div>
    );
  }

  const onCreate = async (payload) => {
    try {
      setLoading(true);
      await adminAPI.createDiscount(payload);
      toast.success('สร้างโค้ดสำเร็จ');
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || 'สร้างโค้ดล้มเหลว';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const onUpdate = async (id, payload) => {
    try {
      setLoading(true);
      await adminAPI.updateDiscount(id, payload);
      toast.success('บันทึกการแก้ไขแล้ว');
      setEditing(null);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || 'อัปเดตโค้ดล้มเหลว';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const onToggle = async (id) => {
    try {
      await adminAPI.toggleDiscount(id);
      await load();
    } catch { toast.error('สลับสถานะไม่สำเร็จ'); }
  };

  const onDelete = async (id) => {
    if (!confirm('ยืนยันลบโค้ดส่วนลดนี้?')) return;
    try {
      await adminAPI.deleteDiscount(id);
      toast.success('ลบแล้ว');
      await load();
    } catch { toast.error('ลบไม่สำเร็จ'); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">จัดการโค้ดส่วนลด</h1>
              <p className="text-gray-600">สร้าง แก้ไข เปิด/ปิด และลบโค้ดส่วนลด</p>
            </div>
            {/* Summary badges */}
            <StatsBar codes={codes} />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded shadow p-4">
                <h2 className="font-semibold mb-3">สร้างโค้ดใหม่</h2>
                <DiscountForm onSubmit={onCreate} loading={loading} />
              </div>
              <div className="bg-white rounded shadow p-4">
                <h2 className="font-semibold mb-3">{editing ? `แก้ไข: ${editing.code}` : 'แก้ไขโค้ด'}</h2>
                {editing ? (
                  <DiscountForm initial={editing} loading={loading} onSubmit={(p)=>onUpdate(editing.id, p)} />
                ) : (
                  <div className="text-gray-500">เลือกโค้ดจากรายการเพื่อแก้ไข</div>
                )}
              </div>
            </div>
            <div className="bg-white rounded shadow p-4 mt-6">
              <h2 className="font-semibold mb-3">รายการโค้ด</h2>
              {codes.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">โค้ด</th>
                        <th className="p-2">ประเภท</th>
                        <th className="p-2">มูลค่า</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2">การใช้งาน</th>
                        <th className="p-2">ช่วงเวลา</th>
                        <th className="p-2 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map(c => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono">{c.code}</td>
                          <td className="p-2">{c.type === 'percentage' ? 'เปอร์เซ็นต์' : 'จำนวนคงที่'}</td>
                          <td className="p-2">{c.type === 'percentage' ? `${c.value}%` : `${c.value.toLocaleString()}฿`}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                          </td>
                          <td className="p-2">
                            <UsageCell used={Number(c.timesUsed||0)} limit={c.usageLimit} />
                          </td>
                          <td className="p-2">
                            {formatLocal24(c.startsAt)} → {formatLocal24(c.endsAt)}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2 justify-end">
                              <button onClick={()=>setEditing(c)} className="px-2 py-1 border rounded">แก้ไข</button>
                              <button onClick={()=>onToggle(c.id)} className="px-2 py-1 border rounded">สลับสถานะ</button>
                              <button onClick={()=>onDelete(c.id)} className="px-2 py-1 border rounded text-red-600">ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small components for usage display and summary
const UsageCell = ({ used = 0, limit }) => {
  const isLimited = typeof limit === 'number' && limit >= 0;
  const safeLimit = isLimited ? Math.max(0, Number(limit)) : null;
  const safeUsed = Math.max(0, Number(used));
  const pct = isLimited && safeLimit > 0 ? Math.min(100, Math.round((safeUsed / safeLimit) * 100)) : 0;
  const barColor = isLimited ? (pct >= 100 ? 'bg-red-500' : 'bg-blue-500') : 'bg-gray-400';

  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>ใช้แล้ว</span>
        <span>
          {isLimited ? `${safeUsed}/${safeLimit}` : `${safeUsed} (ไม่จำกัด)`}
        </span>
      </div>
      <div className="h-2 mt-1 rounded bg-gray-100 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${isLimited ? pct : 100}%` }} />
      </div>
    </div>
  );
};

const StatsBar = ({ codes = [] }) => {
  const totals = React.useMemo(() => {
    let used = 0; let remaining = 0; let unlimited = 0;
    for (const c of codes) {
      const u = Math.max(0, Number(c.timesUsed || 0));
      used += u;
      if (typeof c.usageLimit === 'number' && c.usageLimit >= 0) {
        remaining += Math.max(0, Number(c.usageLimit) - u);
      } else {
        unlimited += 1;
      }
    }
    return { used, remaining, unlimited };
  }, [codes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">ใช้ไปทั้งหมด</div>
        <div className="text-2xl font-bold">{totals.used.toLocaleString()}</div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">คงเหลือ (โค้ดจำกัดจำนวน)</div>
        <div className="text-2xl font-bold">{totals.remaining.toLocaleString()}</div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs text-gray-500">โค้ดไม่จำกัดจำนวน</div>
        <div className="text-2xl font-bold">{totals.unlimited.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default DiscountCodesPage;
