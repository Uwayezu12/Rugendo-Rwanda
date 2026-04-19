import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { boardingService } from '../../services/boardingService.js';

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
    case 'PENDING':   return { label: t('bookingStatusPending'),    className: 'badge-warning' };
    case 'CONFIRMED': return { label: t('bookingStatusConfirmed'),  className: 'badge-success' };
    case 'CANCELLED': return { label: t('bookingStatusCancelled'),  className: 'badge-error' };
    case 'COMPLETED': return { label: t('boardedStatus'),           className: 'badge-success' };
    default:          return { label: status || t('operatorBoardingNoValue'), className: 'badge-brand' };
  }
}

function getPaymentStatusMeta(status, t) {
  switch (status) {
    case 'PENDING':  return { label: t('paymentStatusPending'),  className: 'badge-warning' };
    case 'PAID':     return { label: t('paymentStatusPaid'),     className: 'badge-success' };
    case 'FAILED':   return { label: t('paymentStatusFailed'),   className: 'badge-error' };
    case 'REFUNDED': return { label: t('paymentStatusRefunded'), className: 'badge-brand' };
    default:         return { label: t('operatorBoardingNoValue'), className: 'badge-brand' };
  }
}

function getBoardingHint(booking, t) {
  if (!booking) return null;
  if (booking.status === 'COMPLETED' || booking.boardedAt) return t('operatorBoardingHintAlreadyBoarded');
  if (booking.status === 'CANCELLED') return t('operatorBoardingHintCancelled');
  if (booking.status !== 'CONFIRMED') return t('operatorBoardingHintConfirmedOnly');
  if (booking.payment?.status !== 'PAID') return t('operatorBoardingHintPaidOnly');
  return t('operatorBoardingReadyHint');
}

