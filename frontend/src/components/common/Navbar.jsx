import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

const NAV_LINK_KEYS = [
  { to: '/',             key: 'navHome',        end: true },
  { to: '/search-trips', key: 'navSearchTrips' },
  { to: '/routes',       key: 'navRoutes' },
  { to: '/how-it-works', key: 'navHowItWorks' },
];

const ROLE_DASHBOARD = {
  passenger:     '/passenger',
  admin:         '/admin',
  super_admin:   '/super-admin',
  operator:      '/operator',
  company_admin: '/company-admin',
};

const ROLE_PROFILE = {
  passenger:     '/passenger/profile',
  admin:         '/admin/profile',
  super_admin:   '/super-admin/profile',
  operator:      '/operator/profile',
  company_admin: '/company-admin/profile',
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, SUPPORTED_LANGUAGES, t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen]     = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef                    = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'text-brand-600 dark:text-brand-400 font-semibold'
      : 'text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors';

  const handleLogout = async () => {
    setAvatarOpen(false);
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] || '/') : '/';
  const profilePath   = user ? (ROLE_PROFILE[user.role]   || '/profile') : '/profile';

  return (
    <header className="bg-white dark:bg-[#071524] border-b border-[#dbeafe] dark:border-[#1e3a5f] sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Rugendo Rwanda logo" className="h-12 md:h-14 w-auto object-contain" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINK_KEYS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
              {t(l.key)}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="hidden sm:block text-xs bg-transparent border border-[#dbeafe] dark:border-[#1e3a5f] rounded-lg px-2 py-1.5 text-gray-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#f0f7ff] dark:bg-[#112040] text-gray-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Notification bell — logged-in users only */}
          {user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {/* Auth controls */}
          {user ? (
            <div className="hidden sm:block relative" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen((prev) => !prev)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="User menu"
                aria-expanded={avatarOpen}
              >
                {getInitials(user.name)}
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#112040] border border-[#dbeafe] dark:border-[#1e3a5f] rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#dbeafe] dark:border-[#1e3a5f]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  <Link
                    to={profilePath}
                    onClick={() => setAvatarOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-[#f0f7ff] dark:hover:bg-[#1e3a5f] transition-colors"
                  >
                    {t('profile')}
                  </Link>
                  <Link
                    to={dashboardPath}
                    onClick={() => setAvatarOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-[#f0f7ff] dark:hover:bg-[#1e3a5f] transition-colors"
                  >
                    {t('navDashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">{t('navSignIn')}</Link>
              <Link to="/register" className="btn-primary text-sm py-2">{t('register')}</Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#f0f7ff] dark:bg-[#112040] text-gray-600 dark:text-slate-300"
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-[#071524] border-t border-[#dbeafe] dark:border-[#1e3a5f] px-4 pb-4 pt-2 space-y-1">
          {/* Mobile language selector */}
          <div className="pb-2">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="text-xs bg-transparent border border-[#dbeafe] dark:border-[#1e3a5f] rounded-lg px-2 py-1.5 text-gray-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {NAV_LINK_KEYS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-[#f0f7ff] dark:hover:bg-[#112040]'
                }`
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[#dbeafe] dark:border-[#1e3a5f] flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-700 dark:text-slate-200 font-semibold">{user.name}</div>
                <div className="px-3 py-1">
                  <NotificationBell />
                </div>
                <Link
                  to={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary text-sm text-center"
                >
                  {t('profile')}
                </Link>
                <Link
                  to={dashboardPath}
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary text-sm text-center"
                >
                  {t('navDashboard')}
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-red-600">
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">{t('navSignIn')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-gradient text-sm text-center">{t('register')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
