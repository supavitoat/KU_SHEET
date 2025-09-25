import React from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../../services/api';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    locationName: '',
    startAt: '',
    endAt: '',
    capacity: 10,
    joinPolicy: 'auto',
  });
  const [saving, setSaving] = React.useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.locationName) delete payload.locationName;
      await groupsAPI.create(payload);
      navigate('/groups');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">สร้างกลุ่มติว</h1>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="input input-bordered" name="title" placeholder="ชื่อกลุ่ม" value={form.title} onChange={onChange} required />
        <input className="input input-bordered md:col-span-2" name="locationName" placeholder="สถานที่ (เช่น อาคาร...)" value={form.locationName} onChange={onChange} />
        <textarea className="textarea textarea-bordered md:col-span-2" name="description" placeholder="รายละเอียด" value={form.description} onChange={onChange} />
        <input className="input input-bordered" name="startAt" type="datetime-local" value={form.startAt} onChange={onChange} required />
        <input className="input input-bordered" name="endAt" type="datetime-local" value={form.endAt} onChange={onChange} required />
        <input className="input input-bordered" name="capacity" type="number" min="1" value={form.capacity} onChange={onChange} />
        <select className="select select-bordered" name="joinPolicy" value={form.joinPolicy} onChange={onChange}>
          <option value="auto">อนุมัติอัตโนมัติ</option>
          <option value="approval">ต้องอนุมัติ</option>
        </select>
        {/* visibility removed */}
        <div className="md:col-span-2 flex gap-3">
          <button className="btn btn-primary" disabled={saving} type="submit">บันทึก</button>
          <button className="btn" type="button" onClick={() => navigate('/groups')}>ยกเลิก</button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupPage;
