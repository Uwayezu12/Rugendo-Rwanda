import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW',
  rw: 'rw-RW',
  fr: 'fr-FR',
  sw: 'sw',
};

function formatDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRequestError(err, fallback) {
  const fieldErrors = err?.response?.data?.errors;
  const firstFieldError = fieldErrors
    ? Object.values(fieldErrors).flat().find(Boolean)
    : null;

  return firstFieldError || err?.response?.data?.message || fallback;
}

function getCompanyMutationError(err, fallback, t) {
  const raw = getRequestError(err, fallback);

  const knownErrors = {
    'Company not found': t('manageCompaniesCompanyNotFound'),
    'Company name already exists': t('manageCompaniesNameTaken'),
    'Cannot deactivate a company while active schedules exist': t('manageCompaniesActiveSchedulesLocked'),
  };

  return knownErrors[raw] || fallback;
}

function NoticeBanner({ notice }) {
  if (!notice?.message) return null;

  const cls = notice.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300'
    : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-300';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {notice.message}
    </div>
  );
}

function StatusBadge({ isActive, t }) {
  return (
    <span className={`badge text-xs ${isActive ? 'badge-success' : 'badge-error'}`}>
      {isActive ? t('manageUsersActive') : t('manageUsersInactive')}
    </span>
  );
}

/* ─── Eye (view) icon ─── */
const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

