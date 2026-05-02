import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const TABS = [
  { key: 'all',      statusParam: undefined },
  { key: 'unread',   statusParam: 'UNREAD' },
  { key: 'read',     statusParam: 'READ' },
  { key: 'archived', statusParam: 'ARCHIVED' },
];

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

const PRIORITY_COLORS = {
  LOW:    'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400',
  NORMAL: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  HIGH:   'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const LOCALE_BY_LANGUAGE = { en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw' };

function formatDateTime(isoString, locale) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5H9m6 0-8 8m8-8v6" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="16" height="3" rx="1" />
      <path d="M4 8v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8" />
      <path d="M8 12h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10l4 4 8-8" />
    </svg>
  );
}

export default function NotificationsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotifications();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [activeTab, setActiveTab]     = useState(0);
  const [notifications, setNots]     = useState([]);
  const [pagination, setPagination]  = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState(null);
  const [actionLoading, setActLoad]  = useState(null);

  const fetchPage = useCallback(async (tabIndex, page) => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = TABS[tabIndex].statusParam;
      const result = await notificationService.getNotifications({
        page,
        limit: 20,
        ...(statusParam ? { status: statusParam } : {}),
      });
      setNots(result?.notifications ?? []);
      setPagination(result?.pagination ?? { page: 1, total: 0, totalPages: 1 });
    } catch {
      setError(t('notificationLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPage(activeTab, 1);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (idx) => {
    setActiveTab(idx);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((p) => ({ ...p, page }));
    fetchPage(activeTab, page);
  };

  const handleMarkRead = async (id) => {
    setActLoad(id + '_read');
    try {
      await notificationService.markAsRead(id);
      setNots((prev) => prev.map((n) => n.id === id ? { ...n, status: 'READ' } : n));
      refreshUnreadCount();
    } catch { /* silent */ }
    setActLoad(null);
  };

  const handleArchive = async (id) => {
    setActLoad(id + '_archive');
    try {
      await notificationService.archiveNotification(id);
      setNots((prev) => prev.filter((n) => n.id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      refreshUnreadCount();
    } catch { /* silent */ }
    setActLoad(null);
  };

  const handleMarkAllRead = async () => {
    setActLoad('all');
    try {
      await notificationService.markAllRead();
      setNots((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      refreshUnreadCount();
    } catch { /* silent */ }
    setActLoad(null);
  };

  const handleOpen = async (notif) => {
    if (notif.status === 'UNREAD') await handleMarkRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const hasUnread = notifications.some((n) => n.status === 'UNREAD');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page title + mark all */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('notificationsPageTitle')}</h1>
        {hasUnread && (
          <button
            type="button"
            disabled={actionLoading === 'all'}
            onClick={handleMarkAllRead}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/40"
          >
            {t('notificationMarkAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800">
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(idx)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === idx
                ? 'bg-white shadow-sm text-gray-900 dark:bg-slate-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t(`notificationTab${tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-400 dark:text-slate-500">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => fetchPage(activeTab, pagination.page)}
            className="mt-3 text-sm font-medium text-red-700 underline dark:text-red-400"
          >
            {t('retry')}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 text-3xl">🔔</div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('notificationNoNotifications')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 ${idx < notifications.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''} ${notif.status === 'UNREAD' ? 'bg-brand-50/40 dark:bg-brand-950/10' : ''}`}
            >
              {/* Unread indicator */}
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notif.status === 'UNREAD' ? 'bg-brand-500' : 'bg-transparent border border-gray-200 dark:border-slate-600'}`} />

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{notif.title}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t(`notificationType${notif.type}`)}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_COLORS[notif.priority] ?? ''}`}>
                    {t(`notificationPriority${notif.priority.charAt(0) + notif.priority.slice(1).toLowerCase()}`)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{notif.message}</p>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                  {formatDateTime(notif.createdAt, locale)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {notif.actionUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpen(notif)}
                    title={t('notificationOpen')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 dark:hover:text-brand-400"
                  >
                    <ExternalLinkIcon />
                  </button>
                )}
                {notif.status === 'UNREAD' && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notif.id)}
                    disabled={actionLoading === notif.id + '_read'}
                    title={t('notificationStatusRead')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-40 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                  >
                    <CheckIcon />
                  </button>
                )}
                {notif.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    onClick={() => handleArchive(notif.id)}
                    disabled={actionLoading === notif.id + '_archive'}
                    title={t('notificationArchive')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <ArchiveIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {pagination.total} total
          </p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  page === pagination.page
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
