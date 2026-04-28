import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import { formatDate, requestError } from './companyAdminUtils.js';

function StatBox({ label, value }) {
  return (
    <div className="card p-4 flex flex-col items-center text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />)}
      </div>
      <div className="card p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />)}
      </div>
    </div>
  );
}

export default function CompanyAdminProfile() {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw' : 'en-RW';
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/company-admin/profile')
      .then(({ data: res }) => {
        if (!cancelled) setCompany(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(requestError(err, t('companyAdminLoadError')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminProfileTitle')}</h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminProfileSubtitle')}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          {/* Identity card */}
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{company?.name || '—'}</h2>
                <p className="font-mono text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {t('companyAdminLicenseNo')}: {company?.licenseNo || t('profileNotSet')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {company?.isActive ? (
                  <span className="badge badge-success text-xs">{t('manageUsersActive')}</span>
                ) : (
                  <span className="badge badge-error text-xs">{t('manageUsersInactive')}</span>
                )}
                {company?.isVerifiedOperator && (
                  <span className="badge badge-brand text-xs">✓ {t('companyAdminVerifiedBadge')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">{t('companyAdminStatsOverview')}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label={t('sidebarBuses')}     value={company?._count?.buses} />
              <StatBox label={t('sidebarDrivers')}   value={company?._count?.drivers} />
              <StatBox label={t('sidebarOperators')} value={company?._count?.operators} />
              <StatBox label={t('sidebarSchedules')} value={company?._count?.schedules} />
            </div>
          </div>

          {/* Company info */}
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-4">{t('companyAdminCompanyInfo')}</p>
            <InfoRow label={t('companyAdminDataSource')}    value={company?.dataSource || t('profileNotSet')} />
            <InfoRow label={t('companyAdminVerifiedStatus')} value={company?.isVerifiedOperator ? t('confirm') : t('companyAdminNotVerified')} />
            <InfoRow label={t('companyAdminCreatedAt')}     value={formatDate(company?.createdAt, locale)} />
          </div>
        </>
      )}
    </div>
  );
}
