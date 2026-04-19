import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const LOCALE_BY_LANGUAGE = { en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw' };

function formatTime(isoString, locale) {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDate(isoString, locale) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StatusBadge({ status, t }) {
  const variants = {
    CONFIRMED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    PENDING:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    COMPLETED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  const labelMap = {
    CONFIRMED: t('bookingStatusConfirmed'),
    PENDING:   t('bookingStatusPending'),
    CANCELLED: t('bookingStatusCancelled'),
    COMPLETED: t('bookingStatusCompleted'),
  };
  const cls = variants[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {labelMap[status] || status}
    </span>
  );
}

function BookingCard({ booking, onRefresh }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const sch   = booking.schedule;
  const route = sch?.route;

  const [actionLoading, setActionLoading] = useState(null);
  const [actionError,   setActionError]   = useState(null);

  const isPending = booking.status === 'PENDING';
  const payFailed = booking.payment?.status === 'FAILED';

  async function handleRetryPayment() {
    setActionError(null);
    setActionLoading('pay');
    try {
      const res = await bookingService.payBooking({ bookingId: booking.id, method: 'simulated' });
      navigate('/passenger/booking-confirm', {
        state: { booking: res.data.booking, payment: res.data.payment },
      });
    } catch (err) {
      setActionError(err?.response?.data?.message || t('myBookingsErrorPay'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    setActionError(null);
    setActionLoading('cancel');
    try {
      await bookingService.cancelBooking(booking.id);
      onRefresh();
    } catch (err) {
      setActionError(err?.response?.data?.message || t('myBookingsErrorCancel'));
    } finally {
      setActionLoading(null);
    }
  }

  const seatsLabel = booking.seatsBooked > 1 ? t('myBookingsSeats') : t('myBookingsSeat');

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{t('myBookingsRef')}</p>
          <p className="font-bold tracking-widest text-brand-700 dark:text-brand-300 text-sm">
            {booking.reference}
          </p>
        </div>
        <StatusBadge status={booking.status} t={t} />
      </div>

      {sch && route && (
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center min-w-[60px]">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatTime(sch.departureTime, locale)}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{route.origin}</p>
          </div>
          <div className="flex-1 h-px bg-[#e8e3ff] dark:bg-[#2d1a5e] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />
          </div>
          <div className="text-center min-w-[60px]">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatTime(sch.arrivalTime, locale)}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{route.destination}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>{sch ? formatDate(sch.departureTime, locale) : formatDate(booking.createdAt, locale)}</span>
        <span>{booking.seatsBooked} {seatsLabel} · RWF {parseFloat(booking.totalAmount).toLocaleString()}</span>
      </div>

      {payFailed && (
        <div className="mt-3 pt-3 border-t border-[#f0ebff] dark:border-[#2d1a5e] text-xs text-red-600 dark:text-red-400">
          {t('myBookingsPayFailed')}
        </div>
      )}

      {actionError && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

      {isPending && (
        <div className="mt-4 pt-3 border-t border-[#f0ebff] dark:border-[#2d1a5e] flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={!!actionLoading}
            className="btn-gradient text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            {actionLoading === 'pay' && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {actionLoading === 'pay'
              ? t('myBookingsProcessing')
              : (payFailed ? t('myBookingsRetryPay') : t('myBookingsPayNow'))}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={!!actionLoading}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {actionLoading === 'cancel' && (
              <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            )}
            {actionLoading === 'cancel' ? t('myBookingsCancelling') : t('myBookingsCancelBooking')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingService.getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch(() => setError(t('myBookingsError')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const now      = new Date();
  const upcoming = bookings.filter((b) => {
    const dep = b.schedule?.departureTime ? new Date(b.schedule.departureTime) : null;
    return (b.status === 'CONFIRMED' || b.status === 'PENDING') && dep && dep >= now;
  });
  const past = bookings.filter((b) => {
    const dep = b.schedule?.departureTime ? new Date(b.schedule.departureTime) : null;
    return b.status === 'COMPLETED' || (dep && dep < now);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-400">{t('myBookingsLoading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-gray-500 dark:text-slate-400 mb-4">{error}</p>
        <button type="button" onClick={load} className="btn-secondary">{t('myBookingsRetry')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('myBookingsTitle')}</h1>
        <Link to="/" className="btn-gradient text-sm px-4 py-2">{t('myBookingsBookTrip')}</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('myBookingsEmpty')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{t('myBookingsEmptyHint')}</p>
          <Link to="/" className="btn-gradient">{t('myBookingsSearchTrips')}</Link>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              {t('myBookingsUpcoming', { n: upcoming.length })}
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm py-4">{t('myBookingsNoUpcoming')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} onRefresh={load} />)}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {t('myBookingsPast', { n: past.length })}
              </h2>
              <div className="flex flex-col gap-3">
                {past.map((b) => <BookingCard key={b.id} booking={b} onRefresh={load} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
