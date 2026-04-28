import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW',
  rw: 'rw-RW',
  fr: 'fr-FR',
  sw: 'sw',
};

const BOOKING_STATUSES  = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAYMENT_STATUSES  = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

function formatDateTime(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return `RWF ${Number(value).toLocaleString()}`;
}

function bookingStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':   return { label: t('bookingStatusPending'),   className: 'badge-warning' };
    case 'CONFIRMED': return { label: t('bookingStatusConfirmed'), className: 'badge-success' };
    case 'CANCELLED': return { label: t('bookingStatusCancelled'), className: 'badge-error' };
    case 'COMPLETED': return { label: t('bookingStatusCompleted'), className: 'badge-brand' };
    default:          return { label: status || '—',               className: 'badge-brand' };
  }
}

function paymentStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':  return { label: t('paymentStatusPending'),  className: 'badge-warning' };
    case 'PAID':     return { label: t('paymentStatusPaid'),     className: 'badge-success' };
    case 'FAILED':   return { label: t('paymentStatusFailed'),   className: 'badge-error' };
    case 'REFUNDED': return { label: t('paymentStatusRefunded'), className: 'badge-brand' };
    default:         return { label: '—',                        className: 'badge-brand' };
  }
}

function StatusBadge({ status, metaFn, t }) {
  const meta = metaFn(status, t);
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-slate-400 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white break-all">{value ?? '—'}</span>
    </div>
  );
}

