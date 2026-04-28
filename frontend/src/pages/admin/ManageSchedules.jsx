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

const SCHEDULE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function formatDateTime(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return `RWF ${Number(value).toLocaleString()}`;
}

function getRequestError(err, fallback) {
  const fieldErrors = err?.response?.data?.errors;
  const firstFieldError = fieldErrors
    ? Object.values(fieldErrors).flat().find(Boolean)
    : null;
  return firstFieldError || err?.response?.data?.message || fallback;
}

function getScheduleMutationError(err, fallback) {
  const raw = getRequestError(err, fallback);
  const knownErrors = {
    'Route not found': 'The selected route could not be found.',
    'Bus not found': 'The selected bus could not be found.',
    'Driver not found': 'The selected driver could not be found.',
    'Company not found': 'The selected company could not be found.',
    'Schedule not found': 'Schedule not found.',
    'A schedule for this route, bus, and departure time already exists': 'A schedule already exists for that route, bus, and time.',
    'Cannot cancel this schedule': raw,
    'Cannot change departure time while active bookings exist': 'Departure time is locked — active bookings exist.',
    'Cannot change arrival time while active bookings exist': 'Arrival time is locked — active bookings exist.',
    'Cannot change price while active bookings exist': 'Price is locked — active bookings exist.',
    'Cannot change seat count while active bookings exist': 'Seat count is locked — active bookings exist.',
  };
  return knownErrors[raw] ?? raw ?? fallback;
}

function getStatusMeta(status, t) {
  switch (status) {
    case 'SCHEDULED':   return { label: t('scheduleStatusScheduled'),  className: 'badge-brand' };
    case 'IN_PROGRESS': return { label: t('scheduleStatusInProgress'), className: 'badge-warning' };
    case 'COMPLETED':   return { label: t('scheduleStatusCompleted'),  className: 'badge-success' };
    case 'CANCELLED':   return { label: t('scheduleStatusCancelled'),  className: 'badge-error' };
    default:            return { label: status || '—', className: 'badge-brand' };
  }
}

