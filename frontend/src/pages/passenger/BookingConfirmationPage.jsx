import React from 'react';
import { useLocation, Link } from 'react-router-dom';
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function StatusBadge({ status, t }) {
  const variants = {
    CONFIRMED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    PENDING:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    PAID:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    FAILED:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  const labelMap = {
    CONFIRMED: t('bookingStatusConfirmed'),
    PENDING:   t('bookingStatusPending'),
    CANCELLED: t('bookingStatusCancelled'),
    COMPLETED: t('bookingStatusCompleted'),
    PAID:      t('paymentStatusPaid'),
    FAILED:    t('paymentStatusFailed'),
  };
  const cls = variants[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {labelMap[status] || status}
    </span>
  );
}

export default function BookingConfirmationPage() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const { state } = useLocation();

  if (!state?.booking) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('confirmNoData')}</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{t('confirmNoDataText')}</p>
        <Link to="/passenger/bookings" className="btn-gradient">{t('confirmMyBookings')}</Link>
      </div>
    );
  }

  const { booking, payment } = state;
  const sch     = booking.schedule;
  const route   = sch?.route;
  const company = sch?.company;
  const bus     = sch?.bus;
  const amount  = parseFloat(booking.totalAmount);

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className={`rounded-2xl p-6 mb-6 flex items-start gap-4 ${
        isConfirmed
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className="text-4xl">{isConfirmed ? '✅' : '❌'}</div>
        <div>
          <h1 className={`text-xl font-bold mb-1 ${
            isConfirmed
              ? 'text-green-800 dark:text-green-300'
              : 'text-red-800 dark:text-red-300'
          }`}>
            {isConfirmed ? t('confirmBookedTitle') : t('confirmFailedTitle')}
          </h1>
          <p className={`text-sm ${
            isConfirmed
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          }`}>
            {isConfirmed ? t('confirmBookedSubtitle') : t('confirmFailedSubtitle')}
          </p>
        </div>
      </div>

      {/* Booking reference */}
      <div className="card mb-5 bg-[#f0ebff] dark:bg-[#1a1035] border border-[#c4b5fd] dark:border-[#4c1d95]">
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('confirmRef')}</p>
        <p className="text-2xl font-bold tracking-widest text-brand-700 dark:text-brand-300">
          {booking.reference}
        </p>
      </div>

      {/* Status row */}
      <div className="card mb-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 dark:text-slate-500 mb-1">{t('confirmBookingStatus')}</p>
            <StatusBadge status={booking.status} t={t} />
          </div>
          {payment && (
            <div>
              <p className="text-gray-400 dark:text-slate-500 mb-1">{t('confirmPaymentStatus')}</p>
              <StatusBadge status={payment.status} t={t} />
            </div>
          )}
        </div>
      </div>

      {/* Trip details */}
      {sch && (
        <div className="card mb-5">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-3 uppercase tracking-wide">
            {t('confirmTripDetails')}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatTime(sch.departureTime, locale)}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{route?.origin}</p>
            </div>
            <div className="flex-1 flex items-center">
              <div className="w-full h-px bg-[#e8e3ff] dark:bg-[#2d1a5e] relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatTime(sch.arrivalTime, locale)}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{route?.destination}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('confirmDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(sch.departureTime, locale)}</p>
            </div>
            {company && (
              <div>
                <p className="text-gray-400 dark:text-slate-500">{t('confirmCompany')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('confirmSeatsBooked')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.seatsBooked}</p>
            </div>
            {bus && (
              <div>
                <p className="text-gray-400 dark:text-slate-500">{t('confirmBus')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {bus.model || 'Coach'} · {bus.plateNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="card mb-6 bg-[#f8f7ff] dark:bg-[#1a1035]">
        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
          <span>{t('confirmTotalPaid')}</span>
          <span className={isConfirmed ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'}>
            RWF {amount.toLocaleString()}
          </span>
        </div>
        {payment?.transactionId && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {t('confirmTransactionId')}: {payment.transactionId}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/passenger/bookings" className="btn-gradient text-center">
          {t('confirmViewBookings')}
        </Link>
        <Link to="/" className="btn-secondary text-center">
          {t('confirmSearchMore')}
        </Link>
      </div>
    </div>
  );
}