function canValidateBooking(booking) {
  return Boolean(
    booking
    && booking.status === 'CONFIRMED'
    && booking.payment?.status === 'PAID'
    && !booking.boardedAt
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

function BookingResultCard({ booking, onSelect, t, locale }) {
  const statusMeta  = getBookingStatusMeta(booking.status, t);
  const paymentMeta = getPaymentStatusMeta(booking.payment?.status, t);
  const route = booking.schedule?.route
    ? `${booking.schedule.route.origin} → ${booking.schedule.route.destination}`
    : t('operatorBoardingNoValue');
  const departure = formatDateTime(booking.schedule?.departureTime, locale) || t('operatorBoardingNoValue');
  const company   = booking.schedule?.company?.name || t('operatorBoardingNoValue');

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-base font-bold tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {booking.reference}
        </p>
        <p className="text-sm text-gray-700 dark:text-slate-300">
          {booking.user?.name || t('operatorBoardingNoValue')}
          {booking.user?.phone ? ` · ${booking.user.phone}` : ''}
          {booking.user?.email ? ` · ${booking.user.email}` : ''}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 break-words">{route} · {company} · {departure}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className={statusMeta.className}>{statusMeta.label}</span>
        <span className={paymentMeta.className}>{paymentMeta.label}</span>
        <button
          type="button"
          onClick={() => onSelect(booking)}
          className="btn-gradient w-full text-sm sm:w-auto sm:min-w-[100px]"
        >
          {t('operatorBoardingSelectButton')}
        </button>
      </div>
    </div>
  );
}

export default function BoardingValidation() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';

  const [searchInput,     setSearchInput]     = useState('');
  const [results,         setResults]         = useState(null); // null = not searched yet
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [boardingNote,    setBoardingNote]     = useState('');
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [searchError,     setSearchError]     = useState(null);
  const [validateError,   setValidateError]   = useState(null);
  const [successMessage,  setSuccessMessage]  = useState(null);

  const canValidate  = canValidateBooking(selectedBooking);
  const boardingHint = getBoardingHint(selectedBooking, t);

  const bookingStatusMeta  = getBookingStatusMeta(selectedBooking?.status, t);
  const paymentStatusMeta  = getPaymentStatusMeta(selectedBooking?.payment?.status, t);
  const passengerName      = selectedBooking?.user?.name || t('operatorBoardingNoValue');
  const routeLabel         = selectedBooking?.schedule?.route
    ? `${selectedBooking.schedule.route.origin} → ${selectedBooking.schedule.route.destination}`
    : t('operatorBoardingNoValue');
  const companyName        = selectedBooking?.schedule?.company?.name || t('operatorBoardingNoValue');
  const departureLabel     = formatDateTime(selectedBooking?.schedule?.departureTime, locale) || t('operatorBoardingNoValue');
  const boardedAtLabel     = formatDateTime(selectedBooking?.boardedAt, locale) || t('operatorBoardingNoValue');
  const boardedByLabel     = selectedBooking?.boardedBy?.name || t('operatorBoardingNoValue');

  // Derive operator's own company name from results when available.
  const operatorCompanyName = results?.find((b) => b.schedule?.company?.name)?.schedule?.company?.name;

  async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.trim();
    setSearchError(null);
    setValidateError(null);
    setSuccessMessage(null);

    if (!query) {
      setSearchError(t('operatorBoardingSearchRequired'));
      return;
    }

    setResults(null);
    setSelectedBooking(null);
    setBoardingNote('');
    setSearchLoading(true);
    try {
      const response = await boardingService.searchBookings(query);
      setResults(response.data ?? []);
      // Auto-select if exactly one result.
      if (response.data?.length === 1) {
        setSelectedBooking(response.data[0]);
        setBoardingNote(response.data[0].boardingNote || '');
      }
    } catch (err) {
      setResults([]);
      setSearchError(err?.response?.data?.message || t('operatorBoardingLookupFailed'));
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSelect(booking) {
    setSelectedBooking(booking);
    setBoardingNote(booking.boardingNote || '');
    setValidateError(null);
    setSuccessMessage(null);
  }

  function handleBackToResults() {
    setSelectedBooking(null);
    setBoardingNote('');
    setValidateError(null);
    setSuccessMessage(null);
  }

  async function handleValidate() {
    if (!selectedBooking || !canValidate || validateLoading) return;

    setValidateError(null);
    setSuccessMessage(null);
    setValidateLoading(true);
    try {
      const response = await boardingService.validateBoarding({
        reference: selectedBooking.reference,
        boardingNote,
      });
      const updated = response.data;
      setSelectedBooking(updated);
      setBoardingNote(updated?.boardingNote || '');
      setSuccessMessage(response.message || t('operatorBoardingSuccess'));
      // Refresh the result in the list too.
      if (results) {
        setResults(results.map((b) => b.id === updated.id ? updated : b));
      }
    } catch (err) {
      setValidateError(err?.response?.data?.message || t('operatorBoardingValidateFailed'));
    } finally {
      setValidateLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('operatorBoardingTitle')}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t('operatorBoardingDescription')}</p>
        </div>
        {operatorCompanyName && (
          <div className="shrink-0 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/20">
            <span className="text-xs uppercase tracking-wide text-brand-500 dark:text-brand-400 block">
              {t('operatorBoardingYourCompany')}
            </span>
            <span className="font-semibold text-brand-800 dark:text-brand-300">{operatorCompanyName}</span>
          </div>
        )}
      </div>

      {/* Search form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="boarding-search" className="label">
              {t('operatorBoardingSearchLabel')}
            </label>
            <input
              id="boarding-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('operatorBoardingSearchPlaceholder')}
              className="input"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
              {t('operatorBoardingSearchHelp')}
            </p>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="btn-gradient w-full sm:w-auto sm:min-w-[160px] lg:self-stretch"
          >
            {searchLoading ? t('operatorBoardingLookupLoading') : t('operatorBoardingSearchButton')}
          </button>
        </form>
      </div>

      {/* Errors / success banners */}
      {searchError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {searchError}
        </div>
      )}
      {validateError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {validateError}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Initial empty state */}
      {results === null && !searchLoading && (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('operatorBoardingLookupEmpty')}</p>
        </div>
      )}

      {/* No results */}
      {results !== null && results.length === 0 && !searchLoading && (
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('operatorBoardingNoResults')}</p>
        </div>
      )}

      {/* Multiple results — pick list (shown when >1 result and no booking is selected) */}
      {results !== null && results.length > 1 && !selectedBooking && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {t('operatorBoardingResultsTitle')} ({results.length})
          </h2>
          {results.map((b) => (
            <BookingResultCard
              key={b.id}
              booking={b}
              onSelect={handleSelect}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Detail view for selected (or single auto-selected) booking */}
      {selectedBooking && (
        <div className="card">
          {/* Back link (only if there were multiple results) */}
          {results !== null && results.length > 1 && (
            <button
              type="button"
              onClick={handleBackToResults}
              className="mb-4 text-sm text-brand-600 hover:underline dark:text-brand-400"
            >
              {t('operatorBoardingBackToResults')}
            </button>
          )}

          {/* Reference + status badges */}
          <div className="flex flex-col gap-4 border-b border-[#f0ebff] pb-5 dark:border-[#2d1a5e] lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500 mb-1">
                {t('operatorBoardingReferenceLabel')}
              </p>
              <p className="break-all text-xl font-bold tracking-[0.2em] text-brand-700 dark:text-brand-300 sm:text-2xl sm:tracking-[0.28em]">
                {selectedBooking.reference}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={bookingStatusMeta.className}>{bookingStatusMeta.label}</span>
              <span className={paymentStatusMeta.className}>{paymentStatusMeta.label}</span>
            </div>
          </div>

          {/* Boarding readiness hint */}
          <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            canValidate
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            {boardingHint}
          </div>

          {/* Detail grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label={t('operatorBoardingPassengerLabel')} value={passengerName} />
            <DetailRow label={t('operatorBoardingPassengerPhone')}  value={selectedBooking.user?.phone || t('operatorBoardingNoValue')} />
            <DetailRow label={t('operatorBoardingPassengerEmail')}  value={selectedBooking.user?.email || t('operatorBoardingNoValue')} />
            <DetailRow label={t('operatorBoardingRouteLabel')}      value={routeLabel} />
            <DetailRow label={t('operatorBoardingCompanyLabel')}    value={companyName} />
            <DetailRow label={t('operatorBoardingDepartureLabel')}  value={departureLabel} />
            <DetailRow label={t('operatorBoardingSeatsLabel')}      value={String(selectedBooking.seatsBooked ?? t('operatorBoardingNoValue'))} />
            <DetailRow label={t('operatorBoardingCurrentStatusLabel')} value={bookingStatusMeta.label} />
            <DetailRow label={t('operatorBoardingPaymentStatusLabel')} value={paymentStatusMeta.label} />
            <DetailRow label={t('operatorBoardingBoardedAtLabel')}  value={boardedAtLabel} />
            <DetailRow label={t('operatorBoardingBoardedByLabel')}  value={boardedByLabel} />
          </div>

          {/* Note + validate button */}
          <div className="mt-6">
            <label htmlFor="boarding-note" className="label">
              {t('operatorBoardingNoteLabel')}
            </label>
            <textarea
              id="boarding-note"
              value={boardingNote}
              onChange={(e) => setBoardingNote(e.target.value)}
              placeholder={t('operatorBoardingNotePlaceholder')}
              className="input min-h-[110px] resize-y"
              disabled={!canValidate || validateLoading}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
              {t('operatorBoardingNoteHelp')}
            </p>
          </div>

          <div className="mt-6 flex justify-stretch sm:justify-end">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!canValidate || validateLoading}
              className="btn-gradient w-full sm:w-auto sm:min-w-[220px]"
            >
              {validateLoading ? t('operatorBoardingValidateLoading') : t('operatorBoardingValidateButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
