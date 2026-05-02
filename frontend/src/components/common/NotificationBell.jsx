import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

// Role → notifications path mapping
const ROLE_NOTIF_PATHS = {
  passenger:     '/passenger/notifications',
  admin:         '/admin/notifications',
  super_admin:   '/super-admin/notifications',
  company_admin: '/company-admin/notifications',
  operator:      '/operator/notifications',
};

function deriveNotifPath(pathname) {
  for (const [prefix, path] of Object.entries({
    '/passenger':     '/passenger/notifications',
    '/admin':         '/admin/notifications',
    '/super-admin':   '/super-admin/notifications',
    '/company-admin': '/company-admin/notifications',
    '/operator':      '/operator/notifications',
  })) {
    if (pathname.startsWith(prefix)) return path;
  }
  return '/passenger/notifications';
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_COLORS = {
  BOOKING:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAYMENT:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SCHEDULE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  BOARDING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ACCOUNT:  'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  COMPANY:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SYSTEM:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SECURITY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function BellIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6Z" />
      <path d="M8 16a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead, refreshNotifications } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const viewAllPath = useMemo(() => {
    const fromPath = deriveNotifPath(location.pathname);
    // On public pages the path-based lookup returns the passenger default.
    // Fall back to the user's actual role so "View all" goes to the right page.
    if (fromPath === '/passenger/notifications' && user?.role) {
      const roleKey = user.role.toLowerCase();
      return ROLE_NOTIF_PATHS[roleKey] ?? '/passenger/notifications';
    }
    return fromPath;
  }, [location.pathname, user?.role]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleOpen = () => {
    if (!open) refreshNotifications();
    setOpen((v) => !v);
  };

  const handleNotifClick = async (notif) => {
    setOpen(false);
    if (notif.status === 'UNREAD') await markAsRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    await markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t('notificationBell')}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-brand-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-brand-950"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                {t('notificationMarkAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mb-2 text-2xl">🔔</div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('notificationNoNotifications')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotifClick(notif)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${notif.status === 'UNREAD' ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''}`}
                >
                  {/* Unread dot */}
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notif.status === 'UNREAD' ? 'bg-brand-500' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{notif.title}</span>
                      <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t(`notificationType${notif.type}`)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">{notif.message}</p>
                    <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">{timeAgo(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate(viewAllPath); }}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {t('notificationViewAll')} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
