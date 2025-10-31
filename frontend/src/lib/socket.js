import { io } from 'socket.io-client';
import { getBaseURL } from '../services/api';

let socket;
let currentToken;

export function getSocket() {
  const apiBase = getBaseURL();
  const baseHttp = apiBase.replace(/\/api$/, '');
  const latest = localStorage.getItem('token') || undefined;

  if (!socket) {
    currentToken = latest;
    socket = io(baseHttp, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: { token: currentToken }
    });
    return socket;
  }

  // Update token on existing socket and reconnect if changed
  if (latest && latest !== currentToken) {
    currentToken = latest;
    try { socket.auth = { token: currentToken }; } catch { /* no-op */ }
    try {
      if (socket.connected) socket.disconnect();
      socket.connect();
    } catch { /* no-op */ }
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch { /* no-op */ }
    socket = undefined;
    currentToken = undefined;
  }
}
