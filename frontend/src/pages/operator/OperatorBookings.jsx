import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import api from '../../services/api.js';

const LOCALE_BY_LANGUAGE = {
  en: 'en-RW',
  rw: 'rw-RW',
  fr: 'fr-FR',
  sw: 'sw',
};

function formatDateTime(value, locale) {
  if (!value) return null;
  return new Date(value).toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function getBookingStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':   return { label: t('bookingStatusPending'),   className: 'badge-warning' };
    case 'CONFIRMED': return { label: t('bookingStatusConfirmed'), className: 'badge-success' };
    case 'CANCELLED': return { label: t('bookingStatusCancelled'), className: 'badge-error' };
    case 'COMPLETED': return { label: t('boardedStatus'),          className: 'badge-success' };
    default:          return { label: status || t('operatorBookingsNoValue'), className: 'badge-brand' };
  }
}

function getPaymentStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':  return { label: t('paymentStatusPending'),  className: 'badge-warning' };
    case 'PAID':     return { label: t('paymentStatusPaid'),     className: 'badge-success' };
    case 'FAILED':   return { label: t('paymentStatusFailed'),   className: 'badge-error' };
    case 'REFUNDED': return { label: t('paymentStatusRefunded'), className: 'badge-brand' };
    default:         return { label: t('operatorBookingsNoValue'), className: 'badge-brand' };
  }
}

export default function OperatorBookings() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [company,  setCompany]  = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await api.get('/bookings/operator-company');
        setCompany(res.data?.company ?? null);
        setBookings(res.data?.bookings ?? []);
      } catch (err) {
        setError(err?.response?.data?.message || t('operatorBookingsErrorLoad'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('operatorBookingsTitle')}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t('operatorBookingsDescription')}</p>
        </div>
        {company && (
          <div className="shrink-0 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/20">
            <span className="text-xs uppercase tracking-wide text-brand-500 dark:text-brand-400 block">
              {t('operatorBoardingYourCompany')}
            </span>
            <span className="font-semibold text-brand-800 dark:text-brand-300">{company.name}</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('operatorBookingsLoading')}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('operatorBookingsEmpty')}</p>
        </div>
      )}

      {/* Bookings table */}
      {!loading && !error && bookings.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColPassenger')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColReference')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColRoute')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColDeparture')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold text-center">
                  {t('operatorBookingsColSeatsBooked')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold text-center">
                  {t('operatorBookingsColSeatsLeft')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColStatus')}
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">
                  {t('operatorBookingsColPayment')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {bookings.map((b) => {
                const bookingMeta = getBookingStatusMeta(b.status, t);
                const paymentMeta = getPaymentStatusMeta(b.payment?.status, t);
                const route = b.schedule?.route
                  ? `${b.schedule.route.origin} → ${b.schedule.route.destination}`
                  : t('operatorBookingsNoValue');
                const departure = formatDateTime(b.schedule?.departureTime, locale) || t('operatorBookingsNoValue');
                const seatsLeft = b.schedule?.seatsAvailable ?? t('operatorBookingsNoValue');

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {b.user?.name || t('operatorBookingsNoValue')}
                      </p>
                      {b.user?.phone && (
                        <p className="text-xs text-gray-400 dark:text-slate-500">{b.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold tracking-widest text-brand-700 dark:text-brand-300">
                        {b.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{route}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">{departure}</td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-slate-300">{b.seatsBooked}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${
                        typeof seatsLeft === 'number' && seatsLeft === 0
                          ? 'text-red-500'
                          : typeof seatsLeft === 'number' && seatsLeft <= 5
                          ? 'text-amber-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {seatsLeft}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={bookingMeta.className}>{bookingMeta.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={paymentMeta.className}>{paymentMeta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
