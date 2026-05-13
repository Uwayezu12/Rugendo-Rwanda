import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from '../components/common/NotificationBell.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/company-admin', key: 'sidebarDashboard', icon: 'grid', end: true },
  { to: '/company-admin/bookings', key: 'sidebarBookings', icon: 'calendar' },
  { to: '/company-admin/schedules', key: 'sidebarSchedules', icon: 'clock' },
  { to: '/company-admin/buses', key: 'companyAdminSidebarFleet', icon: 'bus' },
  { to: '/company-admin/drivers', key: 'sidebarDrivers', icon: 'user' },
  { to: '/company-admin/operators', key: 'sidebarOperators', icon: 'check' },
  { to: '/company-admin/revenue', key: 'companyAdminSidebarRevenue', icon: 'coin' },
  { to: '/company-admin/profile', key: 'companyAdminSidebarProfile', icon: 'building' },
];

function Icon({ name }) {
  const common = {
    className: 'h-4 w-4',
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  const paths = {
    grid: <><rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" /><rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" /></>,
    calendar: <><rect x="3" y="4" width="14" height="13" rx="1.5" /><path d="M3 8h14M7 2v4M13 2v4" /></>,
    clock: <><circle cx="10" cy="10" r="7.5" /><path d="M10 5.5V10l3 2" /></>,
    bus: <><rect x="2" y="5" width="16" height="10" rx="2" /><path d="M2 9h16" /><circle cx="5.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="14.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" /></>,
    user: <><circle cx="10" cy="6.5" r="3" /><path d="M3 17.5c0-3 3.134-5.5 7-5.5s7 2.5 7 5.5" /></>,
    check: <><circle cx="8" cy="6" r="3" /><path d="M2 17c0-3 2.686-5 6-5s6 2 6 5" /><path d="M14 8l2 2 3-3" /></>,
    coin: <><circle cx="10" cy="10" r="7" /><path d="M10 6v8M7.5 8h3.25a1.75 1.75 0 0 1 0 3.5H9" /></>,
    building: <><rect x="3" y="6" width="10" height="12" rx="1" /><path d="M13 10h4v8h-4M6 9h4M6 12h4M6 15h4M7 6V3h4v3" /></>,
    menu: <><path d="M3 6h14M3 10h14M3 14h14" /></>,
    close: <><path d="M5 5l10 10M15 5L5 15" /></>,
    sun: <><circle cx="10" cy="10" r="3" /><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.9 3.9l1.4 1.4M14.7 14.7l1.4 1.4M16.1 3.9l-1.4 1.4M5.3 14.7l-1.4 1.4" /></>,
    moon: <><path d="M16.5 12.2A6.5 6.5 0 0 1 7.8 3.5 7 7 0 1 0 16.5 12.2Z" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function CompanyAdminNav({ open, onClose }) {
  const { t } = useLanguage();
  const { logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] transform flex-col border-r border-gray-100 bg-white transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-800 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:static md:min-h-screen md:translate-x-0 md:shadow-none`}>
      <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-slate-700">
        <Link to="/" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/70">
          <img src="/logo.png?v=safe-travel-rwanda" alt="Safe Travel Rwanda logo" className="h-7 w-7 shrink-0 rounded object-contain" />
          <div className="min-w-0 py-1">
            <span className="block truncate text-sm font-bold leading-none text-brand-600">Safe Travel Rwanda</span>
            <p className="mt-0.5 text-xs text-gray-400">{t('companyAdminPanel')}</p>
          </div>
        </Link>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-brand-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 md:hidden" aria-label={t('sidebarCloseMenu')}>
          <Icon name="close" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Icon name={link.icon} />
            {t(link.key)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-slate-700">
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
          <Icon name="check" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}

export default function CompanyAdminLayout() {
  const { setTheme, theme, toggleTheme } = useTheme();
  const { t, language, changeLanguage, SUPPORTED_LANGUAGES } = useLanguage();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('rugendo-theme')) {
      setTheme('dark');
    }
  }, [setTheme]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 md:flex">
      {mobileSidebarOpen && (
        <button type="button" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity md:hidden" aria-label={t('sidebarCloseMenu')} />
      )}
      <CompanyAdminNav open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200/70 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <button type="button" onClick={() => setMobileSidebarOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-700 transition-colors hover:bg-brand-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden" aria-label={t('sidebarOpenMenu')} aria-expanded={mobileSidebarOpen}>
            <Icon name="menu" />
          </button>
          <div className="min-w-0 md:hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Safe Travel Rwanda</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t('companyAdminPanel')}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <select value={language} onChange={(e) => changeLanguage(e.target.value)} className="text-xs bg-transparent border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-gray-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer" aria-label={t('languageSelectLabel')}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-base text-gray-600 transition-colors hover:bg-brand-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-brand-950" aria-label={theme === 'dark' ? t('themeSwitchLight') : t('themeSwitchDark')}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </div>
        </div>
        <main className="flex-1 min-w-0 bg-gray-50 p-4 dark:bg-slate-900 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
