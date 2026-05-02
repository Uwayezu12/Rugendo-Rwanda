import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const LOCALE_BY_LANGUAGE = { en: 'en-RW', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw' };

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

function formatDuration(min) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/* ── Search-mode result card ──────────────────────────────────────── */
function ScheduleResultCard({ schedule, onSelect, t, locale }) {
  const isFull = schedule.seatsAvailable === 0;
  const price = parseFloat(schedule.price);
  const departure = formatTime(schedule.departureTime, locale);
  const arrival = formatTime(schedule.arrivalTime, locale);
  const duration = formatDuration(schedule.route?.durationMin);

  const seatsLabel = schedule.seatsAvailable === 1
    ? t('searchResultsSeatsLeft', { n: schedule.seatsAvailable })
    : t('searchResultsSeatsLeftPlural', { n: schedule.seatsAvailable });

  return (
    <div className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${isFull ? 'opacity-60' : ''}`}>
      <div className="sm:w-40 shrink-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{schedule.company?.name}</p>
        {schedule.bus?.model && (
          <span className="badge-brand text-xs mt-0.5 inline-block">{schedule.bus.model}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{departure}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{schedule.route?.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          {duration && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{duration}</p>
          )}
          <div className="w-full h-px bg-[#e8e3ff] dark:bg-[#2d1a5e] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{arrival}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{schedule.route?.destination}</p>
        </div>
      </div>

      <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            RWF {price.toLocaleString()}
          </p>
          <p className={`text-xs mt-0.5 ${isFull ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
            {isFull ? t('searchResultsSoldOut') : seatsLabel}
          </p>
        </div>
        {isFull ? (
          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
            {t('searchResultsUnavailable')}
          </span>
        ) : (
          <button
            onClick={() => onSelect(schedule)}
            className="btn-primary text-sm px-4 py-2"
          >
            {t('searchResultsSelect')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Search mode ──────────────────────────────────────────────────── */
function SearchMode({ searchParams, navigate, t, locale }) {
  const [form, setForm] = useState({
    from:  searchParams.get('from')  || '',
    to:    searchParams.get('to')    || '',
    date:  searchParams.get('date')  || todayLocal(),
    seats: searchParams.get('seats') || '1',
  });

  const [results,   setResults]   = useState(null);
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState(null);

  const hasSearchParams = !!(searchParams.get('from') && searchParams.get('to'));

  const runSearch = useCallback(async (f) => {
    setSearching(true);
    setError(null);
    try {
      const res = await bookingService.searchSchedules({
        from:  f.from,
        to:    f.to,
        date:  f.date,
        seats: parseInt(f.seats, 10) || 1,
      });
      setResults(res.data || []);
    } catch (err) {
      const errData = err?.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join('. ')
        : errData?.message || t('searchResultsError');
      setError(msg);
    } finally {
      setSearching(false);
    }
  }, [t]);

  useEffect(() => {
    if (hasSearchParams) {
      const f = {
        from:  searchParams.get('from') || '',
        to:    searchParams.get('to')   || '',
        date:  searchParams.get('date') || todayLocal(),
        seats: searchParams.get('seats') || '1',
      };
      setForm(f);
      runSearch(f);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const qs = new URLSearchParams(form).toString();
    navigate(`/passenger/book?${qs}`, { replace: true });
    runSearch(form);
  }

  function handleSelect(schedule) {
    const qs = new URLSearchParams({
      scheduleId: schedule.id,
      from:  form.from,
      to:    form.to,
      date:  form.date,
      seats: form.seats,
    }).toString();
    navigate(`/passenger/book?${qs}`);
  }

  const popularRoutes = [
    { from: 'NYABUGOGO', to: 'MUSANZE'   },
    { from: 'NYABUGOGO', to: 'NYAGATARE' },
    { from: 'NYABUGOGO', to: 'GICUMBI'   },
    { from: 'NYABUGOGO', to: 'GATUNA'    },
    { from: 'MUSANZE',   to: 'RUBAVU'    },
    { from: 'GICUMBI',   to: 'MUSANZE'   },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('passengerActionBookTrip')}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('bookSearchModeSubtitle')}</p>
      </div>

      {/* Search form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            {t('searchTripsWhereGoing')}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('from')}</label>
              <input
                name="from"
                value={form.from}
                onChange={handleChange}
                placeholder={t('searchTripsFromPlaceholder')}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('to')}</label>
              <input
                name="to"
                value={form.to}
                onChange={handleChange}
                placeholder={t('searchTripsToPlaceholder')}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('searchTripsTravelDate')}</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={todayLocal()}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('passengers')}</label>
              <select name="seats" value={form.seats} onChange={handleChange} className="input">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn-gradient px-8" disabled={searching}>
              {searching ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('searchResultsSearching')}
                </span>
              ) : t('searchTripsSearchBtn')}
            </button>
          </div>
        </form>

        {/* Popular routes */}
        <div className="mt-4 pt-4 border-t border-[#e8e3ff] dark:border-[#2d1a5e]">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
            {t('searchTripsPopularRoutes')}
          </p>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((r) => (
              <button
                key={`${r.from}-${r.to}`}
                type="button"
                onClick={() => setForm((f) => ({ ...f, from: r.from, to: r.to }))}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#e8e3ff] dark:border-[#2d1a5e]
                           bg-[#f8f7ff] dark:bg-[#130d2e] text-gray-600 dark:text-slate-300
                           hover:bg-brand-50 dark:hover:bg-brand-950 hover:border-brand-400 transition-colors"
              >
                {r.from} → {r.to}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {searching && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-9 h-9 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">{t('searchResultsSearching')}</p>
        </div>
      )}

      {!searching && error && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-gray-700 dark:text-white font-semibold mb-1">{t('searchResultsError')}</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{error}</p>
          <button onClick={() => runSearch(form)} className="btn-gradient text-sm">
            {t('searchResultsTryAgain')}
          </button>
        </div>
      )}

      {!searching && !error && results !== null && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
            {t('bookSearchResultsTitle')}
            <span className="ml-2 font-normal text-gray-400 dark:text-slate-500">
              ({results.length})
            </span>
          </h3>

          {results.length === 0 ? (
            <div className="text-center py-10 card">
              <div className="text-4xl mb-3">🚌</div>
              <p className="font-semibold text-gray-800 dark:text-white mb-1">
                {t('searchResultsNoTrips')}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {t('searchResultsNoTripsDesc', { date: form.date })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((s) => (
                <ScheduleResultCard
                  key={s.id}
                  schedule={s}
                  onSelect={handleSelect}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Booking mode (existing flow, unchanged) ──────────────────────── */
function BookingMode({ scheduleId, t, locale, navigate }) {
  const [schedule,    setSchedule]   = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState(null);
  const [seats,       setSeats]      = useState(1);
  const [submitting,  setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    bookingService.getScheduleById(scheduleId)
      .then((res) => setSchedule(res.data))
      .catch(() => setError(t('bookingNotFoundText')))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-400">{t('bookingLoadingSchedule')}</p>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('bookingNotFoundTitle')}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{error || t('bookingNotFoundText')}</p>
        <button onClick={() => navigate('/passenger/book')} className="btn-gradient">
          {t('bookingSearchTrips')}
        </button>
      </div>
    );
  }

  const price      = parseFloat(schedule.price);
  const maxSeats   = Math.min(schedule.seatsAvailable, 6);
  const totalPrice = price * seats;
  const hasDeparted = new Date() >= new Date(schedule.departureTime);
  const seatsLabel = seats > 1 ? t('bookingSeats') : t('bookingSeat');

  async function handleConfirm() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await bookingService.createBooking({ scheduleId: schedule.id, seats });
      navigate('/passenger/payment', {
        state: { booking: res.data, schedule },
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || t('bookingNotFoundText'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('bookingTitle')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('bookingSubtitle')}</p>
      </div>

      {/* Schedule details card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('bookingYourTrip')}</span>
          <span className="badge-brand">{schedule.company?.name}</span>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatTime(schedule.departureTime, locale)}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-0.5">
              {schedule.route?.origin}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            {schedule.route?.durationMin && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                {formatDuration(schedule.route.durationMin)}
              </p>
            )}
            <div className="w-full h-px bg-[#e8e3ff] dark:bg-[#2d1a5e] relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatTime(schedule.arrivalTime, locale)}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-0.5">
              {schedule.route?.destination}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 dark:text-slate-500">{t('bookingDate')}</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(schedule.departureTime, locale)}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-slate-500">{t('bookingBus')}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {schedule.bus?.model || 'Coach'} · {schedule.bus?.plateNumber}
            </p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-slate-500">{t('bookingAvailableSeats')}</p>
            <p className={`font-medium ${schedule.seatsAvailable <= 5 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
              {schedule.seatsAvailable}
            </p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-slate-500">{t('bookingPricePerSeat')}</p>
            <p className="font-medium text-brand-600 dark:text-brand-400">
              RWF {price.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Seat count selector */}
      <div className="card mb-6">
        <label className="label mb-2">{t('bookingNumberOfSeats')}</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSeats((s) => Math.max(1, s - 1))}
            disabled={seats <= 1}
            className="w-10 h-10 rounded-lg bg-[#f0ebff] dark:bg-[#2d1a5e] text-brand-700 dark:text-brand-300 font-bold text-xl disabled:opacity-40 hover:bg-brand-100 dark:hover:bg-[#3d2a6e] transition-colors"
          >
            −
          </button>
          <span className="text-2xl font-bold text-gray-900 dark:text-white w-6 text-center">{seats}</span>
          <button
            type="button"
            onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
            disabled={seats >= maxSeats}
            className="w-10 h-10 rounded-lg bg-[#f0ebff] dark:bg-[#2d1a5e] text-brand-700 dark:text-brand-300 font-bold text-xl disabled:opacity-40 hover:bg-brand-100 dark:hover:bg-[#3d2a6e] transition-colors"
          >
            +
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">
            {t('bookingMax', { max: maxSeats })}
          </span>
        </div>
      </div>

      {/* Price summary */}
      <div className="card mb-6 bg-[#f8f7ff] dark:bg-[#1a1035]">
        <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
          <span>RWF {price.toLocaleString()} × {seats} {seatsLabel}</span>
          <span>RWF {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-[#e8e3ff] dark:border-[#2d1a5e] pt-3 mt-2">
          <span>{t('bookingTotal')}</span>
          <span className="text-brand-600 dark:text-brand-400">RWF {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {hasDeparted && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
          {t('bookingDepartedWarning')}
        </div>
      )}
      {submitError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {submitError}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={submitting}
          className="btn-secondary flex-1"
        >
          {t('bookingBack')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || hasDeparted}
          className="btn-gradient flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {submitting ? t('bookingCreating') : t('bookingContinuePayment')}
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-600 mt-4 text-center">
        {t('bookingSeatsNote')}
      </p>
    </div>
  );
}

/* ── Root component ───────────────────────────────────────────────── */
export default function BookingPage() {
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language] || 'en-RW';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const scheduleId = parseInt(searchParams.get('scheduleId'), 10);
  const hasSchedule = scheduleId && !isNaN(scheduleId);

  if (hasSchedule) {
    return <BookingMode scheduleId={scheduleId} t={t} locale={locale} navigate={navigate} />;
  }

  return <SearchMode searchParams={searchParams} navigate={navigate} t={t} locale={locale} />;
}
