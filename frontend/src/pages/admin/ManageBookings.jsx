import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const BOOKING_STATUSES  = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAYMENT_STATUSES  = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

function formatDateTime(value, locale) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return `RWF ${Number(value).toLocaleString()}`;
}

function bookingStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':   return { label: t('bookingStatusPending'),   className: 'badge-warning' };
    case 'CONFIRMED': return { label: t('bookingStatusConfirmed'), className: 'badge-success' };
    case 'CANCELLED': return { label: t('bookingStatusCancelled'), className: 'badge-error' };
    case 'COMPLETED': return { label: t('bookingStatusCompleted'), className: 'badge-brand' };
    default:          return { label: status || '-',               className: 'badge-brand' };
  }
}

function paymentStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':  return { label: t('paymentStatusPending'),  className: 'badge-warning' };
    case 'PAID':     return { label: t('paymentStatusPaid'),     className: 'badge-success' };
    case 'FAILED':   return { label: t('paymentStatusFailed'),   className: 'badge-error' };
    case 'REFUNDED': return { label: t('paymentStatusRefunded'), className: 'badge-brand' };
    default:         return { label: '-',                        className: 'badge-brand' };
  }
}

function StatusBadge({ status, metaFn, t }) {
  const meta = metaFn(status, t);
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

const EyeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

// Detail modal

function DetailCard({ label, value, highlight = false }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
      <div className={`mt-1 text-sm ${highlight ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
        {value ?? '-'}
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

function BookingDetailModal({ booking, onClose, t, locale }) {
  if (!booking) return null;

  const s = booking.schedule;
  const pay = booking.payment;
  const u = booking.user;

  const bMeta = bookingStatusMeta(booking.status, t);
  const pMeta = pay ? paymentStatusMeta(pay.status, t) : null;
  const routeLabel = s?.route ? `${s.route.origin} -> ${s.route.destination}` : '-';
  const busLabel = s?.bus ? `${s.bus.plateNumber}${s.bus.model ? ` - ${s.bus.model}` : ''}` : '-';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-slate-700 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('manageBookingsDetailTitle')}</h2>
            <p className="mt-1 truncate font-mono text-sm text-brand-600 dark:text-brand-400">{booking.reference}</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-brand-50 px-4 py-4 dark:bg-brand-900/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{t('manageBookingsDetailReference')}</p>
              <p className="mt-1 font-mono text-sm font-semibold text-gray-900 dark:text-white">{booking.reference}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('manageBookingsDetailStatus')}</p>
              <p className="mt-2"><span className={`badge text-xs ${bMeta.className}`}>{bMeta.label}</span></p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('manageBookingsDetailPaymentStatus')}</p>
              <p className="mt-2">
                {pMeta ? <span className={`badge text-xs ${pMeta.className}`}>{pMeta.label}</span> : t('manageBookingsNotAvailable')}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-slate-800/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t('manageBookingsDetailAmount')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(booking.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <DetailSection title={t('manageBookingsSectionSummary')}>
              <DetailCard label={t('manageBookingsDetailReference')} value={booking.reference} highlight />
              <DetailCard label={t('manageBookingsDetailStatus')} value={<span className={`badge text-xs ${bMeta.className}`}>{bMeta.label}</span>} />
              <DetailCard label={t('manageBookingsDetailAmount')} value={formatPrice(booking.totalAmount)} />
              <DetailCard label={t('manageBookingsDetailSeats')} value={booking.seatsBooked} />
            </DetailSection>

            <DetailSection title={t('manageBookingsSectionPassenger')}>
              <DetailCard label={t('manageBookingsDetailPassenger')} value={u?.name || t('manageBookingsNotAvailable')} highlight />
              <DetailCard label={t('manageBookingsDetailEmail')} value={u?.email || t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailPhone')} value={u?.phone || t('manageBookingsNotAvailable')} />
            </DetailSection>

            <DetailSection title={t('manageBookingsSectionTrip')}>
              <DetailCard label={t('manageBookingsDetailRoute')} value={routeLabel} highlight />
              <DetailCard label={t('manageBookingsDetailCompany')} value={s?.company?.name || t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailBus')} value={busLabel} />
              <DetailCard label={t('manageBookingsDetailDriver')} value={s?.driver?.name || t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailDeparture')} value={formatDateTime(s?.departureTime, locale)} />
              <DetailCard label={t('manageBookingsDetailArrival')} value={formatDateTime(s?.arrivalTime, locale)} />
            </DetailSection>

            <DetailSection title={t('manageBookingsSectionPayment')}>
              <DetailCard label={t('manageBookingsDetailSeats')} value={booking.seatsBooked} />
              <DetailCard label={t('manageBookingsDetailAmount')} value={formatPrice(booking.totalAmount)} highlight />
              <DetailCard label={t('manageBookingsDetailPaymentStatus')} value={pMeta ? <span className={`badge text-xs ${pMeta.className}`}>{pMeta.label}</span> : t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailPaymentMethod')} value={pay?.method || t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailPaidAt')} value={pay?.paidAt ? formatDateTime(pay.paidAt, locale) : t('manageBookingsNotAvailable')} />
            </DetailSection>

            <DetailSection title={t('manageBookingsSectionTimeline')}>
              <DetailCard label={t('manageBookingsDetailCreated')} value={formatDateTime(booking.createdAt, locale)} />
              <DetailCard label={t('manageBookingsDetailPaidAt')} value={pay?.paidAt ? formatDateTime(pay.paidAt, locale) : t('manageBookingsNotAvailable')} />
              <DetailCard label={t('manageBookingsDetailBoardedAt')} value={booking.boardedAt ? formatDateTime(booking.boardedAt, locale) : t('manageBookingsNotAvailable')} />
            </DetailSection>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-slate-700 sm:px-6">
          <button className="btn-secondary text-sm" onClick={onClose}>
            {t('manageBookingsDetailClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
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
          <div className="font-medium text-gray-900 dark:text-white">{row.user?.name || '-'}</div>
        </div>
      ),
    },
    {
      key: 'route',
      label: t('manageBookingsColRoute'),
      render: (_v, row) => {
        const r = row.schedule?.route;
        return r ? (
          <span className="text-sm">{r.origin} -&gt; {r.destination}</span>
        ) : '-';
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
        : <span className="text-xs text-gray-400">-</span>,
    },
    {
      key: 'actions',
      label: t('manageSchedulesColActions'),
      render: (_v, row) => (
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-brand-400"
          onClick={() => setSelectedBooking(row)}
          aria-label={t('manageBookingsViewDetail')}
          title={t('manageBookingsViewDetail')}
        >
          <EyeIcon />
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
            {t(total === 1 ? 'manageBookingsTotalSingle' : 'manageBookingsTotalMany', { total })}
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

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

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
