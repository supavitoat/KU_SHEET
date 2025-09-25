import React from 'react';
import api, { chatAPI, getProfilePictureURL } from '../../services/api';
import { getSocket } from '../../lib/socket';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const GroupChat = ({ groupId, currentUserId }) => {
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [canChat, setCanChat] = React.useState(true);
  const [socketReady, setSocketReady] = React.useState(false);
  const messagesContainerRef = React.useRef(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const loadMessages = React.useCallback(async () => {
    try {
      setLoading(true);
      // Verify membership and ensure chat exists; also returns recent messages
      const res = await chatAPI.getOrCreateChat(groupId);
      const data = res.data?.data || {};
      setCanChat(true);
      setMessages((data.messages || []).slice(-100));
    } catch (error) {
      const status = error?.response?.status;
      if (status === 403) {
        setCanChat(false);
        setMessages([]);
      } else {
        console.error('Error loading messages:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const content = newMessage.trim();
      const sock = getSocket();
      // Prefer socket to broadcast instantly; apply timeout to avoid hanging UI
      let ack = { ok: false };
      if (sock && sock.connected) {
        ack = await Promise.race([
          new Promise((resolve) => {
            try {
              sock.emit('chat:send', { groupId, content, messageType: 'text' }, (resp) => resolve(resp || { ok: false }));
            } catch {
              resolve({ ok: false });
            }
          }),
          new Promise((resolve) => setTimeout(() => resolve({ ok: false, timeout: true }), 4000))
        ]);
      }
      if (ack?.ok && ack.data && !ack.timeout) {
        // Prevent duplicate if the same id already appended via push
        setMessages(prev => (prev.some(m => m.id === ack.data.id) ? prev : [...prev, ack.data]));
      } else {
        // Fallback to REST if socket send failed (with timeout to avoid hang)
        try {
          const res = await api.post(`/groups/${groupId}/chat/messages`, { content, messageType: 'text' }, { timeout: 5000 });
          setMessages(prev => [...prev, res.data.data]);
        } catch (err) {
          console.error('REST send failed', err?.message || err);
        }
      }
      setNewMessage('');
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Socket.IO realtime subscription
  React.useEffect(() => {
    const sock = getSocket();
    let joined = false;

    if (!canChat) {
      // Not a member; do not join socket room
      return () => {};
    }

    const doJoin = () => {
      if (joined) return;
      sock.emit('chat:join', { groupId }, (ack) => {
        if (ack?.ok) {
          joined = true;
      setSocketReady(true);
        } else {
          console.warn('chat:join failed', ack?.error);
      setSocketReady(false);
        }
      });
    };

    // Join when connected and on reconnects
    if (sock.connected) doJoin();
    const onConnect = () => doJoin();
    const onReconnect = () => { joined = false; setSocketReady(false); doJoin(); };
    const onConnectError = (err) => { console.warn('socket connect_error', err?.message || err); setSocketReady(false); };
    const onDisconnect = () => { setSocketReady(false); joined = false; };

    sock.on('connect', onConnect);
    sock.io?.on?.('reconnect', onReconnect);
    sock.on('connect_error', onConnectError);
    sock.on('disconnect', onDisconnect);

    const onMsg = (payload) => {
      setMessages((prev) => (prev.some(m => m.id === payload.id) ? prev : [...prev, payload]));
      setTimeout(scrollToBottom, 50);
    };
    sock.on('chat:message', onMsg);
    return () => {
      try { sock.off('chat:message', onMsg); } catch (err) { console.warn('socket off failed', err); }
      try { sock.off('connect', onConnect); } catch (err) { console.debug('socket cleanup: connect off ignore', err?.message || err); }
      try { sock.io?.off?.('reconnect', onReconnect); } catch (err) { console.debug('socket cleanup: reconnect off ignore', err?.message || err); }
      try { sock.off('connect_error', onConnectError); } catch (err) { console.debug('socket cleanup: connect_error off ignore', err?.message || err); }
      try { sock.off('disconnect', onDisconnect); } catch (err) { console.debug('socket cleanup: disconnect off ignore', err?.message || err); }
      try { sock.emit('chat:leave', { groupId }); } catch (err) { console.warn('socket leave failed', err); }
    };
  }, [groupId, canChat]);

  // SSE fallback subscription (works even if Socket.IO fails)
  React.useEffect(() => {
    if (!canChat || socketReady) return undefined;
    try {
      const token = localStorage.getItem('token') || '';
      const base = (api?.defaults?.baseURL || '/api').replace(/\/$/, '');
      const url = `${base}/groups/${groupId}/chat/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url, { withCredentials: true });
      const onSseMessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (!payload || typeof payload !== 'object' || !payload.id) return;
          setMessages((prev) => (prev.some(m => m.id === payload.id) ? prev : [...prev, payload]));
          setTimeout(scrollToBottom, 50);
        } catch { /* ignore parse errors */ }
      };
  es.addEventListener('message', onSseMessage);
  es.addEventListener('error', () => { try { es.close(); } catch (err) { console.debug('SSE close on error failed', err); } });
  return () => { try { es.close(); } catch (err) { console.debug('SSE close cleanup failed', err); } };
    } catch {
      return undefined;
    }
  }, [groupId, canChat, socketReady]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
          <h3 className="font-semibold text-gray-800">แชทกลุ่ม</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">กำลังโหลดข้อความ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
          <h3 className="font-semibold text-gray-800">แชทกลุ่ม</h3>
          <div className="ml-auto text-sm text-gray-500">
            {messages.length} ข้อความ
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="h-80 overflow-y-auto p-4 space-y-3">
        {!canChat ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">คุณยังไม่ได้เข้าร่วมกลุ่ม</p>
            <p className="text-sm text-gray-400">เข้าร่วมกลุ่มก่อนจึงจะสามารถดูและส่งข้อความได้</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีข้อความในกลุ่มนี้</p>
            <p className="text-sm text-gray-400">เริ่มต้นการสนทนาได้เลย!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user.id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                  src={getProfilePictureURL(message.user.picture)}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  alt={message.user.fullName}
                />
                <div className={`flex-1 ${isOwn ? 'flex flex-col items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {message.user.fullName || 'ผู้ใช้'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl max-w-xs break-words ${
                      isOwn
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* end spacer */}
        <div />
      </div>

      {/* Input */}
  <div className="border-t border-gray-100 p-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
    disabled={sending || !canChat}
          />
          <button
            type="submit"
    disabled={!newMessage.trim() || sending || !canChat}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