function BookingDetailModal({ booking, onClose, t, locale }) {
  if (!booking) return null;

  const s   = booking.schedule;
  const pay = booking.payment;
  const u   = booking.user;

  const bMeta  = bookingStatusMeta(booking.status, t);
  const pMeta  = pay ? paymentStatusMeta(pay.status, t) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-lg p-6 my-4 space-y-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('manageBookingsDetailTitle')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none"
            aria-label={t('manageBookingsDetailClose')}
          >
            ×
          </button>
        </div>

        <div className="space-y-0">
          <DetailRow label={t('manageBookingsDetailReference')} value={booking.reference} />
          <DetailRow label={t('manageBookingsDetailPassenger')} value={u?.name} />
          <DetailRow label={t('manageBookingsDetailEmail')}     value={u?.email || t('manageBookingsNotAvailable')} />
          <DetailRow label={t('manageBookingsDetailPhone')}     value={u?.phone || t('manageBookingsNotAvailable')} />
          <DetailRow
            label={t('manageBookingsDetailRoute')}
            value={s?.route ? `${s.route.origin} → ${s.route.destination}` : '—'}
          />
          <DetailRow label={t('manageBookingsDetailCompany')}  value={s?.company?.name} />
          <DetailRow
            label={t('manageBookingsDetailBus')}
            value={s?.bus ? `${s.bus.plateNumber}${s.bus.model ? ` — ${s.bus.model}` : ''}` : '—'}
          />
          <DetailRow label={t('manageBookingsDetailDriver')}    value={s?.driver?.name || t('manageBookingsNotAvailable')} />
          <DetailRow label={t('manageBookingsDetailDeparture')} value={formatDateTime(s?.departureTime, locale)} />
          <DetailRow label={t('manageBookingsDetailArrival')}   value={formatDateTime(s?.arrivalTime, locale)} />
          <DetailRow label={t('manageBookingsDetailSeats')}     value={booking.seatsBooked} />
          <DetailRow label={t('manageBookingsDetailAmount')}    value={formatPrice(booking.totalAmount)} />
          <DetailRow
            label={t('manageBookingsDetailStatus')}
            value={<span className={`badge text-xs ${bMeta.className}`}>{bMeta.label}</span>}
          />
          <DetailRow
            label={t('manageBookingsDetailPaymentStatus')}
            value={pMeta
              ? <span className={`badge text-xs ${pMeta.className}`}>{pMeta.label}</span>
              : t('manageBookingsNotAvailable')}
          />
          <DetailRow label={t('manageBookingsDetailPaymentMethod')} value={pay?.method || t('manageBookingsNotAvailable')} />
          <DetailRow label={t('manageBookingsDetailPaidAt')}   value={pay?.paidAt ? formatDateTime(pay.paidAt, locale) : t('manageBookingsNotAvailable')} />
          <DetailRow label={t('manageBookingsDetailCreated')}  value={formatDateTime(booking.createdAt, locale)} />
          <DetailRow label={t('manageBookingsDetailBoardedAt')} value={booking.boardedAt ? formatDateTime(booking.boardedAt, locale) : t('manageBookingsNotAvailable')} />
        </div>

        <div className="pt-4">
          <button className="btn-secondary w-full" onClick={onClose}>
            {t('manageBookingsDetailClose')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ManageBookings() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  // filters
  const [statusFilter,        setStatusFilter]        = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFilter,          setDateFilter]          = useState('');

  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter)        params.set('status',        statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
      if (dateFilter)          params.set('date',          dateFilter);

      const { data: res } = await api.get(`/bookings?${params.toString()}`);
      const payload = res.data;
      setBookings(payload.bookings   ?? []);
      setTotal(payload.total         ?? 0);
      setTotalPages(payload.totalPages ?? 1);
    } catch (err) {
      console.error('ManageBookings fetch error:', err?.response?.data || err);
      setError(t('manageBookingsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, dateFilter, t]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const columns = useMemo(() => [
    {
      key: 'reference',
      label: t('manageBookingsColReference'),
      render: (v) => <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{v}</span>,
    },
    {
      key: 'passenger',
      label: t('manageBookingsColPassenger'),
      render: (_v, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">{row.user?.name || '—'}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{row.user?.email || row.user?.phone || ''}</div>
        </div>
      ),
    },
    {
      key: 'route',
      label: t('manageBookingsColRoute'),
      render: (_v, row) => {
        const r = row.schedule?.route;
        return r ? (
          <span className="text-sm">{r.origin} → {r.destination}</span>
        ) : '—';
      },
    },
    {
      key: 'departure',
      label: t('manageBookingsColDeparture'),
      render: (_v, row) => (
        <span className="text-sm">
          {formatDateTime(row.schedule?.departureTime, locale)}
        </span>
      ),
    },
    {
      key: 'seatsBooked',
      label: t('manageBookingsColSeats'),
      render: (v) => <span className="text-sm">{v}</span>,
    },
    {
      key: 'totalAmount',
      label: t('manageBookingsColAmount'),
      render: (v) => <span className="text-sm">{formatPrice(v)}</span>,
    },
    {
      key: 'status',
      label: t('manageBookingsColStatus'),
      render: (v) => <StatusBadge status={v} metaFn={bookingStatusMeta} t={t} />,
    },
    {
      key: 'payment',
      label: t('manageBookingsColPayment'),
      render: (_v, row) => row.payment
        ? <StatusBadge status={row.payment.status} metaFn={paymentStatusMeta} t={t} />
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'createdAt',
      label: t('manageBookingsColCreated'),
      render: (v) => <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatDate(v, locale)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <button
          className="btn-secondary w-full px-2 py-1 text-xs sm:w-auto"
          onClick={() => setSelectedBooking(row)}
        >
          {t('manageBookingsViewDetail')}
        </button>
      ),
    },
  ], [locale, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manageBookingsTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('manageBookingsSubtitle')}</p>
        {!loading && !error && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {total} {total === 1 ? 'booking' : 'bookings'}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('manageBookingsAllStatuses')}</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{bookingStatusMeta(s, t).label}</option>
            ))}
          </select>

          <select
            className="input text-sm"
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('manageBookingsAllPaymentStatuses')}</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{paymentStatusMeta(s, t).label}</option>
            ))}
          </select>

          <input
            type="date"
            className="input text-sm"
            value={dateFilter}
            placeholder={t('manageBookingsDatePlaceholder')}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <div className="flex justify-center">
            <button className="btn-primary text-sm" onClick={fetchBookings}>
              {t('retry')}
            </button>
          </div>
        </div>
      ) : (
        <DashboardTable
          columns={columns}
          rows={bookings}
          loading={loading}
          empty={loading ? t('manageBookingsLoading') : t('manageBookingsEmpty')}
          maxRows={bookings.length || 1}
        />
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-center text-gray-500 dark:text-slate-400">
          {t('manageBookingsEmptyHint')}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('manageUsersPrev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {t('manageUsersPageOf').replace('{page}', page).replace('{total}', totalPages)}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('manageUsersNext')}
          </button>
        </div>
      )}

      {/* Detail modal */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        t={t}
        locale={locale}
      />
    </div>
  );
}