/* ─── Company View Modal ─── */
function CompanyViewModal({ company, onClose, t, locale }) {
  if (!company) return null;

  const counts = [
    { label: t('manageCompaniesLinkedOperators'), value: company._count?.operators ?? 0 },
    { label: t('manageCompaniesLinkedBuses'),     value: company._count?.buses ?? 0 },
    { label: t('manageCompaniesLinkedDrivers'),   value: company._count?.drivers ?? 0 },
    { label: t('manageCompaniesLinkedSchedules'), value: company._count?.schedules ?? 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {company.licenseNo || t('manageCompaniesLicenseNotProvided')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge isActive={company.isActive} t={t} />
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              aria-label={t('cancel')}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                <path d="M5 5l10 10M15 5l-10 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-5">
          {/* Key fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('manageCompaniesLicenseNo')}</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{company.licenseNo || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('manageCompaniesColCreated')}</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{formatDate(company.createdAt, locale)}</p>
            </div>
          </div>

          {/* Resource counts */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('manageCompaniesColResources')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {counts.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 px-3 py-3 text-center dark:bg-slate-700/50">
                  <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{value}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active schedules warning */}
          {company.activeScheduleCount > 0 && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true">
                <path d="M10 2L2 17h16L10 2z" />
                <path d="M10 9v4M10 14.5v.5" />
              </svg>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('manageCompaniesActiveSchedulesLockedHint').replace('{count}', company.activeScheduleCount)}
                {' '}{t('manageCompaniesDeactivateBlocked')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-slate-700">
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Company Form Modal ─── */
function CompanyFormModal({ open, company, onClose, onSaved, t }) {
  const isEdit = Boolean(company);
  const [form, setForm] = useState({
    name: '',
    licenseNo: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setForm({
      name: company?.name || '',
      licenseNo: company?.licenseNo || '',
      status: company?.isActive === false ? 'inactive' : 'active',
    });
    setSaving(false);
    setError('');
  }, [open, company]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = form.name.trim();
    const cleanLicense = form.licenseNo.trim();

    if (cleanName.length < 2) {
      setError(t('manageCompaniesNameRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: cleanName,
        licenseNo: cleanLicense,
        isActive: form.status === 'active',
      };

      const { data: res } = isEdit
        ? await api.patch(`/companies/${company.id}`, payload)
        : await api.post('/companies', payload);

      onSaved(res.data, isEdit ? 'update' : 'create');
    } catch (err) {
      setError(getCompanyMutationError(
        err,
        isEdit ? t('manageCompaniesUpdateError') : t('manageCompaniesCreateError'),
        t,
      ));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t('manageCompaniesEditTitle') : t('manageCompaniesCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {isEdit ? t('manageCompaniesEditSubtitle') : t('manageCompaniesCreateSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-sm"
            disabled={saving}
          >
            {t('cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label">{t('manageCompaniesName')}</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageCompaniesLicenseNo')}</label>
              <input
                className="input"
                name="licenseNo"
                value={form.licenseNo}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">{t('manageUsersColStatus')}</label>
              <select
                className="input"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="active">{t('manageUsersActive')}</option>
                <option value="inactive">{t('manageUsersInactive')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {isEdit
                ? (saving ? t('manageCompaniesSaving') : t('manageCompaniesEditSubmit'))
                : (saving ? t('manageCompaniesCreating') : t('manageCompaniesCreateSubmit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Actions cell ─── */
function CompanyActionsCell({ company, onView, onEdit, onMutated, t }) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');
  const cannotDeactivate = company.isActive && company.activeScheduleCount > 0;

  const handleStatusToggle = async () => {
    if (cannotDeactivate) return;

    setStatusSaving(true);
    setError('');

    try {
      await api.patch(`/companies/${company.id}/status`, { isActive: !company.isActive });
      onMutated(company.isActive ? t('manageCompaniesDeactivated') : t('manageCompaniesActivated'));
    } catch (err) {
      setError(getCompanyMutationError(err, t('manageCompaniesStatusError'), t));
      setStatusSaving(false);
      return;
    }

    setStatusSaving(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* View */}
      <button
        className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-brand-400"
        onClick={() => onView(company)}
        aria-label={t('manageCompaniesViewDetails')}
        disabled={statusSaving}
      >
        <EyeIcon />
      </button>

      {/* Edit */}
      <button
        className="btn-secondary text-xs"
        onClick={() => {
          setError('');
          onEdit(company);
        }}
        disabled={statusSaving}
      >
        {t('edit')}
      </button>

      {/* Activate / Deactivate */}
      <button
        className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
          company.isActive
            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
            : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
        } ${cannotDeactivate ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={handleStatusToggle}
        disabled={statusSaving || cannotDeactivate}
        title={cannotDeactivate ? t('manageCompaniesDeactivateBlocked') : undefined}
      >
        {statusSaving
          ? t('manageUsersUpdatingStatus')
          : company.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
      </button>

      {error && (
        <p className="w-full text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function ManageCompanies() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const fetchCompanies = useCallback(async (searchValue, statusValue, pageValue) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(pageValue),
      limit: '20',
    });

    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (statusValue) params.set('status', statusValue);

    try {
      const { data: res } = await api.get(`/companies?${params.toString()}`);
      setCompanies(res.data?.companies || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setCompanies([]);
      setError(getRequestError(err, t('manageCompaniesLoadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCompanies(search, statusFilter, page);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [fetchCompanies, page, search, statusFilter]);

  const refreshCompanies = useCallback(() => {
    fetchCompanies(search, statusFilter, page);
  }, [fetchCompanies, page, search, statusFilter]);

  const handleSaved = useCallback((_company, action) => {
    setFormOpen(false);
    setEditingCompany(null);

    if (action === 'create') {
      setNotice({ type: 'success', message: t('manageCompaniesCreateSuccess') });
      setPage(1);
      fetchCompanies(search, statusFilter, 1);
      return;
    }

    setNotice({ type: 'success', message: t('manageCompaniesUpdateSuccess') });
    refreshCompanies();
  }, [fetchCompanies, refreshCompanies, search, statusFilter, t]);

  const handleMutated = useCallback((message) => {
    setNotice({ type: 'success', message });
    refreshCompanies();
  }, [refreshCompanies]);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: t('manageCompaniesName'),
      render: (value, row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            {row.licenseNo || t('manageCompaniesLicenseNotProvided')}
          </p>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: t('manageUsersColStatus'),
      render: (value) => <StatusBadge isActive={value} t={t} />,
    },
    {
      key: 'createdAt',
      label: t('manageCompaniesColCreated'),
      render: (value) => formatDate(value, locale),
    },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_value, row) => (
        <CompanyActionsCell
          company={row}
          onView={setViewingCompany}
          onEdit={(selectedCompany) => {
            setEditingCompany(selectedCompany);
            setFormOpen(true);
          }}
          onMutated={handleMutated}
          t={t}
        />
      ),
    },
  ], [handleMutated, locale, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageCompaniesTitle')}</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400">{t('manageCompaniesSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingCompany(null);
            setFormOpen(true);
          }}
        >
          {t('manageCompaniesCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="input text-sm"
            placeholder={t('manageCompaniesSearch')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('manageCompaniesAllStatuses')}</option>
            <option value="active">{t('manageUsersActive')}</option>
            <option value="inactive">{t('manageUsersInactive')}</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="card space-y-3 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshCompanies}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardTable
            columns={columns}
            rows={companies}
            loading={loading}
            empty={loading ? t('manageCompaniesLoading') : t('manageCompaniesEmpty')}
            maxRows={companies.length || 1}
          />

          {!loading && companies.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              {t('manageCompaniesEmptyHint')}
            </p>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {t('manageUsersPrev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t('manageUsersPageOf').replace('{page}', page).replace('{total}', totalPages)}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t('manageUsersNext')}
          </button>
        </div>
      )}

      <CompanyViewModal
        company={viewingCompany}
        onClose={() => setViewingCompany(null)}
        t={t}
        locale={locale}
      />

      <CompanyFormModal
        open={formOpen}
        company={editingCompany}
        onClose={() => {
          setFormOpen(false);
          setEditingCompany(null);
        }}
        onSaved={handleSaved}
        t={t}
      />
    </div>
  );
}
