import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from '../../components/common/Pagination.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import {
  LOCALE_BY_LANGUAGE,
  SCHEDULE_STATUSES,
  formatDateTime,
  formatMoney,
  requestError,
  routeLabel,
  scheduleStatusMeta,
  toLocalDatetimeValue,
} from './companyAdminUtils.js';

function Badge({ meta }) {
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M12 3a9 9 0 110 18A9 9 0 0112 3z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function ScheduleModal({ open, schedule, routes, buses, drivers, onClose, onSaved, t }) {
  const isEdit = Boolean(schedule);
  const [form, setForm] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureTime: '',
    arrivalTime: '',
    seatsTotal: '',
    status: 'SCHEDULED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      routeId: schedule?.routeId ? String(schedule.routeId) : '',
      busId: schedule?.busId ? String(schedule.busId) : '',
      driverId: schedule?.driverId ? String(schedule.driverId) : '',
      departureTime: toLocalDatetimeValue(schedule?.departureTime),
      arrivalTime: toLocalDatetimeValue(schedule?.arrivalTime),
      seatsTotal: schedule?.seatsTotal ? String(schedule.seatsTotal) : '',
      status: schedule?.status || 'SCHEDULED',
    });
    setSaving(false);
    setError('');
  }, [open, schedule]);

  if (!open) return null;

  const selectedRoute = routes.find((route) => String(route.id) === form.routeId);
  const locked = isEdit && (schedule?._count?.bookings || 0) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.routeId || !form.busId || !form.driverId || !form.departureTime || !form.arrivalTime || !form.seatsTotal) {
      setError(t('companyAdminFormRequired'));
      return;
    }
    if (new Date(form.departureTime) >= new Date(form.arrivalTime)) {
      setError(t('manageSchedulesTimeOrder'));
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      routeId: Number(form.routeId),
      busId: Number(form.busId),
      driverId: Number(form.driverId),
      departureTime: new Date(form.departureTime).toISOString(),
      arrivalTime: new Date(form.arrivalTime).toISOString(),
      seatsTotal: Number(form.seatsTotal),
      status: form.status,
    };

    if (locked) {
      delete payload.routeId;
      delete payload.departureTime;
      delete payload.arrivalTime;
      delete payload.seatsTotal;
    }

    try {
      const { data: res } = isEdit
        ? await api.patch(`/company-admin/schedules/${schedule.id}`, payload)
        : await api.post('/company-admin/schedules', payload);
      onSaved(res.data);
    } catch (err) {
      setError(requestError(err, isEdit ? t('manageSchedulesUpdateError') : t('manageSchedulesCreateError')));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="card my-4 w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEdit ? t('manageSchedulesEditTitle') : t('manageSchedulesCreateTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t('companyAdminScheduleFareHint')}</p>
          </div>
          <button
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
            onClick={onClose}
            disabled={saving}
            aria-label={t('cancel')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {locked && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">{t('manageSchedulesLockedHint')}</div>}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">{t('manageSchedulesRoute')}</label>
                <select className="input" value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} disabled={saving || locked}>
                  <option value="">{t('manageSchedulesSelectRoute')}</option>
                  {routes.map((route) => (
                    <option key={route.id} value={String(route.id)}>
                      {routeLabel(route)} — {formatMoney(route.officialFareRwf)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('manageSchedulesBus')}</label>
                <select className="input" value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })} disabled={saving}>
                  <option value="">{t('manageSchedulesSelectBus')}</option>
                  {buses.map((bus) => <option key={bus.id} value={String(bus.id)}>{bus.plateNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('manageSchedulesDriver')}</label>
                <select className="input" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} disabled={saving}>
                  <option value="">{t('manageSchedulesSelectDriver')}</option>
                  {drivers.map((driver) => <option key={driver.id} value={String(driver.id)}>{driver.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('manageSchedulesDeparture')}</label>
                <input className="input" type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} disabled={saving || locked} />
              </div>
              <div>
                <label className="label">{t('manageSchedulesArrival')}</label>
                <input className="input" type="datetime-local" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} disabled={saving || locked} />
              </div>
              <div>
                <label className="label">{t('manageSchedulesSeatsTotal')}</label>
                <input className="input" type="number" min="1" max="200" value={form.seatsTotal} onChange={(e) => setForm({ ...form, seatsTotal: e.target.value })} disabled={saving || locked} />
              </div>
              <div>
                <label className="label">{t('manageSchedulesPrice')}</label>
                <input className="input" value={selectedRoute ? formatMoney(selectedRoute.officialFareRwf) : t('companyAdminSelectRouteForFare')} disabled />
              </div>
              {isEdit && (
                <div className="md:col-span-2">
                  <label className="label">{t('manageSchedulesStatus')}</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={saving}>
                    {SCHEDULE_STATUSES.map((item) => <option key={item} value={item}>{scheduleStatusMeta(item, t).label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>{t('cancel')}</button>
          <button type="submit" form="schedule-form" className="btn-primary" disabled={saving}>{saving ? t('manageSchedulesSaving') : t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function RowMenu({ row, onEdit, onCancel, t }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('manageUsersColActions')}
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 card shadow-lg py-1" role="menu">
          <button
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
            onClick={() => { setOpen(false); onEdit(row); }}
            role="menuitem"
          >
            <PencilIcon />
            {t('companyAdminEditAction')}
          </button>
          {row.status !== 'CANCELLED' && (
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={() => { setOpen(false); onCancel(row); }}
              role="menuitem"
            >
              <XCircleIcon />
              {t('cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompanyAdminSchedules() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchReference = useCallback(async () => {
    try {
      const [routesRes, busesRes, driversRes] = await Promise.all([
        api.get('/company-admin/schedules/options/routes'),
        api.get('/company-admin/schedules/options/buses'),
        api.get('/company-admin/schedules/options/drivers'),
      ]);
      setRoutes(routesRes.data?.data || []);
      setBuses(busesRes.data?.data || []);
      setDrivers(driversRes.data?.data || []);
    } catch {
      setRoutes([]);
      setBuses([]);
      setDrivers([]);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (status) params.set('status', status);
    try {
      const { data: res } = await api.get(`/company-admin/schedules?${params.toString()}`);
      setSchedules(res.data?.schedules || []);
    } catch (err) {
      setError(requestError(err, t('manageSchedulesLoadError')));
    } finally {
      setLoading(false);
    }
  }, [status, t]);

  useEffect(() => { fetchReference(); }, [fetchReference]);
  useEffect(() => { setPage(1); fetchSchedules(); }, [fetchSchedules]);

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    setNotice(t('companyAdminSaved'));
    fetchSchedules();
  };

  const totalPages = useMemo(() => Math.ceil(schedules.length / PAGE_SIZE), [schedules.length]);
  const pagedSchedules = useMemo(
    () => schedules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [schedules, page],
  );

  const handleCancel = async (schedule) => {
    try {
      await api.patch(`/company-admin/schedules/${schedule.id}/cancel`);
      setNotice(t('manageSchedulesCancelSuccess'));
      fetchSchedules();
    } catch (err) {
      setError(requestError(err, t('manageSchedulesCancelError')));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminSchedulesTitle')}</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminSchedulesSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>{t('manageSchedulesCreateButton')}</button>
      </div>

      {notice && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="card p-5">
        <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('manageSchedulesAllStatuses')}</option>
          {SCHEDULE_STATUSES.map((item) => <option key={item} value={item}>{scheduleStatusMeta(item, t).label}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />)}
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
              <svg className="h-10 w-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">{t('manageSchedulesEmpty')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesColRoute')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesBus')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesDriver')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesColDeparture')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesColPrice')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesColSeats')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageSchedulesColStatus')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{t('manageUsersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {pagedSchedules.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {routeLabel(row.route)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {row.bus?.plateNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {row.driver?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(row.departureTime, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {formatMoney(row.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {row.seatsAvailable}/{row.seatsTotal}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge meta={scheduleStatusMeta(row.status, t)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu
                        row={row}
                        onEdit={(r) => { setEditing(r); setModalOpen(true); }}
                        onCancel={handleCancel}
                        t={t}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && schedules.length > 0 && (
          <div className="px-5 pb-5">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )}
      </div>

      <ScheduleModal
        open={modalOpen}
        schedule={editing}
        routes={routes}
        buses={buses}
        drivers={drivers}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        t={t}
      />
    </div>
  );
}
