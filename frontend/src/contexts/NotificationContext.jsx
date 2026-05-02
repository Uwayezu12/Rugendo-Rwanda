import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 60_000;
const DROPDOWN_LIMIT = 5;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const pollRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result?.count ?? 0);
    } catch {
      // silent
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({ limit: DROPDOWN_LIMIT, page: 1 });
      setNotifications(result?.notifications ?? []);
      setUnreadCount((prev) => result?.notifications
        ? result.notifications.filter((n) => n.status === 'UNREAD').length
        : prev
      );
      // also sync accurate count
      await refreshUnreadCount();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, status: 'READ' } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      refreshUnreadCount();
    } catch {
      // silent
    }
  }, [refreshUnreadCount]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
      refreshUnreadCount();
    } catch {
      // silent
    }
  }, [refreshUnreadCount]);

  const archiveNotification = useCallback(async (id) => {
    try {
      await notificationService.archiveNotification(id);
      setNotifications((prev) => {
        const wasUnread = prev.find((n) => n.id === id)?.status === 'UNREAD';
        setUnreadCount((c) => wasUnread ? Math.max(0, c - 1) : c);
        return prev.filter((n) => n.id !== id);
      });
      refreshUnreadCount();
    } catch {
      // silent
    }
  }, [refreshUnreadCount]);

  // Fetch on login; start polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    refreshNotifications();
    // Poll full notification list so new notifications appear without a reload.
    // refreshNotifications already syncs the unread count too.
    pollRef.current = setInterval(refreshNotifications, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllRead,
        archiveNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
