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

const BUS_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

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

function getBusMutationError(err, fallback, t) {
  const raw = getRequestError(err, fallback);

  const knownErrors = {
    'Company not found': t('manageBusesCompanyNotFound'),
    'Plate number is already in use': t('manageBusesPlateTaken'),
    'Bus not found': t('manageBusesBusNotFound'),
    'Cannot change company for a bus that already has schedules': t('manageBusesCompanyLocked'),
    'Capacity cannot be lower than seats already configured on existing schedules': t('manageBusesCapacityConflict'),
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

function getBusStatusMeta(status, t) {
  switch (status) {
    case 'ACTIVE':
      return { label: t('manageBusesStatusActive'), className: 'badge-success' };
    case 'INACTIVE':
      return { label: t('manageBusesStatusInactive'), className: 'badge-error' };
    case 'MAINTENANCE':
      return { label: t('manageBusesStatusMaintenance'), className: 'badge-warning' };
    default:
      return { label: status || '—', className: 'badge-brand' };
  }
}

function StatusBadge({ status, t }) {
  const meta = getBusStatusMeta(status, t);
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

function BusFormModal({ open, bus, companies, onClose, onSaved, t }) {
  const isEdit = Boolean(bus);
  const [form, setForm] = useState({
    plateNumber: '',
    model: '',
    capacity: '',
    companyId: '',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setForm({
      plateNumber: bus?.plateNumber || '',
      model: bus?.model || '',
      capacity: bus?.capacity ? String(bus.capacity) : '',
      companyId: bus?.companyId ? String(bus.companyId) : '',
      status: bus?.status || 'ACTIVE',
    });
    setSaving(false);
    setError('');
  }, [open, bus]);

  if (!open) return null;

  const companyLocked = isEdit && (bus?._count?.schedules || 0) > 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPlateNumber = form.plateNumber.trim();
    const cleanModel = form.model.trim();
    const capacity = Number(form.capacity);

    if (cleanPlateNumber.length < 3) {
      setError(t('manageBusesPlateRequired'));
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
      setError(t('manageBusesCapacityInvalid'));
      return;
    }

    if (!form.companyId) {
      setError(t('manageBusesCompanyRequired'));
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      plateNumber: cleanPlateNumber,
      model: cleanModel,
      capacity,
      status: form.status,
      companyId: Number(form.companyId),
    };

    if (companyLocked) {
      delete payload.companyId;
    }

    try {
      const { data: res } = isEdit
        ? await api.patch(`/buses/${bus.id}`, payload)
        : await api.post('/buses', payload);

      onSaved(res.data, isEdit ? 'update' : 'create');
    } catch (err) {
      setError(getBusMutationError(
        err,
        isEdit ? t('manageBusesUpdateError') : t('manageBusesCreateError'),
        t,
      ));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t('manageBusesEditTitle') : t('manageBusesCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {isEdit ? t('manageBusesEditSubtitle') : t('manageBusesCreateSubtitle')}
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
            <div>
              <label className="label">{t('manageBusesPlateNumber')}</label>
              <input
                className="input"
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageBusesModel')}</label>
              <input
                className="input"
                name="model"
                value={form.model}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageBusesCapacity')}</label>
              <input
                className="input"
                name="capacity"
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageUsersColStatus')}</label>
              <select
                className="input"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                {BUS_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getBusStatusMeta(status, t).label}
                  </option>
                ))}
              </select>
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
                  {t('manageBusesCompanyLockedHint')}
                </p>
              )}
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
                ? (saving ? t('manageBusesSaving') : t('manageBusesEditSubmit'))
                : (saving ? t('manageBusesCreating') : t('manageBusesCreateSubmit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BusActionsCell({ bus, onEdit, onMutated, t }) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStatusToggle = async () => {
    const nextStatus = bus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setStatusSaving(true);
    setError('');

    try {
      await api.patch(`/buses/${bus.id}/status`, { status: nextStatus });
      onMutated(nextStatus === 'ACTIVE' ? t('manageBusesActivated') : t('manageBusesDeactivated'));
    } catch (err) {
      setError(getBusMutationError(err, t('manageBusesStatusError'), t));
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
            onEdit(bus);
          }}
          disabled={statusSaving}
        >
          {t('edit')}
        </button>
        <button
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:w-auto ${
            bus.status === 'ACTIVE'
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
          }`}
          onClick={handleStatusToggle}
          disabled={statusSaving}
        >
          {statusSaving
            ? t('manageUsersUpdatingStatus')
            : bus.status === 'ACTIVE' ? t('manageUsersDeactivate') : t('manageUsersActivate')}
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

export default function ManageBuses() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [buses, setBuses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data: res } = await api.get('/buses/companies');
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchBuses = useCallback(async (searchValue, companyValue, statusValue, pageValue) => {
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
      const { data: res } = await api.get(`/buses?${params.toString()}`);
      setBuses(res.data?.buses || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setBuses([]);
      setError(getRequestError(err, t('manageBusesLoadError')));
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
      fetchBuses(search, companyFilter, statusFilter, page);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [search, companyFilter, statusFilter, page, fetchBuses]);

  const refreshBuses = useCallback(() => {
    fetchBuses(search, companyFilter, statusFilter, page);
  }, [fetchBuses, search, companyFilter, statusFilter, page]);

  const handleSaved = useCallback((_bus, action) => {
    setFormOpen(false);
    setEditingBus(null);

    if (action === 'create') {
      setNotice({ type: 'success', message: t('manageBusesCreateSuccess') });
      setPage(1);
      fetchBuses(search, companyFilter, statusFilter, 1);
      return;
    }

    setNotice({ type: 'success', message: t('manageBusesUpdateSuccess') });
    refreshBuses();
  }, [companyFilter, fetchBuses, refreshBuses, search, statusFilter, t]);

  const handleMutated = useCallback((message) => {
    setNotice({ type: 'success', message });
    refreshBuses();
  }, [refreshBuses]);

  const columns = useMemo(() => [
    {
      key: 'plateNumber',
      label: t('manageBusesPlateNumber'),
      render: (value, row) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[10rem]">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          {row.model && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {row.model}
            </p>
          )}
        </div>
      ),
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
      key: 'capacity',
      label: t('manageBusesCapacity'),
    },
    {
      key: 'status',
      label: t('manageUsersColStatus'),
      render: (value) => <StatusBadge status={value} t={t} />,
    },
    {
      key: 'createdAt',
      label: t('manageBusesColCreated'),
      render: (value) => formatDate(value, locale),
    },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_value, row) => (
        <BusActionsCell
          bus={row}
          onEdit={(selectedBus) => {
            setEditingBus(selectedBus);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageBusesTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageBusesSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingBus(null);
            setFormOpen(true);
          }}
        >
          {t('manageBusesCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            className="input text-sm"
            placeholder={t('manageBusesSearch')}
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
            <option value="">{t('manageBusesAllCompanies')}</option>
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
            <option value="">{t('manageBusesAllStatuses')}</option>
            {BUS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getBusStatusMeta(status, t).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshBuses}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardTable
            columns={columns}
            rows={buses}
            loading={loading}
            empty={loading ? t('manageBusesLoading') : t('manageBusesEmpty')}
            maxRows={buses.length || 1}
          />

          {!loading && buses.length === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              {t('manageBusesEmptyHint')}
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

      <BusFormModal
        open={formOpen}
        bus={editingBus}
        companies={companies}
        onClose={() => {
          setFormOpen(false);
          setEditingBus(null);
        }}
        onSaved={handleSaved}
        t={t}
      />
    </div>
  );
}
