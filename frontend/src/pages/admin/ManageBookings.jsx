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

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-700 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{value ?? '—'}</p>
    </div>
  );
}

function BookingDetailModal({ booking, onClose, t, locale }) {
  if (!booking) return null;

  const s   = booking.schedule;
  const pay = booking.payment;
  const u   = booking.user;

  const bMeta = bookingStatusMeta(booking.status, t);
  const pMeta = pay ? paymentStatusMeta(pay.status, t) : null;
  const route = s?.route ? `${s.route.origin} → ${s.route.destination}` : '—';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">{booking.reference}</p>
            <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white truncate">{route}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`badge text-xs ${bMeta.className}`}>{bMeta.label}</span>
              {pMeta && <span className={`badge text-xs ${pMeta.className}`}>{pMeta.label}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            aria-label={t('manageBookingsDetailClose')}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard title={t('manageBookingsDetailPassengerSection')}>
              <DetailField label={t('manageBookingsDetailPassenger')} value={u?.name} />
              <DetailField label={t('manageBookingsDetailEmail')} value={u?.email || t('manageBookingsNotAvailable')} />
              <DetailField label={t('manageBookingsDetailPhone')} value={u?.phone || t('manageBookingsNotAvailable')} />
            </SectionCard>

            <SectionCard title={t('manageBookingsDetailTripSection')}>
              <DetailField label={t('manageBookingsDetailRoute')} value={route} />
              <DetailField label={t('manageBookingsDetailCompany')} value={s?.company?.name || t('manageBookingsNotAvailable')} />
              <DetailField label={t('manageBookingsDetailBus')} value={s?.bus ? `${s.bus.plateNumber}${s.bus.model ? ` — ${s.bus.model}` : ''}` : '—'} />
              <DetailField label={t('manageBookingsDetailDriver')} value={s?.driver?.name || t('manageBookingsNotAvailable')} />
              <DetailField label={t('manageBookingsDetailDeparture')} value={formatDateTime(s?.departureTime, locale)} />
              <DetailField label={t('manageBookingsDetailArrival')} value={formatDateTime(s?.arrivalTime, locale)} />
            </SectionCard>

            <SectionCard title={t('manageBookingsDetailBookingSection')}>
              <DetailField label={t('manageBookingsDetailReference')} value={booking.reference} />
              <DetailField label={t('manageBookingsDetailSeats')} value={booking.seatsBooked} />
              <DetailField label={t('manageBookingsDetailAmount')} value={formatPrice(booking.totalAmount)} />
              <DetailField label={t('manageBookingsDetailStatus')} value={<span className={`badge text-xs ${bMeta.className}`}>{bMeta.label}</span>} />
              <DetailField label={t('manageBookingsDetailCreated')} value={formatDateTime(booking.createdAt, locale)} />
              <DetailField label={t('manageBookingsDetailBoardedAt')} value={booking.boardedAt ? formatDateTime(booking.boardedAt, locale) : t('manageBookingsNotAvailable')} />
            </SectionCard>

            <SectionCard title={t('manageBookingsDetailPaymentSection')}>
              <DetailField label={t('manageBookingsDetailPaymentStatus')} value={pMeta ? <span className={`badge text-xs ${pMeta.className}`}>{pMeta.label}</span> : t('manageBookingsNotAvailable')} />
              <DetailField label={t('manageBookingsDetailPaymentMethod')} value={pay?.method || t('manageBookingsNotAvailable')} />
              <DetailField label={t('manageBookingsDetailPaidAt')} value={pay?.paidAt ? formatDateTime(pay.paidAt, locale) : t('manageBookingsNotAvailable')} />
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 pb-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <button className="btn-secondary" onClick={onClose}>
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
      key: 'actions',
      label: '',
      render: (_v, row) => (
        <button
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 dark:hover:text-brand-400 transition-colors"
          onClick={() => setSelectedBooking(row)}
          title={t('manageBookingsViewDetail')}
          aria-label={t('manageBookingsViewBookingDetails')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
               className="w-5 h-5">
            <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
            <circle cx="10" cy="10" r="2.5"/>
          </svg>
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
