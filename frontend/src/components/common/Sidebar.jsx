import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  ),
  bookings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M2.5 17c0-3.314 3.358-6 7.5-6s7.5 2.686 7.5 6" />
    </svg>
  ),
  schedules: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  ),
  buses: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="16" height="10" rx="2" />
      <path d="M2 9h16" />
      <circle cx="5.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M6 5V3M14 5V3" />
    </svg>
  ),
  drivers: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3 17.5c0-3 3.134-5.5 7-5.5s7 2.5 7 5.5" />
      <path d="M14 9.5l2.5 2.5" />
    </svg>
  ),
  routes: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4" cy="5" r="2" />
      <circle cx="16" cy="15" r="2" />
      <path d="M4 7c0 5 12 3 12 8" />
    </svg>
  ),
  companies: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="10" height="11" rx="1" />
      <path d="M12 10h4a1 1 0 0 1 1 1v7H12V10z" />
      <path d="M5 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      <path d="M5 11h4M5 14h4" />
    </svg>
  ),
  operators: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="6" r="3" />
      <path d="M2 17c0-3 2.686-5 6-5s6 2 6 5" />
      <path d="M14 8l2 2 3-3" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="6" r="3" />
      <circle cx="13.5" cy="5" r="2.2" />
      <path d="M1 17c0-3 2.9-5.5 6.5-5.5S14 14 14 17" />
      <path d="M13.5 12c2.2 0 4 1.8 4 4.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  ),
  adminPanel: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="16" height="13" rx="1.5" />
      <path d="M6 8h8M6 11h5" />
      <path d="M2 7h16" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
      <polyline points="11 14 15 10 11 6" />
      <line x1="15" y1="10" x2="5" y2="10" />
    </svg>
  ),
  boarding: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4" />
      <path d="M12 3l5 5-6 6-3-3" />
      <path d="M16 3h1v1" />
    </svg>
  ),
};

const NAV_LINK_KEYS = {
  passenger: [
    { to: '/passenger',          key: 'sidebarDashboard',        icon: 'dashboard', end: true },
    { to: '/passenger/book',     key: 'sidebarBookABus',          icon: 'book' },
    { to: '/passenger/bookings', key: 'sidebarMyBookings',        icon: 'bookings' },
    { to: '/passenger/profile',  key: 'profile',                  icon: 'profile' },
  ],
  admin: [
    { to: '/admin',           key: 'sidebarDashboard',   icon: 'dashboard', end: true },
    { to: '/admin/schedules', key: 'sidebarSchedules',   icon: 'schedules' },
    { to: '/admin/buses',     key: 'sidebarBuses',       icon: 'buses' },
    { to: '/admin/drivers',   key: 'sidebarDrivers',     icon: 'drivers' },
    { to: '/admin/routes',    key: 'sidebarRoutes',      icon: 'routes' },
    { to: '/admin/bookings',  key: 'sidebarBookings',    icon: 'bookings' },
    { to: '/admin/profile',   key: 'profile',            icon: 'profile' },
  ],
  super_admin: [
    { to: '/super-admin',             key: 'sidebarDashboard',        icon: 'dashboard', end: true },
    { to: '/super-admin/companies',   key: 'sidebarCompanies',        icon: 'companies' },
    { to: '/super-admin/operators',   key: 'sidebarOperators',        icon: 'operators' },
    { to: '/super-admin/users',       key: 'sidebarUsers',            icon: 'users' },
    { to: '/super-admin/settings',    key: 'sidebarPlatformSettings', icon: 'settings' },
    { to: '/admin',                   key: 'sidebarAdminPanel',       icon: 'adminPanel' },
    { to: '/super-admin/profile',     key: 'profile',                 icon: 'profile' },
  ],
  operator: [
    { to: '/operator',          key: 'sidebarDashboard',          icon: 'dashboard', end: true },
    { to: '/operator/boarding', key: 'sidebarBoardingValidation', icon: 'boarding' },
    { to: '/operator/bookings', key: 'sidebarCompanyBookings',    icon: 'bookings' },
    { to: '/operator/profile',  key: 'profile',                   icon: 'profile' },
  ],
};

export default function Sidebar({ role, isMobileOpen = false, onClose = () => {} }) {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const links = NAV_LINK_KEYS[role] || [];
  const roleName = role.replace('_', '-');
  const handleLinkClick = () => onClose();
  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 max-w-[85vw] transform flex-col border-r border-gray-100 bg-white transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-800 ${
        isMobileOpen
          ? 'visible translate-x-0 shadow-2xl'
          : 'pointer-events-none invisible -translate-x-full'
      } md:pointer-events-auto md:visible md:static md:min-h-screen md:translate-x-0 md:shadow-none`}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-slate-700">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/70"
        >
          <img src="/logo.png" alt="Rugendo Rwanda" className="h-7 w-7 shrink-0 rounded object-contain" />
          <div className="min-w-0 py-1">
            <span className="block truncate text-sm font-bold leading-none text-brand-600">Rugendo Rwanda</span>
            <p className="mt-0.5 text-xs capitalize text-gray-400">{roleName} {t('sidebarPanel')}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg text-gray-600 transition-colors hover:bg-brand-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 md:hidden"
          aria-label={t('sidebarCloseMenu')}
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`
            }
          >
            <span className="h-4 w-4 shrink-0">{ICONS[link.icon]}</span>
            {t(link.key)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-slate-700">
        <button
          onClick={handleLogout}
          aria-label={t('logout')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <span className="h-4 w-4 shrink-0">{ICONS.logout}</span>
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
