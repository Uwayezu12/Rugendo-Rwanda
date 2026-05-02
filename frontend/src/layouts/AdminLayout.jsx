import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import NotificationBell from '../components/common/NotificationBell.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function AdminLayout() {
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
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity md:hidden"
          aria-label={t('sidebarCloseMenu')}
        />
      )}
      <Sidebar role="admin" isMobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200/70 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          {/* Left: hamburger + branding (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-700 transition-colors hover:bg-brand-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
            aria-label={t('sidebarOpenMenu')}
            aria-expanded={mobileSidebarOpen}
          >
            ☰
          </button>
          <div className="min-w-0 md:hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Rugendo Rwanda</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t('navDashboard')}</p>
          </div>

          {/* Right: notifications + language + theme (always visible) */}
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="text-xs bg-transparent border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-gray-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors text-base"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
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
