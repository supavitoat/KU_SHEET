/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { getSocket } from '../lib/socket';

const NotificationsContext = createContext();

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  nextCursor: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LIST':
      return { ...state, items: action.items, unreadCount: action.unreadCount, nextCursor: action.nextCursor, loading: false };
    case 'ADD_ONE':
      return { ...state, items: [action.item, ...state.items].slice(0, 20), unreadCount: state.unreadCount + 1 };
    case 'MARK_READ': {
      const items = state.items.map(it => it.id === action.id ? { ...it, readAt: new Date().toISOString() } : it);
      return { ...state, items, unreadCount: Math.max(0, state.unreadCount - 1) };
    }
    case 'MARK_ALL_READ':
      return { ...state, items: state.items.map(it => ({ ...it, readAt: it.readAt || new Date().toISOString() })), unreadCount: 0 };
    case 'LOADING':
      return { ...state, loading: true };
    default:
      return state;
  }
}

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    dispatch({ type: 'LOADING' });
    try {
      const res = await notificationsAPI.list({ limit: 10 });
      const { items, unreadCount, nextCursor } = res.data.data;
      dispatch({ type: 'SET_LIST', items, unreadCount, nextCursor });
  } catch {
      dispatch({ type: 'SET_LIST', items: [], unreadCount: 0, nextCursor: null });
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
  const onNotify = (payload) => dispatch({ type: 'ADD_ONE', item: payload });
    socket.on('notify:new', onNotify);
    return () => { socket.off('notify:new', onNotify); };
  }, [isAuthenticated]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      dispatch({ type: 'MARK_READ', id });
  } catch (err) { console.warn('Failed to mark notification read', err); }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      dispatch({ type: 'MARK_ALL_READ' });
  } catch (err) { console.warn('Failed to mark all notifications read', err); }
  };

  return (
    <NotificationsContext.Provider value={{ ...state, reload: load, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
