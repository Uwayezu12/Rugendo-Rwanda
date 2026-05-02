import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';
import Pagination from '../../components/common/Pagination.jsx';

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

const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
    <circle cx="10" cy="4" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="10" cy="16" r="1.5" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <path d="M11.5 4.5 15.5 8.5" />
    <path d="M4 16l3.5-.8L16 6.7A2.1 2.1 0 0 0 13.3 4L4.8 12.5 4 16z" />
  </svg>
);

const XCircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <circle cx="10" cy="10" r="7" />
    <path d="m7.5 7.5 5 5M12.5 7.5l-5 5" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

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

function DetailItem({ label, value, highlight = false }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
      <div className={`mt-1 text-sm ${highlight ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ScheduleDetailModal({ schedule, onClose, t, locale }) {
  if (!schedule) return null;

  const routeLabel = schedule.route
    ? `${schedule.route.origin} → ${schedule.route.destination}`
    : '—';
  const busLabel = schedule.bus
    ? `${schedule.bus.plateNumber}${schedule.bus.model ? ` — ${schedule.bus.model}` : ''}`
    : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-slate-700 sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-gray-900 dark:text-white">{t('manageSchedulesDetailTitle')}</h2>
              <StatusBadge status={schedule.status} t={t} />
            </div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{routeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label={t('manageBookingsDetailClose')}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-50 px-4 py-4 dark:bg-brand-900/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{t('manageSchedulesDetailDeparture')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(schedule.departureTime, locale)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('manageSchedulesDetailSeats')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{schedule.seatsAvailable}/{schedule.seatsTotal}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('manageSchedulesDetailPrice')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(schedule.price)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <DetailSection title={t('manageSchedulesSectionTripSummary')}>
              <DetailItem label={t('manageSchedulesDetailRoute')} value={routeLabel} highlight />
              <DetailItem label={t('manageSchedulesDetailCompany')} value={schedule.company?.name || t('manageBookingsNotAvailable')} />
              <DetailItem label={t('manageSchedulesDetailStatus')} value={<StatusBadge status={schedule.status} t={t} />} />
              <DetailItem label={t('manageSchedulesDetailBookings')} value={schedule._count?.bookings ?? 0} />
            </DetailSection>

            <DetailSection title={t('manageSchedulesSectionVehicleDriver')}>
              <DetailItem label={t('manageSchedulesDetailBus')} value={busLabel} highlight />
              <DetailItem label={t('manageSchedulesDetailDriver')} value={schedule.driver?.name || t('manageBookingsNotAvailable')} />
            </DetailSection>

            <DetailSection title={t('manageSchedulesSectionSeatPricing')}>
              <DetailItem label={t('manageSchedulesDetailSeatsAvailable')} value={schedule.seatsAvailable} />
              <DetailItem label={t('manageSchedulesDetailSeatsTotal')} value={schedule.seatsTotal} />
              <DetailItem label={t('manageSchedulesDetailPrice')} value={formatPrice(schedule.price)} highlight />
            </DetailSection>

            <DetailSection title={t('manageSchedulesSectionTiming')}>
              <DetailItem label={t('manageSchedulesDetailDeparture')} value={formatDateTime(schedule.departureTime, locale)} />
              <DetailItem label={t('manageSchedulesDetailArrival')} value={formatDateTime(schedule.arrivalTime, locale)} />
            </DetailSection>

            <DetailSection title={t('manageSchedulesSectionMetadata')}>
              <DetailItem label={t('manageBookingsDetailCreated')} value={formatDateTime(schedule.createdAt, locale)} />
              <DetailItem label={t('manageSchedulesDetailUpdated')} value={formatDateTime(schedule.updatedAt, locale)} />
            </DetailSection>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-slate-700 sm:px-6">
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>
            {t('manageBookingsDetailClose')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleActionsCell({ schedule, onView, onEdit, onCancel, t }) {
  const isCancelled = schedule.status === 'CANCELLED';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-brand-400"
        onClick={() => onView(schedule)}
        aria-label={t('manageBookingsViewDetail')}
        title={t('manageBookingsViewDetail')}
      >
        <EyeIcon />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={t('moreActions')}
          title={t('moreActions')}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVerticalIcon />
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800" role="menu">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-700/70"
              onClick={() => { setMenuOpen(false); onEdit(schedule); }}
              role="menuitem"
            >
              <EditIcon />
              {t('edit')}
            </button>
            {!isCancelled && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => { setMenuOpen(false); onCancel(schedule); }}
                role="menuitem"
              >
                <XCircleIcon />
                {t('cancel')}
              </button>
            )}
          </div>
        )}
      </div>
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
  const [viewingSchedule, setViewingSchedule] = useState(null);
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
          onView={setViewingSchedule}
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

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

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

      <ScheduleDetailModal
        schedule={viewingSchedule}
        onClose={() => setViewingSchedule(null)}
        t={t}
        locale={locale}
      />
    </div>
  );
}
