import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext.jsx';
import { notificationsAPI } from '../../services/api';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { items: initialItems, unreadCount, markRead, markAllRead } = useNotifications();
  const [items, setItems] = useState(initialItems || []);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchFirst() {
      setLoading(true);
      try {
        const res = await notificationsAPI.list({ limit: 20 });
        if (!ignore) {
          const { items, nextCursor } = res.data.data;
          setItems(items);
          setNextCursor(nextCursor);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchFirst();
    return () => { ignore = true; };
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await notificationsAPI.list({ limit: 20, cursor: nextCursor });
      const { items: more, nextCursor: nc } = res.data.data;
      setItems(prev => [...prev, ...more]);
      setNextCursor(nc);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read then refresh the page automatically
  const handleMarkAllAndRefresh = async () => {
    try {
      await markAllRead();
    } finally {
      // Hard refresh to reflect changes across the app (badge, list, etc.)
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-sm text-gray-600">ยังไม่อ่าน {unreadCount} รายการ</span>
          )}
          <button
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            onClick={handleMarkAllAndRefresh}
          >
            ทำทั้งหมดว่าอ่านแล้ว
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 divide-y">
        {items.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">ไม่มีการแจ้งเตือน</div>
        )}
        {items.map(n => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.readAt ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <BellIcon className={`w-6 h-6 ${n.readAt ? 'text-gray-500' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`font-medium ${n.readAt ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              {n.body && <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>}
              <div className="mt-2 flex items-center gap-2">
                {!n.readAt && (
                  <button
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    onClick={() => markRead(n.id)}
                  >
                    <CheckIcon className="w-4 h-4" /> ทำว่าอ่านแล้ว
                  </button>
                )}
                {n.link && (
                  <a href={n.link} className="text-xs text-gray-600 hover:text-gray-900 hover:underline">เปิดลิงก์</a>
                )}
              </div>
            </div>
          </div>
        ))}
        {nextCursor && (
          <div className="p-3 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              {loading ? 'กำลังโหลด…' : 'โหลดเพิ่มเติม'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
