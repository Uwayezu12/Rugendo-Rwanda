import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '../../components/common/Pagination.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';
import DashboardTable from '../../components/dashboard/DashboardTable.jsx';
import {
  BOOKING_STATUSES,
  LOCALE_BY_LANGUAGE,
  PAYMENT_STATUSES,
  bookingStatusMeta,
  formatDateTime,
  formatMoney,
  paymentStatusMeta,
  requestError,
  routeLabel,
} from './companyAdminUtils.js';

function Badge({ meta }) {
  return <span className={`badge text-xs ${meta.className}`}>{meta.label}</span>;
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">{children}</p>;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center py-1.5">
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value ?? '—'}</span>
    </div>
  );
}

function BookingDetail({ booking, onClose, onCancel, t, locale }) {
  if (!booking) return null;
  const paymentMeta = paymentStatusMeta(booking.payment?.status, t);
  const bookingMeta = bookingStatusMeta(booking.status, t);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card my-4 w-full max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('manageBookingsDetailTitle')}</h2>
            <p className="font-mono text-sm text-brand-600 dark:text-brand-400 mt-0.5">{booking.reference}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge meta={bookingMeta} />
            <button
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
              onClick={onClose}
              aria-label={t('manageBookingsDetailClose')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Passenger */}
          <div>
            <SectionLabel>{t('manageBookingsDetailPassenger')}</SectionLabel>
            <div className="card p-3 space-y-0.5">
              <InfoRow label={t('manageUsersColName')}  value={booking.user?.name} />
              <InfoRow label={t('profileEmailLabel')}   value={booking.user?.email || t('manageBookingsNotAvailable')} />
              <InfoRow label={t('profilePhoneLabel')}   value={booking.user?.phone || t('manageBookingsNotAvailable')} />
            </div>
          </div>

          {/* Trip */}
          <div>
            <SectionLabel>{t('manageBookingsDetailRoute')}</SectionLabel>
            <div className="card p-3 space-y-0.5">
              <InfoRow label={t('manageBookingsColRoute')}     value={routeLabel(booking.schedule?.route)} />
              <InfoRow label={t('manageBookingsDetailDeparture')} value={formatDateTime(booking.schedule?.departureTime, locale)} />
              <InfoRow label={t('manageBookingsDetailArrival')}   value={formatDateTime(booking.schedule?.arrivalTime, locale)} />
              <InfoRow label={t('manageBookingsDetailSeats')}     value={booking.seatsBooked} />
            </div>
          </div>

          {/* Fleet */}
          {(booking.schedule?.bus || booking.schedule?.driver) && (
            <div>
              <SectionLabel>{t('manageBookingsDetailBus')}</SectionLabel>
              <div className="card p-3 space-y-0.5">
                <InfoRow label={t('manageBookingsDetailBus')}    value={booking.schedule?.bus?.plateNumber} />
                <InfoRow label={t('manageBookingsDetailDriver')} value={booking.schedule?.driver?.name} />
              </div>
            </div>
          )}

          {/* Payment */}
          <div>
            <SectionLabel>{t('manageBookingsDetailPaymentStatus')}</SectionLabel>
            <div className="card p-3 space-y-1.5">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{t('manageBookingsDetailAmount')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-gray-500 dark:text-slate-400">{t('manageBookingsDetailPaymentStatus')}</span>
                <Badge meta={paymentMeta} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700">
          {booking.status === 'PENDING' && (
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => onCancel(booking)}
            >
              {t('companyAdminCancelBooking')}
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>{t('manageBookingsDetailClose')}</button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAdminBookings() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (status) params.set('status', status);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (search.trim()) params.set('search', search.trim());

    try {
      const { data: res } = await api.get(`/company-admin/bookings?${params.toString()}`);
      setBookings(res.data?.bookings || []);
    } catch (err) {
      setError(requestError(err, t('manageBookingsLoadError')));
    } finally {
      setLoading(false);
    }
  }, [paymentStatus, search, status, t]);

  useEffect(() => { setPage(1); fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (booking) => {
    try {
      await api.patch(`/company-admin/bookings/${booking.id}/cancel`);
      setNotice(t('companyAdminBookingCancelled'));
      setSelected(null);
      fetchBookings();
    } catch (err) {
      setError(requestError(err, t('myBookingsErrorCancel')));
    }
  };

  const totalPages = useMemo(() => Math.ceil(bookings.length / PAGE_SIZE), [bookings.length]);
  const pagedBookings = useMemo(
    () => bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [bookings, page],
  );

  const columns = useMemo(() => [
    { key: 'reference', label: t('manageBookingsColReference'), render: (value) => <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{value}</span> },
    { key: 'passenger', label: t('manageBookingsColPassenger'), render: (_v, row) => row.user?.name || '-' },
    { key: 'route', label: t('manageBookingsColRoute'), render: (_v, row) => routeLabel(row.schedule?.route) },
    { key: 'departure', label: t('manageBookingsColDeparture'), render: (_v, row) => formatDateTime(row.schedule?.departureTime, locale) },
    { key: 'amount', label: t('manageBookingsColAmount'), render: (_v, row) => formatMoney(row.totalAmount) },
    { key: 'status', label: t('manageBookingsColStatus'), render: (value) => <Badge meta={bookingStatusMeta(value, t)} /> },
    { key: 'payment', label: t('manageBookingsColPayment'), render: (_v, row) => <Badge meta={paymentStatusMeta(row.payment?.status, t)} /> },
    {
      key: 'actions',
      label: t('manageUsersColActions'),
      render: (_v, row) => (
        <button
          className="inline-flex items-center justify-center p-2 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
          onClick={() => setSelected(row)}
          aria-label={t('companyAdminViewDetails')}
          title={t('companyAdminViewDetails')}
        >
          <EyeIcon />
        </button>
      ),
    },
  ], [locale, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companyAdminBookingsTitle')}</h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">{t('companyAdminBookingsSubtitle')}</p>
      </div>

      {notice && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">{notice}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

      <div className="card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="input text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('companyAdminSearchReference')} />
          <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('manageBookingsAllStatuses')}</option>
            {BOOKING_STATUSES.map((item) => <option key={item} value={item}>{bookingStatusMeta(item, t).label}</option>)}
          </select>
          <select className="input text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">{t('manageBookingsAllPaymentStatuses')}</option>
            {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{paymentStatusMeta(item, t).label}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DashboardTable columns={columns} rows={pagedBookings} loading={loading} empty={t('manageBookingsEmpty')} maxRows={PAGE_SIZE} />
      </div>
      {!loading && bookings.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      )}

      <BookingDetail booking={selected} onClose={() => setSelected(null)} onCancel={handleCancel} t={t} locale={locale} />
    </div>
  );
}