function StatusBadge({ status, t }) {
  const meta = getStatusMeta(status, t);
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
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

function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleFormModal({ open, schedule, routes, buses, drivers, companies, onClose, onSaved, t }) {
  const isEdit = Boolean(schedule);
  // _count.bookings counts ALL bookings; backend locks fields only for PENDING/CONFIRMED.
  // Show the locked hint conservatively when any bookings exist so admins know to check.
  const hasActiveBookings = isEdit && (schedule?._count?.bookings ?? 0) > 0;

  const emptyForm = {
    routeId: '',
    busId: '',
    driverId: '',
    companyId: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    seatsTotal: '',
    status: 'SCHEDULED',
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && schedule) {
      setForm({
        routeId:       String(schedule.routeId || ''),
        busId:         String(schedule.busId || ''),
        driverId:      String(schedule.driverId || ''),
        companyId:     String(schedule.companyId || ''),
        departureTime: toLocalDatetimeValue(schedule.departureTime),
        arrivalTime:   toLocalDatetimeValue(schedule.arrivalTime),
        price:         schedule.price !== undefined ? String(schedule.price) : '',
        seatsTotal:    schedule.seatsTotal !== undefined ? String(schedule.seatsTotal) : '',
        status:        schedule.status || 'SCHEDULED',
      });
    } else {
      setForm(emptyForm);
    }
    setSaving(false);
    setError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schedule]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.routeId)   { setError(t('manageSchedulesRouteRequired'));   return; }
    if (!form.busId)     { setError(t('manageSchedulesBusRequired'));     return; }
    if (!form.driverId)  { setError(t('manageSchedulesDriverRequired'));  return; }
    if (!form.companyId) { setError(t('manageSchedulesCompanyRequired')); return; }
    if (!form.departureTime) { setError(t('manageSchedulesDepartureRequired')); return; }
    if (!form.arrivalTime)   { setError(t('manageSchedulesArrivalRequired'));   return; }

    const price = Number(form.price);
    const seatsTotal = Number(form.seatsTotal);

    if (!form.price || isNaN(price) || price <= 0) {
      setError(t('manageSchedulesPriceInvalid'));
      return;
    }
    if (!form.seatsTotal || !Number.isInteger(seatsTotal) || seatsTotal < 1) {
      setError(t('manageSchedulesSeatsInvalid'));
      return;
    }
    if (new Date(form.departureTime) >= new Date(form.arrivalTime)) {
      setError(t('manageSchedulesTimeOrder'));
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      routeId:       Number(form.routeId),
      busId:         Number(form.busId),
      driverId:      Number(form.driverId),
      companyId:     Number(form.companyId),
      departureTime: new Date(form.departureTime).toISOString(),
      arrivalTime:   new Date(form.arrivalTime).toISOString(),
      price,
      seatsTotal,
      status:        form.status,
    };

    try {
      const { data: res } = isEdit
        ? await api.patch(`/schedules/${schedule.id}`, payload)
        : await api.post('/schedules', payload);
      onSaved(res.data, isEdit ? 'update' : 'create');
    } catch (err) {
      console.error('ManageSchedules submit error:', err?.response?.data || err);
      setError(getScheduleMutationError(
        err,
        isEdit ? t('manageSchedulesUpdateError') : t('manageSchedulesCreateError'),
      ));
      setSaving(false);
    }
  };

  const lockedFields = isEdit && hasActiveBookings;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl p-6 my-4">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t('manageSchedulesEditTitle') : t('manageSchedulesCreateTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {isEdit ? t('manageSchedulesEditSubtitle') : t('manageSchedulesCreateSubtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm" disabled={saving}>
            {t('cancel')}
          </button>
        </div>

        {lockedFields && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            {t('manageSchedulesLockedHint')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{t('manageSchedulesRoute')}</label>
              <select className="input" name="routeId" value={form.routeId} onChange={handleChange} disabled={saving}>
                <option value="">{t('manageSchedulesSelectRoute')}</option>
                {routes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('manageSchedulesBus')}</label>
              <select className="input" name="busId" value={form.busId} onChange={handleChange} disabled={saving}>
                <option value="">{t('manageSchedulesSelectBus')}</option>
                {buses.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.plateNumber}{b.model ? ` — ${b.model}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('manageSchedulesDriver')}</label>
              <select className="input" name="driverId" value={form.driverId} onChange={handleChange} disabled={saving}>
                <option value="">{t('manageSchedulesSelectDriver')}</option>
                {drivers.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">{t('manageSchedulesCompany')}</label>
              <select className="input" name="companyId" value={form.companyId} onChange={handleChange} disabled={saving}>
                <option value="">{t('manageSchedulesSelectCompany')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t('manageSchedulesDeparture')}</label>
              <input
                className="input"
                type="datetime-local"
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
                disabled={saving || lockedFields}
              />
              {lockedFields && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('manageSchedulesFieldLocked')}</p>
              )}
            </div>

            <div>
              <label className="label">{t('manageSchedulesArrival')}</label>
              <input
                className="input"
                type="datetime-local"
                name="arrivalTime"
                value={form.arrivalTime}
                onChange={handleChange}
                disabled={saving || lockedFields}
              />
              {lockedFields && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('manageSchedulesFieldLocked')}</p>
              )}
            </div>

            <div>
              <label className="label">{t('manageSchedulesPrice')}</label>
              <input
                className="input"
                type="number"
                min="1"
                step="any"
                name="price"
                value={form.price}
                onChange={handleChange}
                disabled={saving || lockedFields}
              />
              {lockedFields && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('manageSchedulesFieldLocked')}</p>
              )}
            </div>

            <div>
              <label className="label">{t('manageSchedulesSeatsTotal')}</label>
              <input
                className="input"
                type="number"
                min="1"
                max="200"
                name="seatsTotal"
                value={form.seatsTotal}
                onChange={handleChange}
                disabled={saving || lockedFields}
              />
              {lockedFields && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('manageSchedulesFieldLocked')}</p>
              )}
            </div>

            {isEdit && (
              <div className="md:col-span-2">
                <label className="label">{t('manageSchedulesStatus')}</label>
                <select className="input" name="status" value={form.status} onChange={handleChange} disabled={saving}>
                  {SCHEDULE_STATUSES.map((s) => (
                    <option key={s} value={s}>{getStatusMeta(s, t).label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {isEdit
                ? (saving ? t('manageSchedulesSaving') : t('manageSchedulesEditSubmit'))
                : (saving ? t('manageSchedulesCreating') : t('manageSchedulesCreateSubmit'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelConfirmModal({ open, schedule, onClose, onCancelled, t }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setCancelling(false); setError(''); }
  }, [open]);

  if (!open || !schedule) return null;

  const handleConfirm = async () => {
    setCancelling(true);
    setError('');
    try {
      await api.delete(`/schedules/${schedule.id}`);
      onCancelled();
    } catch (err) {
      setError(getScheduleMutationError(err, t('manageSchedulesCancelError')));
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('manageSchedulesCancelTitle')}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          {t('manageSchedulesCancelConfirm')}
        </p>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose} disabled={cancelling}>
            {t('cancel')}
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            onClick={handleConfirm}
            disabled={cancelling}
          >
            {cancelling ? t('manageSchedulesCancelling') : t('manageSchedulesCancelSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleActionsCell({ schedule, onEdit, onCancel, t }) {
  const isCancelled = schedule.status === 'CANCELLED';

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2 whitespace-normal sm:min-w-[10rem]">
      <button
        className="btn-secondary w-full text-xs sm:w-auto"
        onClick={() => onEdit(schedule)}
      >
        {t('edit')}
      </button>
      {!isCancelled && (
        <button
          className="w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 sm:w-auto"
          onClick={() => onCancel(schedule)}
        >
          {t('manageSchedulesCancelButton')}
        </button>
      )}
    </div>
  );
}

export default function ManageSchedules() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [notice, setNotice] = useState(null);
  const debounceRef = useRef(null);

  // Load reference data for the form dropdowns
  const fetchRefData = useCallback(async () => {
    try {
      const [routesRes, busesRes, driversRes, companiesRes] = await Promise.all([
        api.get('/routes?scope=public'),
        api.get('/buses?limit=100'),
        api.get('/drivers?limit=100'),
        api.get('/buses/companies'),
      ]);
      setRoutes(routesRes.data?.data || []);
      setBuses(busesRes.data?.data?.buses || []);
      setDrivers(driversRes.data?.data?.drivers || []);
      setCompanies(companiesRes.data?.data || []);
    } catch (err) {
      console.error('ManageSchedules fetchRefData:', err?.response?.data || err.message);
    }
  }, []);

  const fetchSchedules = useCallback(async (routeValue, statusValue, pageValue) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ page: String(pageValue), limit: '20' });
    if (routeValue) params.set('routeId', routeValue);
    if (statusValue) params.set('status', statusValue);

    try {
      const { data: res } = await api.get(`/schedules?${params.toString()}`);
      setSchedules(res.data?.schedules || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setSchedules([]);
      setError(getRequestError(err, t('manageSchedulesLoadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchRefData(); }, [fetchRefData]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSchedules(routeFilter, statusFilter, page);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [routeFilter, statusFilter, page, fetchSchedules]);

  const refreshSchedules = useCallback(() => {
    fetchSchedules(routeFilter, statusFilter, page);
  }, [fetchSchedules, routeFilter, statusFilter, page]);

  const handleSaved = useCallback((_schedule, action) => {
    setFormOpen(false);
    setEditingSchedule(null);
    if (action === 'create') {
      setNotice({ type: 'success', message: t('manageSchedulesCreateSuccess') });
      setPage(1);
      fetchSchedules(routeFilter, statusFilter, 1);
    } else {
      setNotice({ type: 'success', message: t('manageSchedulesUpdateSuccess') });
      refreshSchedules();
    }
  }, [fetchSchedules, refreshSchedules, routeFilter, statusFilter, t]);

  const handleCancelled = useCallback(() => {
    setCancelTarget(null);
    setNotice({ type: 'success', message: t('manageSchedulesCancelSuccess') });
    refreshSchedules();
  }, [refreshSchedules, t]);

  const columns = useMemo(() => [
    {
      key: 'route',
      label: t('manageSchedulesColRoute'),
      render: (_v, row) => (
        <div className="min-w-0 whitespace-normal sm:min-w-[9rem]">
          <p className="font-medium text-gray-900 dark:text-white">
            {row.route?.origin} → {row.route?.destination}
          </p>
        </div>
      ),
    },
    {
      key: 'bus',
      label: t('manageSchedulesColBus'),
      render: (_v, row) => (
        <span className="whitespace-normal text-sm">
          {row.bus?.plateNumber || '—'}
          {row.bus?.model ? <span className="text-gray-400 dark:text-slate-500"> — {row.bus.model}</span> : null}
        </span>
      ),
    },
    {
      key: 'driver',
      label: t('manageSchedulesColDriver'),
      render: (_v, row) => <span>{row.driver?.name || '—'}</span>,
    },
    {
      key: 'departureTime',
      label: t('manageSchedulesColDeparture'),
      render: (v) => <span className="whitespace-nowrap text-sm">{formatDateTime(v, locale)}</span>,
    },
    {
      key: 'arrivalTime',
      label: t('manageSchedulesColArrival'),
      render: (v) => <span className="whitespace-nowrap text-sm">{formatDateTime(v, locale)}</span>,
    },
    {
      key: 'price',
      label: t('manageSchedulesColPrice'),
      render: (v) => <span className="whitespace-nowrap">{formatPrice(v)}</span>,
    },
    {
      key: 'seats',
      label: t('manageSchedulesColSeats'),
      render: (_v, row) => (
        <span className="whitespace-nowrap text-sm">
          {row.seatsAvailable}/{row.seatsTotal}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('manageSchedulesColStatus'),
      render: (v) => <StatusBadge status={v} t={t} />,
    },
    {
      key: 'actions',
      label: t('manageSchedulesColActions'),
      render: (_v, row) => (
        <ScheduleActionsCell
          schedule={row}
          onEdit={(s) => { setEditingSchedule(s); setFormOpen(true); }}
          onCancel={(s) => setCancelTarget(s)}
          t={t}
        />
      ),
    },
  ], [locale, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageSchedulesTitle')}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageSchedulesSubtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditingSchedule(null); setFormOpen(true); }}
        >
          {t('manageSchedulesCreateButton')}
        </button>
      </div>

      <NoticeBanner notice={notice} />

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            className="input text-sm"
            value={routeFilter}
            onChange={(e) => { setRouteFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('manageSchedulesAllRoutes')}</option>
            {routes.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.origin} → {r.destination}
              </option>
            ))}
          </select>

          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('manageSchedulesAllStatuses')}</option>
            {SCHEDULE_STATUSES.map((s) => (
              <option key={s} value={s}>{getStatusMeta(s, t).label}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={refreshSchedules}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <DashboardTable
          columns={columns}
          rows={schedules}
          loading={loading}
          empty={loading ? t('manageSchedulesLoading') : t('manageSchedulesEmpty')}
          maxRows={schedules.length || 1}
        />
      )}

      {!loading && !error && schedules.length === 0 && (
        <p className="text-sm text-center text-gray-500 dark:text-slate-400">
          {t('manageSchedulesEmptyHint')}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button className="btn-secondary text-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('manageUsersPrev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t('manageUsersPageOf').replace('{page}', page).replace('{total}', totalPages)}
          </span>
          <button className="btn-secondary text-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('manageUsersNext')}
          </button>
        </div>
      )}

      <ScheduleFormModal
        open={formOpen}
        schedule={editingSchedule}
        routes={routes}
        buses={buses}
        drivers={drivers}
        companies={companies}
        onClose={() => { setFormOpen(false); setEditingSchedule(null); }}
        onSaved={handleSaved}
        t={t}
      />

      <CancelConfirmModal
        open={Boolean(cancelTarget)}
        schedule={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={handleCancelled}
        t={t}
      />
    </div>
  );
}
