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

function getRouteMutationError(err, fallback, t) {
  const raw = getRequestError(err, fallback);

  const knownErrors = {
    'Route not found': t('manageRoutesRouteNotFound'),
    'Route already exists': t('manageRoutesDuplicate'),
    'Origin and destination must be different': t('manageRoutesSameEndpoints'),
    'Cannot change origin or destination for a route that already has schedules': t('manageRoutesEndpointsLocked'),
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

function formatRouteMetrics(route, t) {
  const parts = [];

  if (route.distanceKm !== null && route.distanceKm !== undefined) {
    parts.push(`${route.distanceKm} km`);
  }

  if (route.durationMin !== null && route.durationMin !== undefined) {
    parts.push(`${route.durationMin} min`);
  }

  return parts.length > 0 ? parts.join(' • ') : t('manageRoutesNotProvided');
}

function RouteFormModal({ open, route, onClose, onSaved, t }) {
  const isEdit = Boolean(route);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    distanceKm: '',
    durationMin: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setForm({
      origin: route?.origin || '',
      destination: route?.destination || '',
      distanceKm: route?.distanceKm !== null && route?.distanceKm !== undefined ? String(route.distanceKm) : '',
      durationMin: route?.durationMin !== null && route?.durationMin !== undefined ? String(route.durationMin) : '',
      status: route?.isActive === false ? 'inactive' : 'active',
    });
    setSaving(false);
    setError('');
  }, [open, route]);

  if (!open) return null;

  const endpointsLocked = isEdit && (route?._count?.schedules || 0) > 0;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanOrigin = form.origin.trim();
    const cleanDestination = form.destination.trim();
    const sameEndpoints = cleanOrigin.toLowerCase() === cleanDestination.toLowerCase();
    const hasDistance = form.distanceKm.trim() !== '';
    const hasDuration = form.durationMin.trim() !== '';
    const distanceKm = hasDistance ? Number(form.distanceKm) : null;
    const durationMin = hasDuration ? Number(form.durationMin) : null;

    if (!cleanOrigin || cleanOrigin.length < 2) {
      setError(t('manageRoutesOriginRequired'));
      return;
    }

    if (!cleanDestination || cleanDestination.length < 2) {
      setError(t('manageRoutesDestinationRequired'));
      return;
    }

    if (sameEndpoints) {
      setError(t('manageRoutesSameEndpoints'));
      return;
    }

    if (hasDistance && (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 2000)) {
      setError(t('manageRoutesDistanceInvalid'));
      return;
    }

    if (hasDuration && (!Number.isInteger(durationMin) || durationMin <= 0 || durationMin > 2880)) {
      setError(t('manageRoutesDurationInvalid'));
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      origin: cleanOrigin,
      destination: cleanDestination,
      distanceKm,
      durationMin,
      isActive: form.status === 'active',
    };

    if (endpointsLocked) {
      delete payload.origin;
      delete payload.destination;
    }

    try {
      const { data: res } = isEdit
        ? await api.patch(`/routes/${route.id}`, payload)
        : await api.post('/routes', payload);

      onSaved(res.data, isEdit ? 'update' : 'create');
    } catch (err) {
      setError(getRouteMutationError(
        err,
        isEdit ? t('manageRoutesUpdateError') : t('manageRoutesCreateError'),
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
              {isEdit ? t('manageRoutesEditTitle') : t('manageRoutesCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {isEdit ? t('manageRoutesEditSubtitle') : t('manageRoutesCreateSubtitle')}
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
              <label className="label">{t('manageRoutesOrigin')}</label>
              <input
                className="input"
                name="origin"
                value={form.origin}
                onChange={handleChange}
                disabled={saving || endpointsLocked}
              />
            </div>

            <div>
              <label className="label">{t('manageRoutesDestination')}</label>
              <input
                className="input"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                disabled={saving || endpointsLocked}
              />
            </div>

            <div>
              <label className="label">{t('manageRoutesDistanceKm')}</label>
              <input
                className="input"
                name="distanceKm"
                type="number"
                min="1"
                step="0.1"
                value={form.distanceKm}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div>
              <label className="label">{t('manageRoutesDurationMin')}</label>
              <input
                className="input"
                name="durationMin"
                type="number"
                min="1"
                step="1"
                value={form.durationMin}
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

          {endpointsLocked && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('manageRoutesEndpointsLockedHint')}
            </p>
          )}

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
                ? (saving ? t('manageRoutesSaving') : t('manageRoutesEditSubmit'))
                : (saving ? t('manageRoutesCreating') : t('manageRoutesCreateSubmit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RouteActionsCell({ route, onEdit, onMutated, t }) {
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStatusToggle = async () => {
    setStatusSaving(true);
    setError('');

    try {
      await api.patch(`/routes/${route.id}/status`, { isActive: !route.isActive });
      onMutated(route.isActive ? t('manageRoutesDeactivated') : t('manageRoutesActivated'));
    } catch (err) {
      setError(getRouteMutationError(err, t('manageRoutesStatusError'), t));
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
            onEdit(route);
          }}
          disabled={statusSaving}
        >
          {t('edit')}
        </button>
        <button
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:w-auto ${
            route.isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
          }`}
          onClick={handleStatusToggle}
          disabled={statusSaving}
        >
          {statusSaving
            ? t('manageUsersUpdatingStatus')
            : route.isActive ? t('manageUsersDeactivate') : t('manageUsersActivate')}
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

export default function ManageRoutes() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  const fetchRoutes = useCallback(async (searchValue, statusValue, pageValue) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      scope: 'admin',
      page: String(pageValue),
      limit: '20',
    });

    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (statusValue) params.set('status', statusValue);

    try {
      const { data: res } = await api.get(`/routes?${params.toString()}`);
      setRoutes(res.data?.routes || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setRoutes([]);
      setError(getRequestError(err, t('manageRoutesLoadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRoutes(search, statusFilter, page);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [fetchRoutes, page, search, statusFilter]);

  const refreshRoutes = useCallback(() => {
    fetchRoutes(search, statusFilter, page);
  }, [fetchRoutes, page, search, statusFilter]);

  const handleSaved = useCallback((_route, action) => {
    setFormOpen(false);
    setEditingRoute(null);

    if (action === 'create') {
      setNotice({ type: 'success', message: t('manageRoutesCreateSuccess') });
      setPage(1);
      fetchRoutes(search, statusFilter, 1);
      return;
    }

    setNotice({ type: 'success', message: t('manageRoutesUpdateSuccess') });
    refreshRoutes();
  }, [fetchRoutes, refreshRoutes, search, statusFilter, t]);

  const handleMutated = useCallback((message) => {
    setNotice({ type: 'success', message });
    refreshRoutes();
  }, [refreshRoutes]);

  const columns = useMemo(() => [
    {
      key: 'origin',
      label: t('manageRoutesOrigin'),
      render: (value) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[9rem]">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
      ),
    },
    {
      key: 'destination',
      label: t('manageRoutesDestination'),
      render: (value) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[9rem]">
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
      ),
    },
    {
      key: 'distanceKm',
      label: t('manageRoutesDistanceDuration'),
      render: (_value, row) => (
        <span className="whitespace-normal">
          {formatRouteMetrics(row, t)}
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
      label: t('manageRoutesColCreated'),
      render: (value) => formatDate(value, locale),
    },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_value, row) => (
        <RouteActionsCell
          route={row}
          onEdit={(selectedRoute) => {
            setEditingRoute(selectedRoute);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageRoutesTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageRoutesSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingRoute(null);
            setFormOpen(true);
          }}
        >
          {t('manageRoutesCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="input text-sm"
            placeholder={t('manageRoutesSearch')}
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
            <option value="">{t('manageRoutesAllStatuses')}</option>
            <option value="active">{t('manageUsersActive')}</option>
            <option value="inactive">{t('manageUsersInactive')}</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshRoutes}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <DashboardTable
            columns={columns}
            rows={routes}
            loading={loading}
            empty={loading ? t('manageRoutesLoading') : t('manageRoutesEmpty')}
            maxRows={routes.length || 1}
          />

          {!loading && routes.length === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              {t('manageRoutesEmptyHint')}
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

      <RouteFormModal
        open={formOpen}
        route={editingRoute}
        onClose={() => {
          setFormOpen(false);
          setEditingRoute(null);
        }}
        onSaved={handleSaved}
        t={t}
      />
    </div>
  );
}
