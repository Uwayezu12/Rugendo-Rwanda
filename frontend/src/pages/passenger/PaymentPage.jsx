import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function PaymentPage() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const { state } = useLocation();
  const navigate  = useNavigate();

  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState(null);

  if (!state?.booking) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('paymentNoBooking')}</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{t('paymentNoBookingText')}</p>
        <Link to="/" className="btn-gradient">{t('paymentSearchTrips')}</Link>
      </div>
    );
  }

  const { booking, schedule } = state;
  const amount = parseFloat(booking.totalAmount);

  async function handlePay(method = 'simulated') {
    setPayError(null);
    setPaying(true);
    try {
      const res = await bookingService.payBooking({ bookingId: booking.id, method });
      navigate('/passenger/booking-confirm', {
        state: { booking: res.data.booking, payment: res.data.payment },
        replace: true,
      });
    } catch (err) {
      setPayError(err?.response?.data?.message || t('paymentError'));
    } finally {
      setPaying(false);
    }
  }

  const sch = booking.schedule || schedule;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('paymentTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('paymentSubtitle')}</p>
      </div>

      {/* Booking reference banner */}
      <div className="card mb-5 bg-[#f0ebff] dark:bg-[#1a1035] border border-[#c4b5fd] dark:border-[#4c1d95]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">{t('paymentBookingRef')}</p>
            <p className="text-xl font-bold tracking-widest text-brand-700 dark:text-brand-300">
              {booking.reference}
            </p>
          </div>
          <span className="badge-brand">{t('bookingStatusPending')}</span>
        </div>
      </div>

      {/* Trip summary */}
      {sch && (
        <div className="card mb-5">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-3 uppercase tracking-wide">
            {t('paymentTripSummary')}
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {formatTime(sch.departureTime, locale)}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {sch.route?.origin}
              </p>
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
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {sch.route?.destination}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('paymentDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(sch.departureTime, locale)}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('paymentCompany')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{sch.company?.name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('paymentSeats')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{booking.seatsBooked}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-slate-500">{t('paymentBus')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {sch.bus?.model || 'Coach'} · {sch.bus?.plateNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amount due */}
      <div className="card mb-6 bg-[#f8f7ff] dark:bg-[#1a1035]">
        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
          <span>{t('paymentAmountDue')}</span>
          <span className="text-brand-600 dark:text-brand-400">RWF {amount.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('paymentSimulated')}</p>
      </div>

      {payError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {payError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handlePay('simulated')}
          disabled={paying}
          className="btn-gradient w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {paying && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {paying ? t('paymentProcessing') : t('paymentPayBtn', { amount: amount.toLocaleString() })}
        </button>

        <button
          type="button"
          onClick={() => handlePay('fail')}
          disabled={paying}
          className="btn-secondary w-full text-sm py-2 opacity-70 hover:opacity-100"
        >
          {t('paymentSimFail')}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={paying}
          className="text-sm text-gray-500 dark:text-slate-400 hover:underline text-center"
        >
          {t('paymentBack')}
        </button>
      </div>
    </div>
  );
}
