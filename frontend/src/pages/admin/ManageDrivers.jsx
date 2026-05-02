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

const RWANDA_PHONE_RE = /^07(2|3|8|9)\d{7}$/;

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

function getDriverMutationError(err, fallback, t) {
  const raw = getRequestError(err, fallback);

  const knownErrors = {
    'Company not found': t('manageDriversCompanyNotFound'),
    'Driver not found': t('manageDriversDriverNotFound'),
    'License number is already in use': t('manageDriversLicenseTaken'),
    'Cannot change company for a driver that already has schedules': t('manageDriversCompanyLocked'),
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

function DriverFormModal({ open, driver, companies, onClose, onSaved, t }) {
  const isEdit = Boolean(driver);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    licenseNo: '',
    companyId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setForm({
      name: driver?.name || '',
      phone: driver?.phone || '',
      licenseNo: driver?.licenseNo || '',
      companyId: driver?.companyId ? String(driver.companyId) : '',
    });
    setSaving(false);
    setError('');
  }, [open, driver]);

  if (!open) return null;

  const companyLocked = isEdit && (driver?._count?.schedules || 0) > 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();
    const cleanLicenseNo = form.licenseNo.trim();

    if (!cleanName) {
      setError(t('manageDriversNameRequired'));
      return;
    }

    if (cleanLicenseNo.length < 3) {
      setError(t('manageDriversLicenseRequired'));
      return;
    }

    if (cleanPhone && !RWANDA_PHONE_RE.test(cleanPhone)) {
      setError(t('manageDriversInvalidPhone'));
      return;
    }

    if (!form.companyId) {
      setError(t('manageDriversCompanyRequired'));
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: cleanName,
      phone: cleanPhone,
      licenseNo: cleanLicenseNo,
      companyId: Number(form.companyId),
    };

    if (companyLocked) {
      delete payload.companyId;
    }

    try {
      const { data: res } = isEdit
        ? await api.patch(`/drivers/${driver.id}`, payload)
        : await api.post('/drivers', payload);

      onSaved(res.data, isEdit ? 'update' : 'create');
    } catch (err) {
      setError(getDriverMutationError(
        err,
        isEdit ? t('manageDriversUpdateError') : t('manageDriversCreateError'),
        t,
      ));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t('manageDriversEditTitle') : t('manageDriversCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {isEdit ? t('manageDriversEditSubtitle') : t('manageDriversCreateSubtitle')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{t('manageDriversName')}</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('profilePhoneLabel')}</label>
              <input
                className="input"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageDriversLicenseNumber')}</label>
              <input
                className="input"
                name="licenseNo"
                value={form.licenseNo}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">{t('manageUsersColCompany')}</label>
              <select
                className="input"
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                disabled={saving || companyLocked}
              >
                <option value="">{t('manageUsersSelectCompany')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={String(company.id)}>
                    {company.name}
                  </option>
                ))}
              </select>
              {companyLocked && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {t('manageDriversCompanyLockedHint')}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('profilePhoneHint')}
          </p>

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
                ? (saving ? t('manageDriversSaving') : t('manageDriversEditSubmit'))
                : (saving ? t('manageDriversCreating') : t('manageDriversCreateSubmit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DriverActionsCell({ driver, onEdit, onMutated, t }) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStatusToggle = async () => {
    setStatusSaving(true);
    setError('');

    try {
      await api.patch(`/drivers/${driver.id}/status`, { isActive: !driver.isActive });
      onMutated(driver.isActive ? t('manageDriversDeactivated') : t('manageDriversActivated'));
    } catch (err) {
      setError(getDriverMutationError(err, t('manageDriversStatusError'), t));
      setStatusSaving(false);
      return;
    }

    setStatusSaving(false);
  };

  return (
    <div className="w-full min-w-0 space-y-2 whitespace-normal sm:min-w-[10rem]">
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-secondary w-full text-xs sm:w-auto"
          onClick={() => {
            setError('');
            onEdit(driver);
          }}
          disabled={statusSaving}
        >
          {t('edit')}
        </button>
        <button
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:w-auto ${
            driver.isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
          }`}
          onClick={handleStatusToggle}
          disabled={statusSaving}
        >
          {statusSaving
            ? t('manageUsersUpdatingStatus')
            : driver.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ManageDrivers() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data: res } = await api.get('/drivers/companies');
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchDrivers = useCallback(async (searchValue, companyValue, statusValue, pageValue) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(pageValue),
      limit: '20',
    });

    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (companyValue) params.set('companyId', companyValue);
    if (statusValue) params.set('status', statusValue);

    try {
      const { data: res } = await api.get(`/drivers?${params.toString()}`);
      setDrivers(res.data?.drivers || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setDrivers([]);
      setError(getRequestError(err, t('manageDriversLoadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDrivers(search, companyFilter, statusFilter, page);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [search, companyFilter, statusFilter, page, fetchDrivers]);

  const refreshDrivers = useCallback(() => {
    fetchDrivers(search, companyFilter, statusFilter, page);
  }, [fetchDrivers, search, companyFilter, statusFilter, page]);

  const handleSaved = useCallback((_driver, action) => {
    setFormOpen(false);
    setEditingDriver(null);

    if (action === 'create') {
      setNotice({ type: 'success', message: t('manageDriversCreateSuccess') });
      setPage(1);
      fetchDrivers(search, companyFilter, statusFilter, 1);
      return;
    }

    setNotice({ type: 'success', message: t('manageDriversUpdateSuccess') });
    refreshDrivers();
  }, [companyFilter, fetchDrivers, refreshDrivers, search, statusFilter, t]);

  const handleMutated = useCallback((message) => {
    setNotice({ type: 'success', message });
    refreshDrivers();
  }, [refreshDrivers]);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: t('manageDriversName'),
      render: (value) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[10rem]">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: t('manageUsersColPhone'),
      render: (value) => value || t('profileNotSet'),
    },
    {
      key: 'licenseNo',
      label: t('manageDriversLicenseNumber'),
    },
    {
      key: 'company',
      label: t('manageUsersColCompany'),
      render: (_value, row) => (
        <span className="whitespace-normal">
          {row.company?.name || t('profileNotSet')}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('manageUsersColStatus'),
      render: (value) => <StatusBadge isActive={value} t={t} />,
    },
    {
      key: 'createdAt',
      label: t('manageDriversColCreated'),
      render: (value) => formatDate(value, locale),
    },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_value, row) => (
        <DriverActionsCell
          driver={row}
          onEdit={(selectedDriver) => {
            setEditingDriver(selectedDriver);
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageDriversTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageDriversSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingDriver(null);
            setFormOpen(true);
          }}
        >
          {t('manageDriversCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            className="input text-sm"
            placeholder={t('manageDriversSearch')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="input text-sm"
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('manageDriversAllCompanies')}</option>
            {companies.map((company) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('manageDriversAllStatuses')}</option>
            <option value="active">{t('manageUsersActive')}</option>
            <option value="inactive">{t('manageUsersInactive')}</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshDrivers}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardTable
            columns={columns}
            rows={drivers}
            loading={loading}
            empty={loading ? t('manageDriversLoading') : t('manageDriversEmpty')}
            maxRows={drivers.length || 1}
          />

          {!loading && drivers.length === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              {t('manageDriversEmptyHint')}
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

      <DriverFormModal
        open={formOpen}
        driver={editingDriver}
        companies={companies}
        onClose={() => {
          setFormOpen(false);
          setEditingDriver(null);
        }}
        onSaved={handleSaved}
        t={t}
      />
    </div>
  );
}
