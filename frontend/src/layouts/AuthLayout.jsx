import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import api from '../services/api.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function AuthLayout() {
  const { t } = useLanguage();
  const [panelData, setPanelData] = useState(null);
  const [panelLoading, setPanelLoading] = useState(true);
  const [panelError, setPanelError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setPanelLoading(true);
    setPanelError(false);

    api.get('/settings/auth-panel')
      .then(({ data: res }) => {
        if (!cancelled) {
          setPanelData(res.data || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPanelData(null);
          setPanelError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPanelLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const supportContact = panelData
    ? [panelData.supportPhone, panelData.supportEmail].filter(Boolean).join(' · ')
    : '';

  const stats = panelData
    ? [
        { value: panelData.activeRouteCount, label: t('authPanelStatRoutes') },
        { value: panelData.departuresTodayCount, label: t('authPanelStatDepartures') },
        { value: panelData.activeCompanyCount, label: t('authPanelStatCompanies') },
      ]
    : [];

  const title = panelLoading
    ? t('authPanelLoadingTagline')
    : panelError || !panelData
      ? t('authPanelFallbackTagline')
      : t('authPanelTagline');

  const subtitle = panelLoading
    ? t('authPanelLoadingSubtitle')
    : panelError || !panelData
      ? t('authPanelFallbackSubtitle')
      : t('authPanelSubtitle');

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#071524]">
      {/* Left brand panel — hidden on small screens */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #071524 0%, #112040 50%, #071524 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-600 opacity-20 blur-3xl" aria-hidden />
        <div className="absolute bottom-10 -left-20 w-64 h-64 rounded-full bg-brand-400 opacity-10 blur-3xl" aria-hidden />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Rugendo Rwanda" className="h-8 w-auto object-contain brightness-0 invert" />
            <span
              className="text-xl font-extrabold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)' }}
            >
              Rugendo Rwanda
            </span>
          </Link>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            {t('authPanelEyebrow')}
          </span>
          <p className="mt-5 mb-4 text-3xl font-bold leading-snug">
            {title}
          </p>
          <p className="max-w-lg text-base leading-relaxed text-slate-300">
            {subtitle}
          </p>
          {panelLoading ? (
            <div className="mt-8 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="h-7 w-14 rounded bg-white/10 animate-pulse" />
                  <div className="mt-3 h-4 w-full rounded bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          ) : stats.length > 0 ? (
            <div className="mt-8 grid grid-cols-3 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-snug text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {!panelLoading && !panelError && supportContact && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">{t('authPanelSupportTitle')}</p>
              <p className="mt-1 text-sm text-slate-300">{t('authPanelSupportSubtitle')}</p>
              <p className="mt-3 break-words text-sm font-medium text-brand-200">{supportContact}</p>
            </div>
          )}

          {!panelLoading && (panelError || !panelData) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-slate-300">{t('authPanelFallbackNote')}</p>
            </div>
          )}
        </div>

        <p className="relative text-xs text-slate-500">{t('authPanelCopyright')}</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <img src="/logo.png" alt="Rugendo Rwanda" className="h-8 w-auto object-contain" />
            <span
              className="text-2xl font-extrabold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
            >
              Rugendo Rwanda
            </span>
          </Link>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('authMobileSubtitle')}</p>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
